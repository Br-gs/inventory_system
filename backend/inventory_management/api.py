from .models import Product, InventoryMovement
from rest_framework import viewsets, permissions
from .serializers import ProductSerializer, InventoryMovementSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer

class InventoryMovementViewSet(viewsets.ModelViewSet):
    queryset = InventoryMovement.objects.all().order_by('-date')
    permission_classes = [permissions.AllowAny]
    serializer_class = InventoryMovementSerializer