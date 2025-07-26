from rest_framework import serializers
from .models import Product, InventoryMovement
from decimal import Decimal
class ProductSerializer (serializers.ModelSerializer):
    initial_quantity = serializers.IntegerField(
        write_only=True, required=False, default=0, min_value=0, help_text="Initial quantity for the product."
    )
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'quantity', 'is_active', 'initial_quantity']
        read_only_fields = ['id', 'quantity']

    def validate_price(self, value):
        if not isinstance(value, Decimal):
            try:
                value = Decimal(str(value))
            except:
                raise serializers.ValidationError('Price must be a valid decimal number.')
        if value <= Decimal('0.00'):
            raise serializers.ValidationError('Price must be greater than zero.')
        return value

    def validate_name(self, value):
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError('Name must be at least 2 characters long.')
        return value.strip()
    
    def create(self, validated_data):
        initial_quantity = validated_data.pop('initial_quantity', 0)
        validated_data['quantity'] = 0
        product = super().create(validated_data)
        if initial_quantity > 0:
            InventoryMovement.objects.create(
                product=product,
                quantity=initial_quantity,
                movement_type=InventoryMovement.MOVEMENT_INPUT
            )
            product.refresh_from_db()
        return product

class InventoryMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    class Meta:
        model = InventoryMovement
        fields = ['id', 'product', 'product_name', 'quantity', 'movement_type', 'movement_type_display', 'date',]
        read_only_fields = ['date', 'product_name', 'movement_type_display']
    
    def validate_quantity(self, value):
        if not isinstance(value, int):
            raise serializers.ValidationError('Quantity must be a positive integer.')
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than zero.')
        return value
    
    def validate_product(self, product_instance):
        if not product_instance.is_active:
            raise serializers.ValidationError('This product is not active and can not receive any movement.')
        return product_instance

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(f'Error creating inventory movement: {str(e)}')