import logging

from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from core.permissions import IsProcurementReader, IsProcurementStaff, IsSupplier
from core.roles import is_procurement_staff, is_supplier_user

from .access import (
    filter_companies_for_user,
    filter_final_offers_for_user,
    filter_offer_items_for_user,
    filter_rfq_for_user,
    filter_supplier_offers_for_user,
    filter_tender_documents_for_user,
    filter_tender_items_for_user,
    filter_tenders_for_user,
    filter_work_package_submissions_for_user,
    filter_work_packages_for_user,
)
from .models import (
    Company,
    FinalOffer,
    OfferItem,
    RFQ,
    SupplierOffer,
    Tender,
    TenderDocument,
    TenderItem,
    WorkPackage,
    WorkPackageSubmission,
)
from .serializers import (
    CompanySerializer,
    FinalOfferSerializer,
    OfferItemSerializer,
    RFQSerializer,
    SupplierOfferSerializer,
    TenderDocumentSerializer,
    TenderItemSerializer,
    TenderSerializer,
    WorkPackageSerializer,
    WorkPackageSubmissionSerializer,
)

logger = logging.getLogger(__name__)


class ProcurementReadWriteMixin:
    """Staff: full CRUD. Supplier: read-only on scoped querysets."""

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsProcurementReader()]
        return [IsProcurementStaff()]


class CompanyViewSet(ProcurementReadWriteMixin, viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

    def get_queryset(self):
        return filter_companies_for_user(super().get_queryset(), self.request.user)


class TenderViewSet(ProcurementReadWriteMixin, viewsets.ModelViewSet):
    serializer_class = TenderSerializer

    def get_queryset(self):
        qs = (
            Tender.objects.select_related("investor")
            .prefetch_related(
                "items",
                "documents",
                "work_packages",
                "work_packages__contractors",
                "suppliers",
            )
            .order_by("-created_at", "-id")
        )
        return filter_tenders_for_user(qs, self.request.user)


class WorkPackageViewSet(ProcurementReadWriteMixin, viewsets.ModelViewSet):
    serializer_class = WorkPackageSerializer
    queryset = WorkPackage.objects.select_related("tender").prefetch_related(
        "submissions",
        "submissions__subcontractor",
        "contractors",
    )

    def get_queryset(self):
        qs = filter_work_packages_for_user(super().get_queryset(), self.request.user)
        tender_id = self._query_tender_id()
        if tender_id is not None:
            qs = qs.filter(tender_id=tender_id)
        return qs.order_by("name", "id")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("WorkPackage create validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()

    @staticmethod
    def _parse_tender_id(raw: str | None) -> int | None:
        if raw is None or not str(raw).strip():
            return None
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    def _query_tender_id(self) -> int | None:
        return self._parse_tender_id(self.request.query_params.get("tender"))


class WorkPackageSubmissionViewSet(ProcurementReadWriteMixin, viewsets.ModelViewSet):
    serializer_class = WorkPackageSubmissionSerializer
    queryset = WorkPackageSubmission.objects.select_related(
        "subcontractor",
        "work_package",
        "work_package__tender",
    )

    def get_queryset(self):
        qs = filter_work_package_submissions_for_user(
            super().get_queryset(), self.request.user
        )
        work_package_id = self._query_work_package_id()
        if work_package_id is not None:
            qs = qs.filter(work_package_id=work_package_id)
        tender_id = self._query_tender_id()
        if tender_id is not None:
            qs = qs.filter(work_package__tender_id=tender_id)
        return qs.order_by("-submitted_at", "-id")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(
                "WorkPackageSubmission create validation failed: %s", serializer.errors
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()

    @staticmethod
    def _parse_int(raw: str | None) -> int | None:
        if raw is None or not str(raw).strip():
            return None
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    def _query_work_package_id(self) -> int | None:
        return self._parse_int(self.request.query_params.get("work_package"))

    def _query_tender_id(self) -> int | None:
        return self._parse_int(self.request.query_params.get("tender"))


class TenderDocumentViewSet(ProcurementReadWriteMixin, viewsets.ModelViewSet):
    queryset = TenderDocument.objects.select_related("tender").all()
    serializer_class = TenderDocumentSerializer

    def get_queryset(self):
        return filter_tender_documents_for_user(super().get_queryset(), self.request.user)


class TenderItemViewSet(ProcurementReadWriteMixin, viewsets.ModelViewSet):
    serializer_class = TenderItemSerializer
    queryset = TenderItem.objects.select_related("tender").all()

    def get_queryset(self):
        qs = filter_tender_items_for_user(super().get_queryset(), self.request.user)
        tender_id = self._query_tender_id()
        if tender_id is not None:
            qs = qs.filter(tender_id=tender_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("TenderItem create validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()

    @staticmethod
    def _parse_tender_id(raw: str | None) -> int | None:
        if raw is None or not str(raw).strip():
            return None
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    def _query_tender_id(self) -> int | None:
        return self._parse_tender_id(self.request.query_params.get("tender"))


class RFQViewSet(ProcurementReadWriteMixin, viewsets.ModelViewSet):
    queryset = RFQ.objects.select_related("tender", "supplier").all()
    serializer_class = RFQSerializer

    def get_queryset(self):
        return filter_rfq_for_user(super().get_queryset(), self.request.user)


class SupplierOfferViewSet(viewsets.ModelViewSet):
    """
    Staff: full visibility + manage offers.
    Supplier: list/retrieve/create own offers only; never see other suppliers' bids.
    """

    serializer_class = SupplierOfferSerializer
    parser_classes = [MultiPartParser, FormParser]
    queryset = SupplierOffer.objects.select_related(
        "rfq",
        "rfq__tender",
        "rfq__supplier",
        "created_by",
    )

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create"):
            return [IsProcurementReader()]
        return [IsProcurementStaff()]

    def get_queryset(self):
        qs = filter_supplier_offers_for_user(super().get_queryset(), self.request.user)
        tender_id = self._parse_int(self.request.query_params.get("tender"))
        if tender_id is not None:
            qs = qs.filter(rfq__tender_id=tender_id)
        return qs.order_by("-submitted_at", "-id")

    def create(self, request, *args, **kwargs):
        if is_supplier_user(request.user) and not is_procurement_staff(request.user):
            if not IsSupplier().has_permission(request, self):
                return Response(
                    {"detail": "Supplier account required."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("SupplierOffer create validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)

    @staticmethod
    def _parse_int(raw: str | None) -> int | None:
        if raw is None or not str(raw).strip():
            return None
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None


class OfferItemViewSet(viewsets.ModelViewSet):
    """Staff: full CRUD. Supplier: read + create lines on own offers."""

    queryset = OfferItem.objects.select_related(
        "supplier_offer",
        "supplier_offer__rfq",
        "tender_item",
        "tender_item__tender",
    ).all()
    serializer_class = OfferItemSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create"):
            return [IsProcurementReader()]
        return [IsProcurementStaff()]

    def get_queryset(self):
        qs = filter_offer_items_for_user(super().get_queryset(), self.request.user)
        offer_id = self._parse_int(self.request.query_params.get("supplier_offer"))
        if offer_id is not None:
            qs = qs.filter(supplier_offer_id=offer_id)
        return qs.order_by("id")

    @staticmethod
    def _parse_int(raw: str | None) -> int | None:
        if raw is None or not str(raw).strip():
            return None
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None


class FinalOfferViewSet(ProcurementReadWriteMixin, viewsets.ModelViewSet):
    queryset = FinalOffer.objects.select_related("tender", "supplier_offer").all()
    serializer_class = FinalOfferSerializer

    def get_queryset(self):
        return filter_final_offers_for_user(super().get_queryset(), self.request.user)
