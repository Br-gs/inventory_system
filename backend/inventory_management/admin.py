from django.contrib import admin
from .models import Product, InventoryMovement

admin.site.register(Product)
admin.site.register(InventoryMovement)