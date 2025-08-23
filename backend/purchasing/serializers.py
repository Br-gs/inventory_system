from rest_framework import serializers
from django.db import transaction
from .models import PurchaseOrder, PurchaseOrderItem
from suppliers.serializers import SupplierSerializer
from inventory_management.serializers import ProductSerializer

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
        # Handle items update if provided
        items_data = validated_data.pop("items", None)
        
        # Update supplier if provided
        supplier_id = validated_data.pop("supplier_id", None)
        if supplier_id:
            validated_data["supplier_id"] = supplier_id
        
        # Update the purchase order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
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

        return instance
