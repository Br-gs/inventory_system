from django_filters import rest_framework as filters
from .models import InventoryMovement, Product, ProductLocationStock


class ProductFilter(filters.FilterSet):
    """
    Custom FilterSet for the Product model with location support.
    """

    low_stock = filters.BooleanFilter(method="filter_low_stock", label="Low stock")
    location = filters.NumberFilter(method="filter_by_location", label="Location")
    has_stock_at_location = filters.NumberFilter(
        method="filter_has_stock_at_location", label="Has stock at location"
    )

    class Meta:
        model = Product
        fields = ["is_active"]

    def filter_low_stock(self, queryset, name, value):
        """Filter products with low stock (<=10) considering location"""
        if value:
            location_id = self.request.GET.get("location")
            if location_id:
                # Filter by stock at specific location
                low_stock_products = ProductLocationStock.objects.filter(
                    location_id=location_id, quantity__lte=10
                ).values_list("product_id", flat=True)
                return queryset.filter(id__in=low_stock_products)
            else:
                # Filter by total stock across all locations
                from django.db.models import Sum, Q

                return queryset.annotate(
                    total_stock=Sum("stock_locations__quantity")
                ).filter(Q(total_stock__lte=10) | Q(total_stock__isnull=True))
        return queryset

    def filter_by_location(self, queryset, name, value):
        """Filter products that have stock at a specific location"""
        if value:
            # Get products that have stock records at this location
            products_at_location = ProductLocationStock.objects.filter(
                location_id=value
            ).values_list("product_id", flat=True)
            return queryset.filter(id__in=products_at_location)
        return queryset

    def filter_has_stock_at_location(self, queryset, name, value):
        """Filter products that have actual stock (quantity > 0) at a specific location"""
        if value:
            products_with_stock = ProductLocationStock.objects.filter(
                location_id=value, quantity__gt=0
            ).values_list("product_id", flat=True)
            return queryset.filter(id__in=products_with_stock)
        return queryset


class MovementFilter(filters.FilterSet):
    """FilterSet for InventoryMovement model with location support."""

    start_date = filters.DateFilter(
        field_name="date", lookup_expr="gte", label="Start Date"
    )
    end_date = filters.DateFilter(
        field_name="date", lookup_expr="lte", label="End Date"
    )
    location = filters.NumberFilter(
        field_name="location", lookup_expr="exact", label="Location"
    )
    destination_location = filters.NumberFilter(
        field_name="destination_location",
        lookup_expr="exact",
        label="Destination Location",
    )

    class Meta:
        model = InventoryMovement
        fields = ["product", "movement_type", "location", "destination_location"]
