from django.db import models, transaction
from django.core.validators import MinValueValidator


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

    def __str__(self):
        return f"{self.product.name} - {self.get_movement_type_display()} - {self.quantity}"
