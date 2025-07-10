from .models import Product, InventoryMovement
from rest_framework import viewsets, permissions, status, filters
from .serializers import ProductSerializer, InventoryMovementSerializer
from rest_framework.response import Response
from accounts.permissions import IsAdminOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend


class ProductViewSet(viewsets.ModelViewSet):
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


class InventoryMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryMovement.objects.all().order_by("-date")
    serializer_class = InventoryMovementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    filterset_fields = ["product", "movement_type", "date"]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                return Response(
                    serializer.data, status=status.HTTP_201_CREATED, headers=headers
                )
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
