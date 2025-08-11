from .models import Product, InventoryMovement
from rest_framework import viewsets, permissions, status, filters
from .serializers import ProductSerializer, InventoryMovementSerializer
from rest_framework.response import Response
from accounts.permissions import IsAdminOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from .filters import MovementFilter
from rest_framework.views import APIView
from django.db.models.functions import TruncMonth
from django.db.models import Sum, Count
from datetime import datetime


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for handling products.
    Provides CRUD operations for products with filtering and searching capabilities.
    """

    queryset = Product.objects.all().order_by("name")
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
        DjangoFilterBackend,
    ]

    search_fields = ["name", "description"]
    ordering_fields = ["name", "price", "quantity"]
    filterset_fields = ["is_active"]

    @action(detail=False, methods=["get"])
    def suggestions(self, request):
        """Custom endpoint for product search suggestions"""
        queryset = self.filter_queryset(self.get_queryset())
        suggestions = queryset.values_list("name", flat=True)[:10]
        return Response(suggestions)


class InventoryMovementViewSet(viewsets.ModelViewSet):
    """ViewSet for handling inventory movements.
    Provides read-only access to inventory movements with filtering capabilities.
    """

    queryset = InventoryMovement.objects.all().order_by("-date")
    serializer_class = InventoryMovementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    filterset_class = MovementFilter

class InventoryReportsView(APIView):

    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        """Endpoint to generate inventory reports."""
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        product_id = request.query_params.get('product_id')

        base_queryset = InventoryMovement.objects.filter(movement_type=InventoryMovement.MOVEMENT_OUTPUT)

        # For dashboard
        total_products = Product.objects.filter(is_active=True).count()
        low_stock_products_count = Product.objects.filter(is_active=True, quantity__lte=10).count()
        recent_movements = InventoryMovement.objects.order_by('-date')[:5]
        recent_movements_data = [
            {
                'id': movement.id,
                'product_name': movement.product.name,
                'quantity': movement.quantity,
                'movement_type_display': movement.get_movement_type_display(),
                'date': movement.date
            }
            for movement in recent_movements
        ]

        if start_date_str:
            base_queryset = base_queryset.filter(date__gte=datetime.fromisoformat(start_date_str))
        if end_date_str:
            base_queryset = base_queryset.filter(date__lte=datetime.fromisoformat(end_date_str))
        if product_id:
            base_queryset = base_queryset.filter(product_id=product_id)

        # Group together output movements by month and summarize quantities
        sales_by_month = (
            base_queryset
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total_quantity=Sum('quantity'))
            .order_by('month')
        )
    
        # Report on best-selling products
        top_selling_products = (
            base_queryset
            .values('product__name')
            .annotate(total_quantity_sold=Sum('quantity'))
            .order_by('-total_quantity_sold')[:5]
        )

        #Report current stock for products
        stock_levels = (
            Product.objects
            .filter(is_active=True)
            .order_by('-quantity')
            .values('name', 'quantity')[:10]
        )

        # The data is formatted so that it is easy to use on the frontend.
        report_data = {
            #Dashboard data
            'kpis': {
                'total_products': total_products,
                'low_stock_count': low_stock_products_count,
            },
            'recent_movements': recent_movements_data,

            #Reports data
            'sales_by_month': [
                {'month': sale['month'].strftime('%Y-%m'), 'total_quantity': sale['total_quantity']}
                for sale in sales_by_month
            ],
            'top_selling_products' : list(top_selling_products),
            'stock_levels': list(stock_levels)
        }

        return Response(report_data)
