"""DRF permission classes — enforce RBAC at API layer (Step 3)."""

from rest_framework import permissions

from .roles import (
    HR_CANDIDATE_ROLES,
    HR_STAFF_ROLES,
    PROCUREMENT_STAFF_ROLES,
    PROCUREMENT_SUPPLIER_ROLES,
    ROLE_ADMIN,
    user_has_role,
)


class IsAdmin(permissions.BasePermission):
    message = "Administrator access required."

    def has_permission(self, request, view) -> bool:
        return user_has_role(request.user, frozenset({ROLE_ADMIN}))


class IsProcurementStaff(permissions.BasePermission):
    """admin + tender_user — create/manage tenders, companies, view all offers."""

    message = "Procurement staff access required."

    def has_permission(self, request, view) -> bool:
        return user_has_role(request.user, PROCUREMENT_STAFF_ROLES)


class IsSupplier(permissions.BasePermission):
    message = "Supplier account required."

    def has_permission(self, request, view) -> bool:
        return user_has_role(request.user, PROCUREMENT_SUPPLIER_ROLES)


class IsProcurementReader(permissions.BasePermission):
    """Read procurement data: staff + suppliers (queryset scoped separately)."""

    message = "Procurement access required."

    def has_permission(self, request, view) -> bool:
        return user_has_role(
            request.user,
            PROCUREMENT_STAFF_ROLES | PROCUREMENT_SUPPLIER_ROLES,
        )


class IsHRStaff(permissions.BasePermission):
    """HR admin, legacy HR, interviewer, admin."""

    message = "HR staff access required."

    def has_permission(self, request, view) -> bool:
        return user_has_role(request.user, HR_STAFF_ROLES)


class IsCandidate(permissions.BasePermission):
    message = "Candidate account required."

    def has_permission(self, request, view) -> bool:
        return user_has_role(request.user, HR_CANDIDATE_ROLES)
