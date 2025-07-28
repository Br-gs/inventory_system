from django.db import transaction
from .models import Product, InventoryMovement


@transaction.atomic
def create_inventory_movement(
    product: Product, quantity: int, movement_type: str
) -> InventoryMovement:
    """
    Create an inventory movement and update the product's stock accordingly.
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
        product=product, quantity=quantity, movement_type=movement_type
    )
    return movement
