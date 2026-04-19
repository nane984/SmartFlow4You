from rest_framework import permissions


class IsAdminUserCustom(permissions.BasePermission):
    """Only ADMIN role."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "admin")


class IsHRUser(permissions.BasePermission):
    """HR + ADMIN."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in ("hr", "admin"))


class IsCandidate(permissions.BasePermission):
    """Only CANDIDATE role."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "candidate")


class IsInterviewer(permissions.BasePermission):
    """INTERVIEWER + ADMIN."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in ("interviewer", "admin"))


class IsStaffUser(permissions.BasePermission):
    """Backwards-compatible: HR + ADMIN."""

    message = "Staff privileges required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in ("hr", "admin"))
