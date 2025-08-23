from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import PurchaseOrder
from .serializers import PurchaseOrderSerializer
from .services import receive_purchase_order


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing purchase orders.
    """

    queryset = (
        PurchaseOrder.objects.all()
        .select_related("supplier")
        .prefetch_related("items__product")
    )
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAdminUser]

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Override update to handle status changes properly"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        self.perform_update(serializer)
        
        # If the instance was updated, refresh from database to get calculated fields
        instance.refresh_from_db()
        
        return Response(serializer.data)

    # Custom action to mark an order as “received”
    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        purchase_order = self.get_object()
        try:
            receive_purchase_order(purchase_order=purchase_order, user=request.user)
            purchase_order.refresh_from_db()  # Refresh to get updated data
            serializer = self.get_serializer(purchase_order)
            return Response({
                "status": "Order received and stock successfully updated.",
                "purchase_order": serializer.data
            })
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
