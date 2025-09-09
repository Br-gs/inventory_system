from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.conf import settings


class Product(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def get_total_quantity(self):
        """Get total quantity of the product across all locations"""
        return (
            self.stock_locations.aggregate(total=models.Sum("quantity"))["total"] or 0
        )

    def get_quantity_at_location(self, location):
        """Get quantity of the product at a specific location"""
        try:
            stock = self.stock_locations.get(location=location)
            return stock.quantity
        except ProductLocationStock.DoesNotExist:
            return 0

    def __str__(self):
        return self.name


class ProductLocationStock(models.Model):
    """Stock of a product at a specific location"""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="stock_locations"
    )
    location = models.ForeignKey(
        "location.Location", 
        on_delete=models.CASCADE, 
        related_name="product_stocks",
    )
    quantity = models.IntegerField(default=0)

    class Meta:
        unique_together = ["product", "location"]
        ordering = ["location__name", "product__name"]

    def __str__(self):
        return f"{self.product.name} - {self.location.name}: {self.quantity}"


class InventoryMovement(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="movements"
    )
    location = models.ForeignKey(
        "location.Location",
        on_delete=models.CASCADE,
        related_name="inventory_movements",
    )
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    date = models.DateTimeField(auto_now_add=True)

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Unit price at the time of the movement (mainly for INPUT movements)",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_movements",
    )

    MOVEMENT_INPUT = "IN"
    MOVEMENT_OUTPUT = "OUT"
    MOVEMENT_ADJUSTMENT = "ADJ"
    MOVEMENT_TRANSFER = "TRF"
    MOVEMENT_TYPE_CHOICES = [
        (MOVEMENT_INPUT, "Input"),
        (MOVEMENT_OUTPUT, "Output"),
        (MOVEMENT_ADJUSTMENT, "Adjusting"),
        (MOVEMENT_TRANSFER, "Transfer"),
    ]
    movement_type = models.CharField(
        max_length=3,
        choices=MOVEMENT_TYPE_CHOICES,
        default=MOVEMENT_INPUT,
    )

    destination_location = models.ForeignKey(
        "location.Location",
        on_delete=models.CASCADE,
        related_name="incoming_transfers",
        null=True,
        blank=True,
        help_text="Destination location for transfers",
    )

    notes = models.TextField(blank=True)

    @property
    def total_value(self):
        """Calculate total value of the movement"""
        if self.unit_price:
            return self.quantity * self.unit_price
        return None

    def __str__(self):
        user_info = f" by {self.user.username}" if self.user else ""
        location_info = f" at {self.location.name}"
        destination_info = (
            f" → {self.destination_location.name}" if self.destination_location else ""
        )
        price_info = f" at ${self.unit_price}" if self.unit_price else ""

        return f"{self.product.name} - {self.get_movement_type_display()}{location_info}{destination_info} - {self.quantity}{price_info}{user_info}"
