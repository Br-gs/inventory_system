from rest_framework import viewsets, permissions
from .models import Location
from .serializers import LocationSerializer


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.filter(is_active=True).order_by("name")
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
