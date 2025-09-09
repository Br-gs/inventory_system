from rest_framework import serializers
from .models import Product, InventoryMovement, ProductLocationStock
from location.serializers import LocationSerializer
from location.models import Location
from decimal import Decimal
from .services import create_inventory_movement
from django.db import transaction


class ProductLocationStockSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source="location.name", read_only=True)
    location = LocationSerializer(read_only=True)

    class Meta:
        model = ProductLocationStock
        fields = ["location", "location_name", "quantity"]


class ProductSerializer(serializers.ModelSerializer):
    stock_locations = ProductLocationStockSerializer(many=True, read_only=True)
    total_quantity = serializers.SerializerMethodField()
    initial_quantity = serializers.IntegerField(
        write_only=True,
        required=False,
        default=0,
        min_value=0,
        help_text="Initial quantity for the product.",
    )
    initial_location = serializers.IntegerField(
        write_only=True,
        required=False,
        help_text="Initial location ID for the product stock.",
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "is_active",
            "stock_locations",
            "total_quantity",
            "initial_quantity",
            "initial_location",
        ]

    def get_total_quantity(self, obj):
        return obj.get_total_quantity()

    @transaction.atomic
    def create(self, validated_data):
        initial_quantity = validated_data.pop("initial_quantity", 0)
        initial_location_id = validated_data.pop("initial_location", None)

        product = super().create(validated_data)

        if initial_quantity > 0:
            if not initial_location_id:
                # Try to get user's default location
                user = self.context.get("request").user
                location_id = getattr(user, "default_location_id", None)
                if not location_id:
                    first_location = Location.objects.filter(is_active=True).first()
                    if not first_location:
                        raise serializers.ValidationError(
                            "No active locations available. Please create a location first."
                        )
                    location_id = first_location.id
            else:
                location_id = initial_location_id

            location = Location.objects.get(id=location_id)

            create_inventory_movement(
                product=product,
                location=location,
                quantity=initial_quantity,
                movement_type=InventoryMovement.MOVEMENT_INPUT,
                user=self.context.get("request").user,
                unit_price=product.price,
            )

        return product


class InventoryMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    location_name = serializers.CharField(source="location.name", read_only=True)
    destination_location_name = serializers.CharField(
        source="destination_location.name", read_only=True
    )
    movement_type_display = serializers.CharField(
        source="get_movement_type_display", read_only=True
    )
    user_username = serializers.CharField(
        source="user.username", read_only=True, allow_null=True
    )
    total_value = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = InventoryMovement
        fields = [
            "id",
            "product",
            "product_name",
            "location",
            "location_name",
            "destination_location",
            "destination_location_name",
            "quantity",
            "unit_price",
            "total_value",
            "movement_type",
            "movement_type_display",
            "date",
            "user_username",
            "notes",
        ]
        read_only_fields = [
            "date",
            "product_name",
            "location_name",
            "destination_location_name",
            "movement_type_display",
            "user_username",
            "total_value",
        ]

    def validate(self, data):
        movement_type = data.get("movement_type")
        destination_location = data.get("destination_location")

        if movement_type == InventoryMovement.MOVEMENT_TRANSFER:
            if not destination_location:
                raise serializers.ValidationError(
                    "Destination location is required for transfers"
                )
            if destination_location == data.get("location"):
                raise serializers.ValidationError(
                    "Destination location must be different from source location"
                )

        return data

    def create(self, validated_data):
        try:
            user = self.context["request"].user

            # if location is not provided, use user's default location
            if "location" not in validated_data:
                if hasattr(user, "default_location_id") and user.default_location_id:
                    validated_data["location"] = Location.objects.get(
                        id=user.default_location_id
                    )
                else:
                    raise serializers.ValidationError(
                        "Location is required. User has no default location."
                    )

            movement = create_inventory_movement(
                product=validated_data["product"],
                location=validated_data["location"],
                quantity=validated_data["quantity"],
                movement_type=validated_data["movement_type"],
                user=user,
                unit_price=validated_data.get("unit_price"),
                destination_location=validated_data.get("destination_location"),
                notes=validated_data.get("notes", ""),
            )
            return movement
        except ValueError as e:
            raise serializers.ValidationError(
                f"Error creating inventory movement: {str(e)}"
            )
