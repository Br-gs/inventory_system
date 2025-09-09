from rest_framework import serializers
from django.db import transaction
from .models import PurchaseOrder, PurchaseOrderItem
from suppliers.serializers import SupplierSerializer
from inventory_management.serializers import ProductSerializer
from location.serializers import LocationSerializer
from location.models import Location
from .services import calculate_weighted_average_cost
from inventory_management.services import create_inventory_movement
from django.utils import timezone
from datetime import timedelta


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = ["id", "product", "product_id", "quantity", "cost_per_unit"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    """
    Serializer for purchase orders with location support.
    """

    items = PurchaseOrderItemSerializer(many=True)
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.IntegerField(write_only=True)
    destination_location = LocationSerializer(read_only=True)
    destination_location_id = serializers.IntegerField(write_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "supplier",
            "supplier_id",
            "destination_location",
            "destination_location_id",
            "status",
            "status_display",
            "order_date",
            "created_by",
            "total_cost",
            "items",
            "payment_terms",
            "payment_due_date",
            "is_paid",
            "received_date",
        ]
        read_only_fields = ["created_by", "total_cost", "order_date"]

    def validate_destination_location_id(self, value):
        """Validate that the user has access to the destination location"""
        user = self.context["request"].user

        if not user.is_staff and hasattr(user, "profile"):
            try:
                location = Location.objects.get(id=value)
                if not user.profile.can_access_location(location):
                    raise serializers.ValidationError(
                        "You don't have permission to create purchase orders for this location"
                    )
            except Location.DoesNotExist:
                raise serializers.ValidationError("Location not found")

        return value

    def validate_status(self, value):
        """Validate that status cannot be changed once it's 'received'."""
        if self.instance and self.instance.status == "received" and value != "received":
            raise serializers.ValidationError(
                "Cannot change status of a received purchase order. Once received, the status is final."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        supplier_id = validated_data.pop("supplier_id")
        destination_location_id = validated_data.pop("destination_location_id")

        # Set default location if not provided
        if not destination_location_id:
            user = self.context["request"].user
            if hasattr(user, "profile") and user.profile.default_location:
                destination_location_id = user.profile.default_location.id
            else:
                raise serializers.ValidationError("destination_location_id is required")

        validated_data["supplier_id"] = supplier_id
        validated_data["destination_location_id"] = destination_location_id
        validated_data["created_by"] = self.context["request"].user

        purchase_order = PurchaseOrder.objects.create(**validated_data)

        # Create items
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, **item_data)

        return purchase_order

    @transaction.atomic
    def update(self, instance, validated_data):
        old_status = instance.status
        items_data = validated_data.pop("items", None)
        supplier_id = validated_data.pop("supplier_id", None)
        destination_location_id = validated_data.pop("destination_location_id", None)

        if supplier_id:
            validated_data["supplier_id"] = supplier_id
        if destination_location_id:
            validated_data["destination_location_id"] = destination_location_id

        new_status = validated_data.get("status", instance.status)

        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update items if provided
        if items_data is not None:
            instance.items.all().delete()
            new_items = [
                PurchaseOrderItem(
                    purchase_order=instance,
                    product_id=item_data["product_id"],
                    quantity=item_data["quantity"],
                    cost_per_unit=item_data["cost_per_unit"],
                )
                for item_data in items_data
            ]
            PurchaseOrderItem.objects.bulk_create(new_items, ignore_conflicts=True)

        # Handle inventory if received
        inventory_processed = False
        if old_status != "received" and new_status == "received":
            if not instance.received_date:
                instance.received_date = timezone.now().date()

            if not instance.payment_due_date:
                payment_terms = (
                    instance.payment_terms or instance.supplier.payment_terms
                )
                instance.payment_due_date = instance.received_date + timedelta(
                    days=payment_terms
                )

            total_items = self._process_received_inventory(
                instance, self.context["request"].user
            )
            inventory_processed = True

        instance.save()

        if inventory_processed:
            instance._inventory_processed = True
            instance._items_processed = sum(
                item.quantity for item in instance.items.all()
            )

        return instance

    def _process_received_inventory(self, purchase_order, user):
        """Process inventory updates when purchase order is marked as received."""
        total_items = 0
        for item in purchase_order.items.all():
            product = item.product

            # Get current stock at destination location
            from inventory_management.models import ProductLocationStock

            try:
                location_stock = ProductLocationStock.objects.get(
                    product=product, location=purchase_order.destination_location
                )
                current_quantity = location_stock.quantity
            except ProductLocationStock.DoesNotExist:
                current_quantity = 0

            current_price = product.price

            # Calculate new weighted average cost
            new_avg_cost = calculate_weighted_average_cost(
                current_quantity=current_quantity,
                current_price=current_price,
                new_quantity=item.quantity,
                new_price=item.cost_per_unit,
            )

            # Create inventory movement (updates quantity at location)
            create_inventory_movement(
                product=product,
                location=purchase_order.destination_location,
                quantity=item.quantity,
                movement_type="IN",
                user=user,
                unit_price=item.cost_per_unit,
                notes=f"Purchase Order #{purchase_order.id} - {purchase_order.supplier.name}",
            )

            # Update product price (global price)
            product.refresh_from_db()
            product.price = new_avg_cost
            product.save()

            total_items += item.quantity

        return total_items
