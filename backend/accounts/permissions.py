from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):

    def has_permission(self, request, view,):
        
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
    
        return request.user and request.user.is_staff


    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        return request.user and request.user.is_staff