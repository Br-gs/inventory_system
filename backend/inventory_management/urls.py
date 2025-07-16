from django.urls import path, include
#from . import views
from rest_framework import routers
from .api import ProductViewSet, InventoryMovementViewSet

router = routers.DefaultRouter()

router.register('products', ProductViewSet, basename= 'products')
router.register('inventory-movements', InventoryMovementViewSet, basename= 'inventory_movements')

urlpatterns = [
    #path('products/', views.list_products, name='list_products'),
    path('', include(router.urls))
]