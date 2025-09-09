from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import LocationViewSet

router = DefaultRouter()
router.register(r"", LocationViewSet, basename="location")

urlpatterns = [
    path("", include(router.urls)),
]
