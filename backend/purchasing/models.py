from django.db import models
from django.contrib.auth.models import User
from inventory_management.models import Product
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from suppliers.models import Supplier

class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('received', 'Received'),
        ('canceled', 'Canceled'),
    ]

    supplier = models.ForeignKey(
        Supplier, 
        on_delete=models.PROTECT, 
        related_name='purchase_orders'
    )
    order_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    received_date = models.DateField(null=True, blank=True)
    payment_due_date = models.DateField(null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    payment_terms = models.PositiveIntegerField(
        default=30,
        null=True, 
        blank=True,
        help_text="Payment terms in days for this specific order"
    )

    @property
    def total_cost(self):
        return self.items.aggregate(
            total=Sum(models.F('quantity') * models.F('cost_per_unit'))
        )['total'] or 0

    @property
    def status_display(self):
        return dict(self.STATUS_CHOICES)[self.status]

    def save(self, *args, **kwargs):
        # Use order-specific payment terms if set, otherwise use supplier default
        if not self.payment_terms and self.supplier:
            self.payment_terms = self.supplier.payment_terms
        
        # Auto-calculate payment due date based on payment terms
        if not self.payment_due_date and self.payment_terms:
            if self.order_date:
                self.payment_due_date = self.order_date.date() + timedelta(days=self.payment_terms)
        super().save(*args, **kwargs)

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