from django.db import transaction
from .models import PurchaseOrder
from inventory_management.services import create_inventory_movement


@transaction.atomic
def receive_purchase_order(purchase_order: PurchaseOrder, user):
    if purchase_order.status != PurchaseOrder.STATUS_APPROVED:
        raise ValueError("Only approved purchase orders can be received.")

    for item in purchase_order.items.all():
        create_inventory_movement(
            product=item.product, quantity=item.quantity, movement_type="IN", user=user
        )

    today = timezone.now().date()
    term_days = purchase_order.supplier.payment_terms_days
    
    purchase_order.status = 'received'
    purchase_order.received_date = today
    
    purchase_order.payment_due_date = today + timedelta(days=term_days)
    
    purchase_order.save()
    return purchase_order
