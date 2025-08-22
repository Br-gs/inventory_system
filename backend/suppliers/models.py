from django.db import models
from django.utils import timezone
from datetime import timedelta
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
    payment_terms = models.PositiveIntegerField(
        default=30, 
        help_text="Payment terms in days (default is 30 days)"
    )

    products = models.ManyToManyField(Product, related_name="suppliers", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
    
    @property
    def last_purchase_date(self):
        """Get the date of the most recent purchase order from this supplier"""
        last_order = self.purchase_orders.order_by('-order_date').first()
        return last_order.order_date if last_order else None

    @property
    def payment_due_date(self):
        """Calculate when payment is due based on last purchase and payment terms"""
        if not self.last_purchase_date:
            return None
        return self.last_purchase_date + timedelta(days=self.payment_terms)

    @property
    def payment_status(self):
        """Get payment status information"""
        if not self.payment_due_date:
            return {
                'status': 'no_invoices',
                'text': 'No invoices',
                'days_diff': None,
                'css_class': 'text-gray-500'
            }
        
        today = timezone.now().date()
        due_date = self.payment_due_date
        
        if hasattr(due_date, 'date'):
            due_date = due_date.date()
            
        days_diff = (due_date - today).days

        if days_diff < 0:
            return {
                'status': 'overdue',
                'text': f'Overdue {abs(days_diff)} days',
                'days_diff': days_diff,
                'css_class': 'text-red-600 font-bold'
            }
        elif days_diff == 0:
            return {
                'status': 'due_today',
                'text': 'Due today',
                'days_diff': days_diff,
                'css_class': 'text-red-500 font-bold'
            }
        elif days_diff <= 3:
            return {
                'status': 'due_soon',
                'text': f'Due in {days_diff} days',
                'days_diff': days_diff,
                'css_class': 'text-yellow-600 font-bold'
            }
        elif days_diff <= 7:
            return {
                'status': 'due_week',
                'text': f'Due in {days_diff} days',
                'days_diff': days_diff,
                'css_class': 'text-yellow-500'
            }
        else:
            return {
                'status': 'current',
                'text': f'Due {due_date.strftime("%b %d, %Y")}',
                'days_diff': days_diff,
                'css_class': 'text-green-600'
            }

    @property 
    def total_outstanding_amount(self):
        """Calculate total outstanding amount from unpaid purchase orders"""
        outstanding_orders = self.purchase_orders.filter(
            status__in=['approved', 'received']
        )
        return sum(order.total_cost for order in outstanding_orders)

    class Meta:
        ordering = ["name"]
