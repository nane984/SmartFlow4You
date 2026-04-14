from rest_framework import permissions


class IsStaffUser(permissions.BasePermission):
    """Django `User.is_staff` — HR operators who can manage interview sessions."""

    message = "Staff privileges required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff)
