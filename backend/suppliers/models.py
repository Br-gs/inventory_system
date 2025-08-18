from django.db import models
from inventory_management.models import Product


class Supplier(models.Model):
    name = models.CharField(
        max_length=255, help_text="Name or business name of the supplier"
    )
    tax_id = models.CharField(
        max_length=50, unique=True, help_text="NIT or tax identification number"
    )
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    contact_person = models.CharField(
        max_length=100, blank=True, help_text="Main contact name"
    )
    payment_terms = models.CharField(
        max_length=100,
        blank=True,
    )

    products = models.ManyToManyField(Product, related_name="suppliers", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
