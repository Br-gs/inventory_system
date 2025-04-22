from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator



class Product(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(validators=[MinValueValidator(0)])

    def __str__(self):
        return self.name

class InventoryMovement(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    MOVEMENT_INPUT = 'IN'
    MOVEMENT_OUTPUT = 'OUT'
    MOVEMENT_ADJUSTMENT = 'ADJ'
    MOVEMENT_TYPE_CHOICES = [
        (MOVEMENT_INPUT, 'input'),
        (MOVEMENT_OUTPUT, 'output'),
        (MOVEMENT_ADJUSTMENT, 'adjusting'),
    ]
    movement_type = models.CharField(
        max_length=3,
        choices=MOVEMENT_TYPE_CHOICES,
        default=MOVEMENT_INPUT,
    )  

    def __str__(self):
        return f"{self.product.name} - {self.get_movement_type_display()} - {self.quantity}"

