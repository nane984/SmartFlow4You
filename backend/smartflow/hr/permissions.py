"""Re-export core RBAC permissions for HR module (Step 3)."""

from rest_framework import permissions

from core.permissions import IsAdmin, IsCandidate, IsHRStaff
from core.roles import ROLE_ADMIN, ROLE_INTERVIEWER_LEGACY, user_has_role

IsAdminUserCustom = IsAdmin
IsHRUser = IsHRStaff
IsStaffUser = IsHRStaff


class IsInterviewer(permissions.BasePermission):
    """Interviewer + admin (legacy role string)."""

    message = "Interviewer access required."

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user_has_role(user, frozenset({ROLE_ADMIN})):
            return True
        return getattr(user, "role", None) == ROLE_INTERVIEWER_LEGACY


class IsInterviewerOrHRStaff(permissions.BasePermission):
    """Interviewer, HR staff, or admin."""

    message = "HR or interviewer access required."

    def has_permission(self, request, view) -> bool:
        return IsHRStaff().has_permission(request, view) or IsInterviewer().has_permission(
            request, view
        )
