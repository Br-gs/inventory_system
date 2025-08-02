from django.urls import path, include
#from . import views
from rest_framework import routers
from .api import ProductViewSet, InventoryMovementViewSet, InventoryReportsView

router = routers.DefaultRouter()

router.register('products', ProductViewSet, basename= 'products')
router.register('inventory-movements', InventoryMovementViewSet, basename= 'inventory_movements')

urlpatterns = [
    path('', include(router.urls)),

    path('reports/', InventoryReportsView.as_view(), name='inventory-reports'),
]