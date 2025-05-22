from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Read-only permissions are granted to any request.
    """

    def has_permission(self, request, view,):
        
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
    
        return request.user and request.user.is_staff


    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        # so always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write permissions are only allowed to the owner of the object
        return request.user and request.user.is_staff