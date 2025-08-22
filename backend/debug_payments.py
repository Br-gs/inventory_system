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
from django.db.models import F, ExpressionWrapper, DateField, Subquery, OuterRef

def debug_payment_issues():
    print("=== DEBUGGING PAYMENT DUE ISSUES ===\n")
    
    today = timezone.now().date()
    due_date_threshold = today + timedelta(days=7)
    
    print(f"Today: {today}")
    print(f"Due date threshold (7 days from today): {due_date_threshold}\n")
    
    # Check Purchase Orders
    print("1. CHECKING PURCHASE ORDERS:")
    print("="*50)
    all_pos = PurchaseOrder.objects.all()
    print(f"Total purchase orders: {all_pos.count()}")
    
    if all_pos.exists():
        for po in all_pos:
            print(f"PO #{po.id}: Supplier={po.supplier.name}, Status={po.status}")
            print(f"   Order Date: {po.order_date}")
            print(f"   Payment Due Date: {po.payment_due_date}")
            print(f"   Is Paid: {po.is_paid}")
            
            if po.payment_due_date and not po.is_paid:
                days_until_due = (po.payment_due_date - today).days
                print(f"   Days until due: {days_until_due}")
                if po.payment_due_date <= due_date_threshold:
                    print(f"   *** THIS ORDER IS DUE WITHIN 7 DAYS! ***")
            print()
    else:
        print("No purchase orders found!")
    
    # Check the count that dashboard uses
    print("\n2. DASHBOARD CALCULATION:")
    print("="*50)
    due_pos_count = PurchaseOrder.objects.filter(
        is_paid=False,
        payment_due_date__isnull=False,
        payment_due_date__lte=due_date_threshold
    ).count()
    print(f"Purchase orders due within 7 days (dashboard count): {due_pos_count}")
    
    # Check suppliers
    print("\n3. CHECKING SUPPLIERS:")
    print("="*50)
    suppliers = Supplier.objects.all()
    print(f"Total suppliers: {suppliers.count()}")
    
    for supplier in suppliers:
        print(f"\nSupplier: {supplier.name}")
        print(f"Payment terms: {supplier.payment_terms} days")
        print(f"Last purchase date: {supplier.last_purchase_date}")
        print(f"Payment due date: {supplier.payment_due_date}")
        print(f"Payment status: {supplier.payment_status}")
    
    # Check suppliers count calculation from dashboard
    print("\n4. SUPPLIERS DUE COUNT (Dashboard calculation):")
    print("="*50)
    due_suppliers_count = Supplier.objects.annotate(
        latest_order_date=Subquery(
            PurchaseOrder.objects.filter(
                supplier=OuterRef('pk')
            ).order_by('-order_date').values('order_date')[:1]
        )
    ).annotate(
        due_date=ExpressionWrapper(
            F('latest_order_date') + timedelta(days=1) * F('payment_terms'),
            output_field=DateField()
        )
    ).filter(
        due_date__lte=due_date_threshold,
        latest_order_date__isnull=False
    ).count()
    
    print(f"Suppliers with payments due within 7 days: {due_suppliers_count}")
    
    print("\n=== RECOMMENDATIONS ===")
    if due_pos_count == 0 and due_suppliers_count == 0:
        print("No payments are due within 7 days according to the current data.")
        print("If you expect a payment to be due, check:")
        print("1. Make sure purchase orders have payment_due_date set")
        print("2. Verify is_paid=False for unpaid orders")
        print("3. Check that the payment_due_date is within the next 7 days")

if __name__ == "__main__":
    debug_payment_issues()
