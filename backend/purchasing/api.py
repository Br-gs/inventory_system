from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from .models import PurchaseOrder
from .serializers import PurchaseOrderSerializer
from .services import receive_purchase_order
from location.models import Location


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """API endpoint for managing purchase orders with location support."""

    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = PurchaseOrder.objects.select_related(
            "supplier", "destination_location", "created_by"
        ).prefetch_related("items__product")

        user = self.request.user

        # Filter by user's accessible locations if not admin
        if not user.is_staff and hasattr(user, "profile"):
            accessible_locations = user.profile.get_accessible_locations()
            if accessible_locations.exists():
                queryset = queryset.filter(
                    destination_location__in=accessible_locations
                )

        # Filter by location if specified
        location_id = self.request.query_params.get("location_id")
        if location_id:
            queryset = queryset.filter(destination_location_id=location_id)

        return queryset.order_by("-order_date")

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create purchase order with location validation"""
        # Set default location if not provided
        if "destination_location_id" not in request.data:
            user = request.user
            if hasattr(user, "profile") and user.profile.default_location:
                request.data["destination_location_id"] = (
                    user.profile.default_location.id
                )

        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Override update to handle status changes properly with location support"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        old_status = instance.status

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        serializer.save()
        instance.refresh_from_db()

        response_data = serializer.data.copy()

        if hasattr(instance, "_inventory_processed") and instance._inventory_processed:
            response_data["inventory_processed"] = True
            response_data["message"] = (
                f"Purchase order updated and {instance._items_processed} items "
                f"added to {instance.destination_location.name} inventory!"
            )
            response_data["items_processed"] = getattr(instance, "_items_processed", 0)

        return Response(response_data)

    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        """Mark an order as received and update inventory at destination location"""
        purchase_order = self.get_object()
        try:
            receive_purchase_order(purchase_order=purchase_order, user=request.user)
            purchase_order.refresh_from_db()
            serializer = self.get_serializer(purchase_order)

            total_items = sum(item.quantity for item in purchase_order.items.all())

            return Response(
                {
                    "status": f"Order received and {total_items} items added to {purchase_order.destination_location.name} inventory.",
                    "inventory_processed": True,
                    "items_processed": total_items,
                    "location_name": purchase_order.destination_location.name,
                    "purchase_order": serializer.data,
                }
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def by_location(self, request):
        """Get purchase orders by location"""
        location_id = request.query_params.get("location_id")
        if not location_id:
            return Response(
                {"error": "location_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check location access
        user = request.user
        if not user.is_staff and hasattr(user, "profile"):
            try:
                location = Location.objects.get(id=location_id)
                if not user.profile.can_access_location(location):
                    return Response(
                        {"error": "You don't have access to this location"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except Location.DoesNotExist:
                return Response(
                    {"error": "Location not found"}, status=status.HTTP_404_NOT_FOUND
                )

        queryset = self.get_queryset().filter(destination_location_id=location_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
