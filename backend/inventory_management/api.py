from .models import Product, InventoryMovement
from rest_framework import viewsets, permissions, status, filters
from .serializers import ProductSerializer, InventoryMovementSerializer
from rest_framework.response import Response
from accounts.permissions import IsAdminOrReadOnly, CanCreateSalesOrAdminOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from .filters import MovementFilter, ProductFilter
from rest_framework.views import APIView
from django.db.models.functions import TruncMonth, Cast
from django.db.models import Sum, Count, F, DateField, ExpressionWrapper, Subquery, OuterRef
from datetime import datetime, timedelta
from django.utils import timezone
from suppliers.models import Supplier
from purchasing.models import PurchaseOrder

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
    filterset_class = ProductFilter

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
    permission_classes = [permissions.IsAuthenticated, CanCreateSalesOrAdminOnly]

    filterset_class = MovementFilter

    def perform_create(self, serializer):
        serializer.save()

class InventoryReportsView(APIView):

    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        """Endpoint to generate inventory reports."""
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        product_id = request.query_params.get('product_id')

        # new metrics for dashboard
        today = timezone.now().date()
        current_month_start = today.replace(day=1)
        last_month_end = current_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        due_date_threshold = today + timedelta(days=7)

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

        # Sales for the current month
        sales_current_month_data = InventoryMovement.objects.filter(
            movement_type=InventoryMovement.MOVEMENT_OUTPUT,
            date__gte=current_month_start
        ).aggregate(total=Sum('quantity'))
        sales_current_month = sales_current_month_data['total'] or 0

        # Sales for the previous month
        sales_last_month_data = InventoryMovement.objects.filter(
            movement_type=InventoryMovement.MOVEMENT_OUTPUT,
            date__gte=last_month_start,
            date__lt=current_month_start
        ).aggregate(total=Sum('quantity'))
        sales_last_month = sales_last_month_data['total'] or 0

        # Calculation of percentage change
        percentage_change = 0
        if sales_last_month > 0:
            percentage_change = ((sales_current_month - sales_last_month) / sales_last_month) * 100
        elif sales_current_month > 0:
            percentage_change = 100 # If last month was 0 and this month is not, it is a 100% increase (or infinite).
        
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

        # We count suppliers with invoices that are past due or about to become past due.
        # Use subquery to get the latest purchase order date for each supplier

        
        due_suppliers_count = Supplier.objects.annotate(
            latest_order_date=Subquery(
                PurchaseOrder.objects.filter(
                    supplier=OuterRef('pk')
                ).order_by('-order_date').values('order_date')[:1]
            )
        ).annotate(
            due_date=ExpressionWrapper(
                F('latest_order_date') + timedelta(days=1) * F('payment_terms'),
                output_field=DateField()
            )
        ).filter(
            due_date__lte=due_date_threshold,
            latest_order_date__isnull=False  # Only count suppliers with at least one purchase order
        ).count()

        # We count unpaid purchase orders that are past due or about to become past due.
        due_pos_count = PurchaseOrder.objects.filter(
            is_paid=False,
            payment_due_date__isnull=False, # Asegurarse de que tenga fecha de vencimiento
            payment_due_date__lte=due_date_threshold
        ).count()

        # The data is formatted so that it is easy to use on the frontend.
        report_data = {
            #Dashboard data
            'kpis': {
                'total_products': total_products,
                'low_stock_count': low_stock_products_count,
                'sales_current_month': sales_current_month,
                'sales_percentage_change': round(percentage_change, 2),
                'due_suppliers_count': due_suppliers_count,
                'due_purchase_orders_count': due_pos_count,
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
