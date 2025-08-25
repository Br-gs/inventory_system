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
        old_status = instance.status  # Store old status
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Store old status before update
        old_status = instance.status
        
        # Perform the update
        serializer.save()
        
        # If the instance was updated, refresh from database to get calculated fields
        instance.refresh_from_db()
        
        # Prepare response data
        response_data = serializer.data.copy()  # Make a copy to avoid modifying the original
        
        # Check if inventory was processed
        if hasattr(instance, '_inventory_processed') and instance._inventory_processed:
            response_data['inventory_processed'] = True
            response_data['message'] = 'Purchase order updated and inventory movements created successfully!'
            response_data['items_processed'] = getattr(instance, '_items_processed', 0)
            print(f"DEBUG: Returning inventory_processed=True with {response_data['items_processed']} items")  # Debug log
        
        return Response(response_data)

    # Custom action to mark an order as "received"
    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        purchase_order = self.get_object()
        try:
            receive_purchase_order(purchase_order=purchase_order, user=request.user)
            purchase_order.refresh_from_db()  # Refresh to get updated data
            serializer = self.get_serializer(purchase_order)
            
            # Count the total items processed
            total_items = sum(item.quantity for item in purchase_order.items.all())
            
            return Response({
                "status": "Order received and stock successfully updated.",
                "inventory_processed": True,
                "items_processed": total_items,
                "purchase_order": serializer.data
            })
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)