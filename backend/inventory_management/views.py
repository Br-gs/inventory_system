from .models import Product, InventoryMovement
from rest_framework import viewsets
from .serializers import ProductSerializer, InventoryMovementSerializer

# def list_products(request):
 #   products = Product.objects.all()
 #   return render(request, 'list_products.html', {'products': products})
class ProductView(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()

class InventoryMovementView(viewsets.ModelViewSet):
    serializer_class = InventoryMovementSerializer
    queryset = InventoryMovement.objects.all().order_by('-date')