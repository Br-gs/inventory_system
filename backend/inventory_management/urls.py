from django.urls import path, include
from . import views
from rest_framework import routers
from .api import ProductViewSet

router = routers.DefaultRouter()

router.register('api/products', ProductViewSet, 'products')

urlpatterns = [
    path('products/', views.list_products, name='list_products'),
    path('', include(router.urls))
]