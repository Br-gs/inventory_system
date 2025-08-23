from rest_framework import serializers
from django.db import transaction
from .models import PurchaseOrder, PurchaseOrderItem
from suppliers.serializers import SupplierSerializer
from inventory_management.serializers import ProductSerializer
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
    Serializer for purchase orders. Handles nested item creation.
    """

    # For reading, we use the nested serializer to display the items.
    items = PurchaseOrderItemSerializer(many=True)
    # For reading, we show the supplier details.
    supplier = SupplierSerializer(read_only=True)
    # For writing, we only need the provider ID.
    supplier_id = serializers.IntegerField(write_only=True)
    # For reading, we show the readable status.
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

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        supplier_id = validated_data.pop("supplier_id")

        # We assign the supplier and the user who creates the order.
        validated_data["supplier_id"] = supplier_id
        validated_data["created_by"] = self.context["request"].user

        purchase_order = PurchaseOrder.objects.create(**validated_data)

        # Create the purchase order items
        for item_data in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order, **item_data
            )

        # total_cost is automatically calculated by the property
        return purchase_order

    @transaction.atomic
    def update(self, instance, validated_data):
        # Store the old status to detect changes
        old_status = instance.status
        
        # Handle items update if provided
        items_data = validated_data.pop("items", None)
        
        # Update supplier if provided
        supplier_id = validated_data.pop("supplier_id", None)
        if supplier_id:
            validated_data["supplier_id"] = supplier_id
        
        # Update the purchase order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # If items are provided, update them
        if items_data is not None:
            instance.items.all().delete()

            new_items = []
            for item_data in items_data:
                new_items.append(
                    PurchaseOrderItem(
                        purchase_order=instance,
                        product_id=item_data['product_id'],
                        quantity=item_data['quantity'],
                        cost_per_unit=item_data['cost_per_unit']
                    )
                )
            PurchaseOrderItem.objects.bulk_create(new_items, ignore_conflicts=True)

        # Check if status changed to 'received' and process inventory
        new_status = validated_data.get('status', instance.status)
        if old_status != 'received' and new_status == 'received':
            # Set received_date if not already set
            if not instance.received_date:
                instance.received_date = timezone.now().date()
            
            # Calculate payment due date if not set
            if not instance.payment_due_date:
                payment_terms = instance.payment_terms or instance.supplier.payment_terms
                instance.payment_due_date = instance.received_date + timedelta(days=payment_terms)
            
            # Process inventory updates
            self._process_received_inventory(instance, self.context["request"].user)
        
        instance.save()
        return instance

    def _process_received_inventory(self, purchase_order, user):
        """
        Process inventory updates when purchase order is marked as received
        """
        for item in purchase_order.items.all():
            # Get current product data before creating movement
            product = item.product
            current_quantity = product.quantity
            current_price = product.price
            
            # Calculate new weighted average cost
            new_avg_cost = calculate_weighted_average_cost(
                current_quantity=current_quantity,
                current_price=current_price,
                new_quantity=item.quantity,
                new_price=item.cost_per_unit
            )
            
            # Create inventory movement (this will update the quantity)
            create_inventory_movement(
                product=product, 
                quantity=item.quantity, 
                movement_type="IN", 
                user=user
            )
            
            # Update the product price to the new weighted average
            product.refresh_from_db()  # Get updated quantity after movement
            product.price = new_avg_cost
            product.save()