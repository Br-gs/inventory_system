from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    number = models.IntegerField()

    def __str__(self):
        return self.name

class InventoryMovement(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    number = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=50)  

    def __str__(self):
        return f"{self.product.name} - {self.type} - {self.number}"

