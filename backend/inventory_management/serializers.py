from rest_framework import serializers
from .models import Product, InventoryMovement

class ProductSerializer (serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'quantity']

class InventoryMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = InventoryMovement
        fields = ['id', 'product', 'quantity', 'date', 'movement_type',]
        read_only_fields = ['date']
