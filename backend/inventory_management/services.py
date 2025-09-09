from django.db import transaction
from .models import Product, InventoryMovement, ProductLocationStock
from django.contrib.auth.models import User


@transaction.atomic
def create_inventory_movement(
    product: Product,
    location,
    quantity: int,
    movement_type: str,
    user: User,
    unit_price: float = None,
    destination_location=None,
    notes: str = "",
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

    stock, created = ProductLocationStock.objects.get_or_create(
        product=product, location=location, defaults={"quantity": 0}
    )

    if unit_price is None and movement_type in [
        InventoryMovement.MOVEMENT_INPUT,
        InventoryMovement.MOVEMENT_OUTPUT,
    ]:
        unit_price = product.price

    # update product stock
    if movement_type == InventoryMovement.MOVEMENT_INPUT:
        stock.quantity += quantity
    elif movement_type == InventoryMovement.MOVEMENT_OUTPUT:
        if stock.quantity < quantity:
            raise ValueError(
                f"Insufficient stock of {product.name} at {location.name}. "
                f"Available: {stock.quantity}, Requested: {quantity}"
            )
        stock.quantity -= quantity
    elif movement_type == InventoryMovement.MOVEMENT_ADJUSTMENT:
        stock.quantity = quantity
    elif movement_type == InventoryMovement.MOVEMENT_TRANSFER:
        if not destination_location:
            raise ValueError("Destination location is required for transfers")
        if stock.quantity < quantity:
            raise ValueError(
                f"Insufficient stock of {product.name} at {location.name} for transfer"
            )

        # Deduct from source location
        stock.quantity -= quantity

        # Add to destination location
        dest_stock, _ = ProductLocationStock.objects.get_or_create(
            product=product, location=destination_location, defaults={"quantity": 0}
        )
        dest_stock.quantity += quantity
        dest_stock.save()
    else:
        raise ValueError(f"Invalid movement type: {movement_type}")

    stock.save()

    # create inventory movement record
    movement = InventoryMovement.objects.create(
        product=product,
        location=location,
        quantity=quantity,
        movement_type=movement_type,
        user=user,
        unit_price=unit_price,
        destination_location=destination_location,
        notes=notes,
    )

    return movement


@transaction.atomic
def transfer_product_between_locations(
    product: Product,
    from_location,
    to_location,
    quantity: int,
    user: User = None,
    notes: str = "",
):
    """
    Transfer product between two locations.
    Creates two movements: OUT from source, IN to destination.
    """
    # Verify sufficient stock at source location
    source_stock = ProductLocationStock.objects.filter(
        product=product, location=from_location
    ).first()

    if not source_stock or source_stock.quantity < quantity:
        raise ValueError(
            f"Insufficient stock at {from_location.name}. "
            f"Available: {source_stock.quantity if source_stock else 0}"
        )

    # Create OUT movement
    create_inventory_movement(
        product=product,
        location=from_location,
        quantity=quantity,
        movement_type=InventoryMovement.MOVEMENT_TRANSFER,
        user=user,
        destination_location=to_location,
        notes=f"Transfer to {to_location.name}. {notes}".strip(),
    )

    return True
