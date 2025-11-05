from rest_framework import permissions

class IsAdminUserType(permissions.BasePermission):
    """
    Custom permission to only allow access to users with the 'Admin' user type.
    """
    message = 'Access denied. Only users with the Admin role are permitted to update their profile here.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        user_type_name = getattr(request.user.user_type, 'name', None)
        return user_type_name == 'Admin'