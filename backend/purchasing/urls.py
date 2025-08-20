from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import PurchaseOrderViewSet

router = DefaultRouter()
router.register(r"purchase-orders", PurchaseOrderViewSet, basename="purchase-order")

urlpatterns = [
    path("", include(router.urls)),
]