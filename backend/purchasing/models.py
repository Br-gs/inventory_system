from django.db import models
from django.contrib.auth.models import User
from inventory_management.models import Product
from django.db.models import Sum
from django.utils import timezone

class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('received', 'Received'),
        ('canceled', 'Canceled'),
    ]

    supplier = models.ForeignKey(
        'suppliers.Supplier', 
        on_delete=models.CASCADE, 
        related_name='purchase_orders'
    )
    order_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_cost(self):
        return self.items.aggregate(
            total=Sum(models.F('quantity') * models.F('cost_per_unit'))
        )['total'] or 0

    @property
    def status_display(self):
        return dict(self.STATUS_CHOICES)[self.status]

    def __str__(self):
        return f"PO #{self.id} - {self.supplier.name}"

    class Meta:
        ordering = ['-order_date']


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(
        PurchaseOrder, 
        on_delete=models.CASCADE, 
        related_name='items'
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def total_cost(self):
        return self.quantity * self.cost_per_unit

    def __str__(self):
        return f"{self.product.name} - {self.quantity} units"

    class Meta:
        unique_together = ['purchase_order', 'product']