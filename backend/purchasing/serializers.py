from rest_framework import serializers
from django.db import transaction
from .models import PurchaseOrder, PurchaseOrderItem
from suppliers.serializers import SupplierSerializer
from inventory_management.serializers import ProductSerializer
from .services import calculate_weighted_average_cost, receive_purchase_order
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
    Serializer for purchase orders. Handles nested item creation and updates.
    """

    # For reading, show nested items
    items = PurchaseOrderItemSerializer(many=True)

    # For reading, show supplier details
    supplier = SupplierSerializer(read_only=True)

    # For writing, only need supplier_id
    supplier_id = serializers.IntegerField(write_only=True)

    # For reading, display status name
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "supplier",
            "supplier_id",
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

    def validate_status(self, value):
        """
        Validate that status cannot be changed once it's 'received'.
        """
        if self.instance and self.instance.status == "received" and value != "received":
            raise serializers.ValidationError(
                "Cannot change status of a received purchase order. Once received, the status is final."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        supplier_id = validated_data.pop("supplier_id")

        # Assign supplier and user
        validated_data["supplier_id"] = supplier_id
        validated_data["created_by"] = self.context["request"].user

        purchase_order = PurchaseOrder.objects.create(**validated_data)

        # Create items
        for item_data in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order, **item_data
            )

        return purchase_order

    @transaction.atomic
    def update(self, instance, validated_data):
        old_status = instance.status
        print(f"DEBUG: Old status: {old_status}")

        items_data = validated_data.pop("items", None)

        supplier_id = validated_data.pop("supplier_id", None)
        if supplier_id:
            validated_data["supplier_id"] = supplier_id

        new_status = validated_data.get("status", instance.status)
        print(f"DEBUG: New status: {new_status}")

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
            print("DEBUG: Processing inventory for received order")

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
            print(f"DEBUG: Inventory processed, total items: {total_items}")

        instance.save()

        if inventory_processed:
            instance._inventory_processed = True
            instance._items_processed = sum(
                item.quantity for item in instance.items.all()
            )

        return instance

    def _process_received_inventory(self, purchase_order, user):
        """
        Process inventory updates when purchase order is marked as received.
        """
        total_items = 0
        for item in purchase_order.items.all():
            product = item.product
            current_quantity = product.quantity
            current_price = product.price

            # Calculate new weighted average cost
            new_avg_cost = calculate_weighted_average_cost(
                current_quantity=current_quantity,
                current_price=current_price,
                new_quantity=item.quantity,
                new_price=item.cost_per_unit,
            )

            # Create inventory movement (updates quantity)
            create_inventory_movement(
                product=product,
                quantity=item.quantity,
                movement_type="IN",
                user=user,
                unit_price=item.cost_per_unit 
            )

            # Update product price
            product.refresh_from_db()
            product.price = new_avg_cost
            product.save()

            total_items += item.quantity

        return total_items
