from rest_framework import viewsets, permissions
from .models import Supplier
from .serializers import SupplierSerializer
from accounts.permissions import IsAdminOrReadOnly


class SupplierViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing supplier instances.
    """

    queryset = Supplier.objects.all().prefetch_related("products")
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
