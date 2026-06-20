"""Role-scoped queryset helpers for procurement module."""

from __future__ import annotations

from django.db.models import Q, QuerySet

from core.roles import (
    ROLE_ADMIN,
    ROLE_TENDER_USER,
    effective_role,
    is_procurement_staff,
    is_supplier_user,
)


def get_user_company(user):
    """Resolve linked Company for supplier/tender users."""
    if not user or not getattr(user, "is_authenticated", False):
        return None
    linked = getattr(user, "company", None)
    if linked is not None:
        return linked
    from .models import Company

    email = (getattr(user, "email", None) or "").strip()
    if not email:
        return None
    role = effective_role(getattr(user, "role", None))
    if role == ROLE_TENDER_USER:
        return Company.objects.filter(
            email__iexact=email,
            company_type=Company.CompanyType.INVESTOR,
        ).first()
    if is_supplier_user(user):
        return Company.objects.filter(
            email__iexact=email,
            company_type=Company.CompanyType.SUPPLIER,
        ).first()
    return None


def get_user_company_id(user) -> int | None:
    company = get_user_company(user)
    return company.pk if company else None


def filter_tenders_for_user(qs: QuerySet, user) -> QuerySet:
    if not user or not getattr(user, "is_authenticated", False):
        return qs.none()
    role = effective_role(getattr(user, "role", None))
    if role in (ROLE_ADMIN, ROLE_TENDER_USER):
        return qs
    if is_supplier_user(user):
        company_id = get_user_company_id(user)
        if not company_id:
            return qs.none()
        return qs.filter(
            Q(suppliers=company_id) | Q(rfqs__supplier_id=company_id)
        ).distinct()
    return qs.none()


def filter_rfq_for_user(qs: QuerySet, user) -> QuerySet:
    if not user or not getattr(user, "is_authenticated", False):
        return qs.none()
    if is_procurement_staff(user):
        return qs
    if is_supplier_user(user):
        company_id = get_user_company_id(user)
        if not company_id:
            return qs.none()
        return qs.filter(supplier_id=company_id)
    return qs.none()


def filter_supplier_offers_for_user(qs: QuerySet, user) -> QuerySet:
    """Staff see all offers; suppliers see ONLY their company's offers."""
    if not user or not getattr(user, "is_authenticated", False):
        return qs.none()
    if is_procurement_staff(user):
        return qs
    if is_supplier_user(user):
        company_id = get_user_company_id(user)
        if not company_id:
            return qs.none()
        return qs.filter(rfq__supplier_id=company_id)
    return qs.none()


def supplier_may_access_tender(user, tender_id: int) -> bool:
    if not tender_id:
        return False
    if is_procurement_staff(user):
        return True
    if is_supplier_user(user):
        company_id = get_user_company_id(user)
        if not company_id:
            return False
        from .models import Tender

        return Tender.objects.filter(pk=tender_id).filter(
            Q(suppliers=company_id) | Q(rfqs__supplier_id=company_id)
        ).exists()
    return False


def supplier_may_use_company(user, company_id: int) -> bool:
    if not company_id:
        return False
    if is_procurement_staff(user):
        return True
    if is_supplier_user(user):
        return get_user_company_id(user) == company_id
    return False


def _accessible_tender_ids(user):
    from .models import Tender

    return filter_tenders_for_user(Tender.objects.all(), user).values_list("pk", flat=True)


def filter_companies_for_user(qs: QuerySet, user) -> QuerySet:
    if is_procurement_staff(user):
        return qs
    if is_supplier_user(user):
        company_id = get_user_company_id(user)
        if company_id:
            return qs.filter(pk=company_id)
        return qs.none()
    return qs.none()


def filter_work_packages_for_user(qs: QuerySet, user) -> QuerySet:
    if is_procurement_staff(user):
        return qs
    if is_supplier_user(user):
        return qs.filter(tender_id__in=_accessible_tender_ids(user))
    return qs.none()


def filter_work_package_submissions_for_user(qs: QuerySet, user) -> QuerySet:
    if is_procurement_staff(user):
        return qs
    if is_supplier_user(user):
        return qs.filter(work_package__tender_id__in=_accessible_tender_ids(user))
    return qs.none()


def filter_tender_items_for_user(qs: QuerySet, user) -> QuerySet:
    if is_procurement_staff(user):
        return qs
    if is_supplier_user(user):
        return qs.filter(tender_id__in=_accessible_tender_ids(user))
    return qs.none()


def filter_tender_documents_for_user(qs: QuerySet, user) -> QuerySet:
    if is_procurement_staff(user):
        return qs
    if is_supplier_user(user):
        return qs.filter(tender_id__in=_accessible_tender_ids(user))
    return qs.none()


def filter_offer_items_for_user(qs: QuerySet, user) -> QuerySet:
    if is_procurement_staff(user):
        return qs
    if is_supplier_user(user):
        company_id = get_user_company_id(user)
        if not company_id:
            return qs.none()
        return qs.filter(supplier_offer__rfq__supplier_id=company_id)
    return qs.none()


def filter_final_offers_for_user(qs: QuerySet, user) -> QuerySet:
    if is_procurement_staff(user):
        return qs
    if is_supplier_user(user):
        company_id = get_user_company_id(user)
        if not company_id:
            return qs.none()
        return qs.filter(supplier_offer__rfq__supplier_id=company_id)
    return qs.none()
