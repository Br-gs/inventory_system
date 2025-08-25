from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.conf import settings 


class Product(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class InventoryMovement(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="movements"
    )
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    date = models.DateTimeField(auto_now_add=True)

    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Unit price at the time of the movement (mainly for INPUT movements)"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_movements"
    )

    MOVEMENT_INPUT = "IN"
    MOVEMENT_OUTPUT = "OUT"
    MOVEMENT_ADJUSTMENT = "ADJ"
    MOVEMENT_TYPE_CHOICES = [
        (MOVEMENT_INPUT, "Input"),
        (MOVEMENT_OUTPUT, "Output"),
        (MOVEMENT_ADJUSTMENT, "Adjusting"),
    ]
    movement_type = models.CharField(
        max_length=3,
        choices=MOVEMENT_TYPE_CHOICES,
        default=MOVEMENT_INPUT,
    )

    @property
    def total_value(self):
        """Calculate total value of the movement"""
        if self.unit_price:
            return self.quantity * self.unit_price
        return None

    def __str__(self):
        user_info = f" by {self.user.username}" if self.user else ""
        price_info = f" at ${self.unit_price}" if self.unit_price else ""
        return f"{self.product.name} - {self.get_movement_type_display()} - {self.quantity}{price_info}{user_info}"
