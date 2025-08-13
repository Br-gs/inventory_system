from django_filters import rest_framework as filters
from .models import InventoryMovement, Product

class ProductFilter(filters.FilterSet):
    """ 
    Custom FilterSet for the Product model.
    """
    low_stock = filters.BooleanFilter(method='filter_low_stock', label='low stock')
    class Meta:
        model = Product
        fields = ['is_active']
    
    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(quantity__lte=10)
        return queryset

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
