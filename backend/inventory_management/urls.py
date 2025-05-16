from django.urls import path, include
from . import views
from rest_framework import routers
from .api import ProductViewSet, InventoryMovementViewSet

router = routers.DefaultRouter()

router.register('api/products', ProductViewSet, 'products')
router.register('api/inventory_movements', InventoryMovementViewSet, 'inventory_movements')

urlpatterns = [
    #path('products/', views.list_products, name='list_products'),
    path('', include(router.urls))
]