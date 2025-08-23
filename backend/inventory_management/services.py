from django.db import transaction
from .models import Product, InventoryMovement
from django.contrib.auth.models import User

@transaction.atomic
def create_inventory_movement(
    product: Product, quantity: int, movement_type: str, user: User
) -> InventoryMovement:
    """
    Create an inventory movement and update the product's stock accordingly.

    Args:
        product (Product): The product to move
        quantity (int): Quantity to move
        movement_type (str): Type of movement (IN, OUT, ADJ)
        user (User, optional): User performing the movement
    
    Returns:
        InventoryMovement: Created movement record
    """
    # validate movement type
    if not product.is_active:
        raise ValueError(f"Product {product.name} is not active.")

    if quantity <= 0:
        raise ValueError("Quantity must be greater than zero.")

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

    # create inventory movement record
    movement = InventoryMovement.objects.create(
        product=product, 
        quantity=quantity, 
        movement_type=movement_type,
        user=user
    )
    return movement
