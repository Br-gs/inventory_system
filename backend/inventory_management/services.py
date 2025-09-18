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
    For transfers, this creates two movements: OUT from source and IN to destination.

    Args:
        product (Product): The product to move
        location: The source location
        quantity (int): Quantity to move
        movement_type (str): Type of movement (IN, OUT, ADJ, TRF)
        user (User, optional): User performing the movement
        unit_price (float, optional): Unit price for INPUT movements
        destination_location: Destination location for transfers
        notes (str): Additional notes

    Returns:
        InventoryMovement: Created movement record (the source movement for transfers)
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

    # Handle different movement types
    if movement_type == InventoryMovement.MOVEMENT_INPUT:
        stock.quantity += quantity
        stock.save()
        
        # Create input movement record
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
        
    elif movement_type == InventoryMovement.MOVEMENT_OUTPUT:
        if stock.quantity < quantity:
            raise ValueError(
                f"Insufficient stock of {product.name} at {location.name}. "
                f"Available: {stock.quantity}, Requested: {quantity}"
            )
        stock.quantity -= quantity
        stock.save()
        
        # Create output movement record
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
        
    elif movement_type == InventoryMovement.MOVEMENT_ADJUSTMENT:
        stock.quantity = quantity
        stock.save()
        
        # Create adjustment movement record
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
        
    elif movement_type == InventoryMovement.MOVEMENT_TRANSFER:
        if not destination_location:
            raise ValueError("Destination location is required for transfers")
        if stock.quantity < quantity:
            raise ValueError(
                f"Insufficient stock of {product.name} at {location.name} for transfer"
            )

        # Update source location stock (deduct)
        stock.quantity -= quantity
        stock.save()

        # Update destination location stock (add)
        dest_stock, _ = ProductLocationStock.objects.get_or_create(
            product=product, location=destination_location, defaults={"quantity": 0}
        )
        dest_stock.quantity += quantity
        dest_stock.save()

        # Create OUT movement record for source location
        out_movement = InventoryMovement.objects.create(
            product=product,
            location=location,
            quantity=quantity,
            movement_type=InventoryMovement.MOVEMENT_OUTPUT,
            user=user,
            unit_price=unit_price,
            destination_location=destination_location,
            notes=f"Transfer to {destination_location.name}. {notes}".strip(),
        )

        # Create IN movement record for destination location
        in_movement = InventoryMovement.objects.create(
            product=product,
            location=destination_location,
            quantity=quantity,
            movement_type=InventoryMovement.MOVEMENT_INPUT,
            user=user,
            unit_price=unit_price,
            destination_location=location,  # Source location as reference
            notes=f"Transfer from {location.name}. {notes}".strip(),
        )

        # Return the OUT movement as the primary movement record
        movement = out_movement
        
    else:
        raise ValueError(f"Invalid movement type: {movement_type}")

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

    # Use the main create_inventory_movement function with TRANSFER type
    return create_inventory_movement(
        product=product,
        location=from_location,
        quantity=quantity,
        movement_type=InventoryMovement.MOVEMENT_TRANSFER,
        user=user,
        destination_location=to_location,
        notes=notes,
    )