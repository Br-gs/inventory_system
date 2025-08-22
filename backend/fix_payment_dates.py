#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory.settings')
django.setup()

from django.utils import timezone
from purchasing.models import PurchaseOrder
from suppliers.models import Supplier

def fix_payment_due_dates():
    print("=== FIXING PAYMENT DUE DATES ===\n")
    
    # Get all purchase orders without payment_due_date
    pos_without_due_date = PurchaseOrder.objects.filter(payment_due_date__isnull=True)
    
    print(f"Found {pos_without_due_date.count()} purchase orders without payment due dates")
    
    updated_count = 0
    
    for po in pos_without_due_date:
        # Calculate payment due date based on order date + supplier payment terms
        if po.supplier.payment_terms:
            payment_due_date = po.order_date.date() + timedelta(days=po.supplier.payment_terms)
            po.payment_due_date = payment_due_date
            po.save()
            
            print(f"Updated PO #{po.id}: Order Date: {po.order_date.date()}, "
                  f"Payment Terms: {po.supplier.payment_terms} days, "
                  f"Payment Due Date: {payment_due_date}")
            updated_count += 1
    
    print(f"\nUpdated {updated_count} purchase orders with payment due dates")
    
    # Verify the fix
    print("\n=== VERIFICATION ===")
    today = timezone.now().date()
    due_date_threshold = today + timedelta(days=7)
    
    due_pos_count = PurchaseOrder.objects.filter(
        is_paid=False,
        payment_due_date__isnull=False,
        payment_due_date__lte=due_date_threshold
    ).count()
    
    print(f"Purchase orders due within 7 days: {due_pos_count}")
    
    # Show which ones are due
    due_pos = PurchaseOrder.objects.filter(
        is_paid=False,
        payment_due_date__isnull=False,
        payment_due_date__lte=due_date_threshold
    )
    
    for po in due_pos:
        days_until_due = (po.payment_due_date - today).days
        print(f"  - PO #{po.id} ({po.supplier.name}): Due in {days_until_due} days ({po.payment_due_date})")

if __name__ == "__main__":
    fix_payment_due_dates()
