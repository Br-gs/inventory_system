from django.contrib import admin
from .models import Product, InventoryMovement


class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'quantity', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')


class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'movement_type', 'quantity', 'date')
    list_filter = ('movement_type', 'date')
    search_fields = ('product__name',)


admin.site.register(Product, ProductAdmin)
admin.site.register(InventoryMovement, InventoryMovementAdmin)