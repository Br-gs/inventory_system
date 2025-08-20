from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("inventory_management.urls")),
    path("api/", include("accounts.urls")),
    path("api/", include("suppliers.urls")),
    path("api/", include("purchasing.urls")), 
    # urls for API documentation
    # endpoint for schema generation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    # UI for schema generation
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    # ReDoc: a view of documentation more cleanly formatted for reading
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
