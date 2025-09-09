from .models import Product, InventoryMovement, ProductLocationStock
from rest_framework import viewsets, permissions, status, filters
from .serializers import ProductSerializer, InventoryMovementSerializer
from rest_framework.response import Response
from accounts.permissions import IsAdminOrReadOnly, CanCreateSalesOrAdminOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from .filters import MovementFilter, ProductFilter
from rest_framework.views import APIView
from django.db.models.functions import TruncMonth
from django.db.models import (
    Sum,
    F,
    DateField,
    ExpressionWrapper,
    Subquery,
    OuterRef,
)
from datetime import datetime, timedelta
from django.utils import timezone
from suppliers.models import Supplier
from purchasing.models import PurchaseOrder
from location.models import Location


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for handling products with location-aware stock information."""

    queryset = (
        Product.objects.all()
        .prefetch_related("stock_locations__location")
        .order_by("name")
    )
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
        DjangoFilterBackend,
    ]

    search_fields = ["name", "description"]
    ordering_fields = ["name", "price"]
    filterset_class = ProductFilter

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by user's accessible locations if not admin
        user = self.request.user
        if not user.is_staff and hasattr(user, "profile"):
            accessible_locations = user.profile.get_accessible_locations()
            if accessible_locations.exists():
                # Only show products that have stock at accessible locations
                queryset = queryset.filter(
                    stock_locations__location__in=accessible_locations
                ).distinct()

        return queryset

    @action(detail=False, methods=["get"])
    def suggestions(self, request):
        """Custom endpoint for product search suggestions with location filtering"""
        queryset = self.filter_queryset(self.get_queryset())

        # Apply location filtering if specified
        location_id = request.GET.get("location")
        if location_id:
            queryset = queryset.filter(
                stock_locations__location_id=location_id
            ).distinct()

        suggestions = queryset.values_list("name", flat=True)[:10]
        return Response(suggestions)

    @action(detail=True, methods=["get"])
    def stock_by_location(self, request, pk=None):
        """Get stock information by location for a specific product"""
        product = self.get_object()

        # Filter by user's accessible locations if not admin
        user = request.user
        locations = Location.objects.filter(is_active=True)
        if not user.is_staff and hasattr(user, "profile"):
            accessible_locations = user.profile.get_accessible_locations()
            locations = locations.filter(
                id__in=accessible_locations.values_list("id", flat=True)
            )

        stock_data = []
        for location in locations:
            try:
                stock = ProductLocationStock.objects.get(
                    product=product, location=location
                )
                stock_data.append(
                    {
                        "location_id": location.id,
                        "location_name": location.name,
                        "quantity": stock.quantity,
                    }
                )
            except ProductLocationStock.DoesNotExist:
                stock_data.append(
                    {
                        "location_id": location.id,
                        "location_name": location.name,
                        "quantity": 0,
                    }
                )

        return Response(
            {
                "product_id": product.id,
                "product_name": product.name,
                "total_quantity": product.get_total_quantity(),
                "stock_by_location": stock_data,
            }
        )


class InventoryMovementViewSet(viewsets.ModelViewSet):
    """ViewSet for handling inventory movements with location support."""

    queryset = InventoryMovement.objects.select_related(
        "product", "location", "destination_location", "user"
    ).order_by("-date")
    serializer_class = InventoryMovementSerializer
    permission_classes = [permissions.IsAuthenticated, CanCreateSalesOrAdminOnly]

    filterset_class = MovementFilter

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by user's accessible locations if not admin
        user = self.request.user
        if not user.is_staff and hasattr(user, "profile"):
            accessible_locations = user.profile.get_accessible_locations()
            if accessible_locations.exists():
                # Show movements from accessible locations
                queryset = queryset.filter(location__in=accessible_locations)

        return queryset

    def perform_create(self, serializer):
        # If no location specified, use user's default location
        if "location" not in serializer.validated_data:
            user = self.request.user
            if hasattr(user, "profile") and user.profile.default_location:
                serializer.validated_data["location"] = user.profile.default_location

        serializer.save()

    @action(detail=False, methods=["get"])
    def by_location(self, request):
        """Get movements filtered by location"""
        location_id = request.query_params.get("location_id")
        if not location_id:
            return Response(
                {"error": "location_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user has access to this location
        user = request.user
        if not user.is_staff and hasattr(user, "profile"):
            accessible_locations = user.profile.get_accessible_locations()
            try:
                location = Location.objects.get(id=location_id)
                if not user.profile.can_access_location(location):
                    return Response(
                        {"error": "You don't have access to this location"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except Location.DoesNotExist:
                return Response(
                    {"error": "Location not found"}, status=status.HTTP_404_NOT_FOUND
                )

        movements = self.get_queryset().filter(location_id=location_id)
        serializer = self.get_serializer(movements, many=True)
        return Response(serializer.data)


class InventoryReportsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        """Endpoint to generate inventory reports with location support."""
        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")
        product_id = request.query_params.get("product_id")
        location_id = request.query_params.get("location_id")

        # Base metrics
        today = timezone.now().date()
        current_month_start = today.replace(day=1)
        last_month_end = current_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        due_date_threshold = today + timedelta(days=7)

        base_queryset = InventoryMovement.objects.filter(
            movement_type=InventoryMovement.MOVEMENT_OUTPUT
        )

        # Apply filters
        if start_date_str:
            base_queryset = base_queryset.filter(
                date__gte=datetime.fromisoformat(start_date_str)
            )
        if end_date_str:
            base_queryset = base_queryset.filter(
                date__lte=datetime.fromisoformat(end_date_str)
            )
        if product_id:
            base_queryset = base_queryset.filter(product_id=product_id)
        if location_id:
            base_queryset = base_queryset.filter(location_id=location_id)

        # Dashboard KPIs
        if location_id:
            # Location-specific metrics
            total_products = ProductLocationStock.objects.filter(
                location_id=location_id, quantity__gt=0
            ).count()
            low_stock_products_count = ProductLocationStock.objects.filter(
                location_id=location_id, quantity__lte=10, quantity__gt=0
            ).count()
        else:
            # Global metrics
            total_products = Product.objects.filter(is_active=True).count()
            low_stock_products_count = (
                ProductLocationStock.objects.filter(quantity__lte=10, quantity__gt=0)
                .values("product")
                .distinct()
                .count()
            )

        # Recent movements
        recent_movements_query = InventoryMovement.objects.select_related(
            "product", "location", "user"
        ).order_by("-date")[:10]

        if location_id:
            recent_movements_query = recent_movements_query.filter(
                location_id=location_id
            )

        recent_movements_data = [
            {
                "id": movement.id,
                "product_name": movement.product.name,
                "location_name": movement.location.name,
                "quantity": movement.quantity,
                "movement_type_display": movement.get_movement_type_display(),
                "date": movement.date,
                "user": movement.user.username if movement.user else "System",
            }
            for movement in recent_movements_query
        ]

        # Sales metrics
        sales_current_month_data = base_queryset.filter(
            date__gte=current_month_start
        ).aggregate(total=Sum("quantity"))
        sales_current_month = sales_current_month_data["total"] or 0

        sales_last_month_data = base_queryset.filter(
            date__gte=last_month_start, date__lt=current_month_start
        ).aggregate(total=Sum("quantity"))
        sales_last_month = sales_last_month_data["total"] or 0

        # Percentage change calculation
        percentage_change = 0
        if sales_last_month > 0:
            percentage_change = (
                (sales_current_month - sales_last_month) / sales_last_month
            ) * 100
        elif sales_current_month > 0:
            percentage_change = 100

        # Sales by month
        sales_by_month = (
            base_queryset.annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total_quantity=Sum("quantity"))
            .order_by("month")
        )

        # Top selling products
        top_selling_products = (
            base_queryset.values("product__name")
            .annotate(total_quantity_sold=Sum("quantity"))
            .order_by("-total_quantity_sold")[:5]
        )

        # Stock levels by location
        if location_id:
            stock_levels = (
                ProductLocationStock.objects.filter(
                    location_id=location_id, quantity__gt=0
                )
                .select_related("product")
                .order_by("-quantity")
                .values("product__name", "quantity")[:10]
            )
        else:
            # Global stock levels (sum across all locations)
            stock_levels = (
                Product.objects.filter(is_active=True)
                .annotate(total_quantity=Sum("stock_locations__quantity"))
                .filter(total_quantity__gt=0)
                .order_by("-total_quantity")
                .values("name", "total_quantity")[:10]
            )
            # Rename for consistency
            stock_levels = [
                {"product__name": item["name"], "quantity": item["total_quantity"]}
                for item in stock_levels
            ]

        # Supplier metrics (global)
        due_suppliers_count = (
            Supplier.objects.annotate(
                latest_order_date=Subquery(
                    PurchaseOrder.objects.filter(supplier=OuterRef("pk"))
                    .order_by("-order_date")
                    .values("order_date")[:1]
                )
            )
            .annotate(
                due_date=ExpressionWrapper(
                    F("latest_order_date") + timedelta(days=1) * F("payment_terms"),
                    output_field=DateField(),
                )
            )
            .filter(due_date__lte=due_date_threshold, latest_order_date__isnull=False)
            .count()
        )

        due_pos_count = PurchaseOrder.objects.filter(
            is_paid=False,
            payment_due_date__isnull=False,
            payment_due_date__lte=due_date_threshold,
        ).count()

        # Stock by location summary (for location overview)
        locations_summary = []
        if not location_id:  # Only show summary when not filtering by specific location
            for location in Location.objects.filter(is_active=True):
                location_stock_count = ProductLocationStock.objects.filter(
                    location=location, quantity__gt=0
                ).count()
                location_total_quantity = (
                    ProductLocationStock.objects.filter(location=location).aggregate(
                        total=Sum("quantity")
                    )["total"]
                    or 0
                )

                locations_summary.append(
                    {
                        "location_id": location.id,
                        "location_name": location.name,
                        "products_count": location_stock_count,
                        "total_quantity": location_total_quantity,
                    }
                )

        report_data = {
            # Dashboard data
            "kpis": {
                "total_products": total_products,
                "low_stock_count": low_stock_products_count,
                "sales_current_month": sales_current_month,
                "sales_percentage_change": round(percentage_change, 2),
                "due_suppliers_count": due_suppliers_count,
                "due_purchase_orders_count": due_pos_count,
            },
            "recent_movements": recent_movements_data,
            "locations_summary": locations_summary,
            # Reports data
            "sales_by_month": [
                {
                    "month": sale["month"].strftime("%Y-%m"),
                    "total_quantity": sale["total_quantity"],
                }
                for sale in sales_by_month
            ],
            "top_selling_products": list(top_selling_products),
            "stock_levels": [
                {"name": item["product__name"], "quantity": item["quantity"]}
                for item in stock_levels
            ],
        }

        return Response(report_data)
