from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import PurchaseOrder
from inventory_management.services import create_inventory_movement


@transaction.atomic
def receive_purchase_order(purchase_order: PurchaseOrder, user):
    if purchase_order.status != 'approved':
        raise ValueError("Only approved purchase orders can be received.")

    for item in purchase_order.items.all():
        create_inventory_movement(
            product=item.product, quantity=item.quantity, movement_type="IN", user=user
        )

    today = timezone.now().date()
    
    purchase_order.status = 'received'
    purchase_order.received_date = today
    
    payment_terms = purchase_order.payment_terms or purchase_order.supplier.payment_terms
    purchase_order.payment_due_date = today + timedelta(days=payment_terms)
    
    purchase_order.save()
    return purchase_order
