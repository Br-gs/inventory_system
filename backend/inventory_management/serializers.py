from rest_framework import serializers
from .models import Product, InventoryMovement
from decimal import Decimal
from .services import create_inventory_movement
from django.db import transaction


class ProductSerializer(serializers.ModelSerializer):
    initial_quantity = serializers.IntegerField(
        write_only=True,
        required=False,
        default=0,
        min_value=0,
        help_text="Initial quantity for the product.",
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "quantity",
            "is_active",
            "initial_quantity",
        ]
        read_only_fields = ["quantity"]

    def validate_price(self, value):
        if not isinstance(value, Decimal):
            try:
                value = Decimal(str(value))
            except:
                raise serializers.ValidationError(
                    "Price must be a valid decimal number."
                )
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_name(self, value):
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Name must be at least 2 characters long."
            )
        return value.strip()

    @transaction.atomic
    def create(self, validated_data):
        initial_quantity = validated_data.pop("initial_quantity", 0)
        product = super().create(validated_data)

        if initial_quantity > 0:
            create_inventory_movement(
                product=product,
                quantity=initial_quantity,
                movement_type=InventoryMovement.MOVEMENT_INPUT,
                unit_price=product.price
            )
        
        product.refresh_from_db()  # Ensure the product has the latest data
        return product


class InventoryMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    movement_type_display = serializers.CharField(
        source="get_movement_type_display", read_only=True
    )
    user_username = serializers.CharField(source="user.username", read_only=True, allow_null=True)
    total_value = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = InventoryMovement
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "unit_price",
            "total_value",
            "movement_type",
            "movement_type_display",
            "date",
            "user_username",
        ]
        read_only_fields = ["date", "product_name", "movement_type_display", "user_username", "total_value"]

    def validate_quantity(self, value):
        if not isinstance(value, int):
            raise serializers.ValidationError("Quantity must be a positive integer.")
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def validate_product(self, product_instance):
        if not product_instance.is_active:
            raise serializers.ValidationError(
                "This product is not active and can not receive any movement."
            )
        return product_instance

    def create(self, validated_data):
        try:
            user = self.context['request'].user
            movement = create_inventory_movement(
                product=validated_data["product"],
                quantity=validated_data["quantity"],
                movement_type=validated_data["movement_type"],
                user=user,
                unit_price=validated_data.get("unit_price")
            )
            return movement
        except ValueError as e:
            raise serializers.ValidationError(
                f"Error creating inventory movement: {str(e)}"
            )