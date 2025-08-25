from django.db import transaction
from .models import Product, InventoryMovement
from django.contrib.auth.models import User

@transaction.atomic
def create_inventory_movement(
    product: Product,
     quantity: int,
     movement_type: str,
     user: User,
     unit_price: float = None
) -> InventoryMovement:
    """
    Create an inventory movement and update the product's stock accordingly.

    Args:
        product (Product): The product to move
        quantity (int): Quantity to move
        movement_type (str): Type of movement (IN, OUT, ADJ)
        user (User, optional): User performing the movement
        unit_price (float, optional): Unit price for INPUT movements
    
    Returns:
        InventoryMovement: Created movement record
    """
    # validate movement type
    if not product.is_active:
        raise ValueError(f"Product {product.name} is not active.")

    if quantity <= 0:
        raise ValueError("Quantity must be greater than zero.")

    if unit_price is None and movement_type in [InventoryMovement.MOVEMENT_INPUT, InventoryMovement.MOVEMENT_OUTPUT]:
        unit_price = product.price

    # update product stock
    if movement_type == InventoryMovement.MOVEMENT_INPUT:
        product.quantity += quantity
    elif movement_type == InventoryMovement.MOVEMENT_OUTPUT:
        if product.quantity < quantity:
            raise ValueError(
                f"Insufficient stock of {product.name} for output movement."
            )
        product.quantity -= quantity
    elif movement_type == InventoryMovement.MOVEMENT_ADJUSTMENT:
        product.quantity = quantity
    else:
        raise ValueError(f"Invalid movement type: {movement_type}")

    product.save()

    movement = InventoryMovement.objects.create(
        product=product, 
        quantity=quantity, 
        movement_type=movement_type,
        user=user,
        unit_price=unit_price
    )
    return movement
