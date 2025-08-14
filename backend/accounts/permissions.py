from rest_framework import permissions
from inventory_management.models import InventoryMovement

class IsAdminOrReadOnly(permissions.BasePermission):

    def has_permission(self, request, view,):
        
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
    
        return request.user and request.user.is_staff


    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        return request.user and request.user.is_staff

class CanCreateSalesOrAdminOnly(permissions.BasePermission):
    """Customized permission for managing inventory movements.
    - Allows any authenticated user to read.
    - Allows any authenticated user to create OUT movements.
    - Restricts the creation of other types of movements (IN, ADJ) to administrators only.
    - Restricts the editing and deletion of any movement to administrators only.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.method == 'POST':
            movement_type = request.data.get('movement_type')
            if movement_type == InventoryMovement.MOVEMENT_OUTPUT:
                return True

            return request.user and request.user.is_staff
        
        return request.user and request.user.is_staff