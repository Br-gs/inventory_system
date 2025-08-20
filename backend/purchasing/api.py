from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
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

    # Custom action to mark an order as “received”
    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        purchase_order = self.get_object()
        try:
            receive_purchase_order(purchase_order=purchase_order, user=request.user)
            return Response(
                {"status": "Order received and stock successfully updated."}
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
