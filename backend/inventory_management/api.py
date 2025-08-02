from .models import Product, InventoryMovement
from rest_framework import viewsets, permissions, status, filters
from .serializers import ProductSerializer, InventoryMovementSerializer
from rest_framework.response import Response
from accounts.permissions import IsAdminOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from .filters import MovementFilter
from rest_framework.views import APIView


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
        # Group together output movements by month and summarize quantities
        sales_by_month = (
            InventoryMovement.objects
            .filter(movement_type=InventoryMovement.MOVEMENT_OUTPUT)
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total_quantity=Sum('quantity'))
            .order_by('month')
        )
    
        # Report on best-selling products
        top_selling_products = (
            InventoryMovement.objects
            .filter(movement_type=InventoryMovement.MOVEMENT_OUTPUT)
            .values('product__name')
            .annotate(total_movements=Count('id'))
            .order_by('-total_quantity')[:5]
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
            'sales_by_month': [
                {'month': sale['month'].strftime('%Y-%m'), 'total_quantity': sale['total_quantity']}
                for sale in sales_by_month
            ],
            'top_selling_products' : list(top_selling_products),
            'stock_levels': list(stock_levels)
        }

        return Response(report_data)
