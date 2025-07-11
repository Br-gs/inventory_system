from django_filters import rest_framework as filters
from .models import InventoryMovement


class MovementFilter(filters.FilterSet):
    """FilterSet for InventoryMovement model.
    Provides filtering capabilities for product, movement type, and date range.
    """

    start_date = filters.DateFilter(
        field_name="date", lookup_expr="gte", label="Start Date"
    )
    end_date = filters.DateFilter(
        field_name="date", lookup_expr="lte", label="End Date"
    )

    class Meta:
        model = InventoryMovement
        fields = ["product", "movement_type"]
