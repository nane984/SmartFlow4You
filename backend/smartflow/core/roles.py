"""
Application roles and helpers for RBAC (Steps 1–3).

`public` is not stored on User — it represents unauthenticated access only.
"""

from __future__ import annotations

from typing import Final

# --- Canonical roles (stored on User.role after normalization) ---
ROLE_ADMIN: Final = "admin"
ROLE_HR_ADMIN: Final = "hr_admin"
ROLE_TENDER_USER: Final = "tender_user"
ROLE_SUPPLIER: Final = "supplier"
ROLE_CANDIDATE: Final = "candidate"

# Legacy values still present in older rows / JWT sessions until migrated
ROLE_HR_LEGACY: Final = "hr"
ROLE_INTERVIEWER_LEGACY: Final = "interviewer"
# Frontend mock/demo alias (not written to User by default)
ROLE_INVESTOR_LEGACY: Final = "investor"

ALL_ROLES: Final = frozenset(
    {
        ROLE_ADMIN,
        ROLE_HR_ADMIN,
        ROLE_TENDER_USER,
        ROLE_SUPPLIER,
        ROLE_CANDIDATE,
        ROLE_HR_LEGACY,
        ROLE_INTERVIEWER_LEGACY,
        ROLE_INVESTOR_LEGACY,
    }
)

ROLE_LABELS: Final = {
    ROLE_ADMIN: "Administrator",
    ROLE_HR_ADMIN: "HR Admin",
    ROLE_TENDER_USER: "Tender user",
    ROLE_SUPPLIER: "Supplier",
    ROLE_CANDIDATE: "Candidate",
    ROLE_HR_LEGACY: "HR (legacy)",
    ROLE_INTERVIEWER_LEGACY: "Interviewer (legacy)",
    ROLE_INVESTOR_LEGACY: "Investor (legacy)",
}

# Roles allowed on self-service registration (immediate account)
REGISTRATION_ROLES: Final = frozenset({ROLE_CANDIDATE})

# Supplier self-registration creates a pending request — admin approval required
SUPPLIER_REGISTRATION_ROLE: Final = ROLE_SUPPLIER

# Map legacy / demo role strings to canonical role for API responses
ROLE_ALIASES: Final = {
    ROLE_HR_LEGACY: ROLE_HR_ADMIN,
    ROLE_INVESTOR_LEGACY: ROLE_TENDER_USER,
}


def normalize_role(raw: str | None) -> str | None:
    """Return canonical role slug or None."""
    if not raw or not isinstance(raw, str):
        return None
    value = raw.strip().lower()
    if not value:
        return None
    return ROLE_ALIASES.get(value, value)


def is_valid_role(raw: str | None) -> bool:
    normalized = normalize_role(raw)
    return normalized in ALL_ROLES if normalized else False


def role_label(raw: str | None) -> str:
    normalized = normalize_role(raw) or raw or ""
    return ROLE_LABELS.get(normalized, normalized.replace("_", " ").title() or "Unknown")


def effective_role(raw: str | None) -> str | None:
    """Normalized role if valid, else None."""
    normalized = normalize_role(raw)
    return normalized if normalized and normalized in ALL_ROLES else None


# --- Role groups for permission checks (Step 3) ---
PROCUREMENT_STAFF_ROLES: Final = frozenset({ROLE_ADMIN, ROLE_TENDER_USER})
PROCUREMENT_SUPPLIER_ROLES: Final = frozenset({ROLE_SUPPLIER})
HR_STAFF_ROLES: Final = frozenset({ROLE_ADMIN, ROLE_HR_ADMIN, ROLE_HR_LEGACY, ROLE_INTERVIEWER_LEGACY})
HR_CANDIDATE_ROLES: Final = frozenset({ROLE_CANDIDATE})


def user_has_role(user, allowed: frozenset[str]) -> bool:
    if not user or not getattr(user, "is_authenticated", False):
        return False
    canonical = effective_role(getattr(user, "role", None))
    raw = getattr(user, "role", None)
    if canonical and canonical in allowed:
        return True
    return bool(raw and raw in allowed)


def is_procurement_staff(user) -> bool:
    return user_has_role(user, PROCUREMENT_STAFF_ROLES)


def is_supplier_user(user) -> bool:
    return user_has_role(user, PROCUREMENT_SUPPLIER_ROLES)


def is_hr_staff(user) -> bool:
    return user_has_role(user, HR_STAFF_ROLES)


def is_candidate_user(user) -> bool:
    return user_has_role(user, HR_CANDIDATE_ROLES)


def is_admin_user(user) -> bool:
    return user_has_role(user, frozenset({ROLE_ADMIN}))
