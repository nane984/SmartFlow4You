"""DRF permission classes — enforce RBAC at API layer (Step 3)."""

from rest_framework import permissions

from .roles import (
    DESIGN_STAFF_ROLES,
    HR_CANDIDATE_ROLES,
    HR_STAFF_ROLES,
    PROCUREMENT_STAFF_ROLES,
    PROCUREMENT_SUPPLIER_ROLES,
    TENDER_DEFINITION_ROLES,
    ROLE_ADMIN,
    user_has_role,
)


class IsAdmin(permissions.BasePermission):
    message = "Administrator access required."

    def has_permission(self, request, view) -> bool:
        return user_has_role(request.user, frozenset({ROLE_ADMIN}))


class IsProcurementStaff(permissions.BasePermission):
    """admin + tender + tender_user — create/manage tenders, companies, view all offers."""

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


class IsDesignStaff(permissions.BasePermission):
    """Interior design / CAD module — admin and designer only."""

    message = "Designer access required."

    def has_permission(self, request, view) -> bool:
        return user_has_role(request.user, DESIGN_STAFF_ROLES)


class IsTenderDefinitionStaff(permissions.BasePermission):
    """Tender Definition Management — admin and tender roles only."""

    message = "Tender definition access required."

    def has_permission(self, request, view) -> bool:
        return user_has_role(request.user, TENDER_DEFINITION_ROLES)
