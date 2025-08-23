from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import PurchaseOrder
from inventory_management.services import create_inventory_movement
from decimal import Decimal, ROUND_HALF_UP

def calculate_weighted_average_cost(current_quantity, current_price, new_quantity, new_price):
    """
    Calculate weighted average cost based on current inventory and new purchase.
    
    Args:
        current_quantity (int): Current quantity in stock
        current_price (Decimal): Current unit price
        new_quantity (int): New quantity being added
        new_price (Decimal): New unit price
    
    Returns:
        Decimal: New weighted average price rounded to 2 decimal places
    """
    if current_quantity == 0:
        # If no current stock, new price becomes the price
        return Decimal(str(new_price)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    # Convert to Decimal for precise calculations
    current_qty = Decimal(str(current_quantity))
    current_pr = Decimal(str(current_price))
    new_qty = Decimal(str(new_quantity))
    new_pr = Decimal(str(new_price))
    
    # Calculate current inventory value
    current_value = current_qty * current_pr
    
    # Calculate new purchase value
    new_value = new_qty * new_pr
    
    # Calculate total value and quantity
    total_value = current_value + new_value
    total_quantity = current_qty + new_qty
    
    # Calculate weighted average price
    weighted_avg_price = total_value / total_quantity
    
    # Round to 2 decimal places
    return weighted_avg_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

@transaction.atomic
def receive_purchase_order(purchase_order: PurchaseOrder, user):
    if purchase_order.status != 'approved':
        raise ValueError("Only approved purchase orders can be received.")

    for item in purchase_order.items.all():
        # Get current product data before creating movement
        product = item.product
        current_quantity = product.quantity
        current_price = product.price
        
        # Calculate new weighted average cost
        new_avg_cost = calculate_weighted_average_cost(
            current_quantity=current_quantity,
            current_price=current_price,
            new_quantity=item.quantity,
            new_price=item.cost_per_unit
        )
        
        # Create inventory movement (this will update the quantity)
        create_inventory_movement(
            product=product, 
            quantity=item.quantity, 
            movement_type="IN", 
            user=user
        )
        
        # Update the product price to the new weighted average
        product.refresh_from_db()  # Get updated quantity after movement
        product.price = new_avg_cost
        product.save()

    today = timezone.now().date()
    
    purchase_order.status = 'received'
    purchase_order.received_date = today
    
    payment_terms = purchase_order.payment_terms or purchase_order.supplier.payment_terms
    purchase_order.payment_due_date = today + timedelta(days=payment_terms)
    
    purchase_order.save()
    return purchase_order
