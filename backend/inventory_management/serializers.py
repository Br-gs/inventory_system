from rest_framework import serializers
from .models import Product, InventoryMovement

class ProductSerializer (serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'quantity', 'is_active']

class InventoryMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    class Meta:
        model = InventoryMovement
        fields = ['id', 'product', 'product_name', 'quantity', 'movement_type', 'movement_type_display', 'date',]
        read_only_fields = ['date', 'product_name', 'movement_type_display']
    
    def valide_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than zero.')
        return value
    
    def validate_product(self, product_instance):
        if not product_instance.is_active:
            raise serializers.ValidationError('This product is not active and can not receive any movement.')
        return product_instance
