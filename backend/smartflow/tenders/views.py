import logging

from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

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


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]


class TenderViewSet(viewsets.ModelViewSet):
    serializer_class = TenderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
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


class WorkPackageViewSet(viewsets.ModelViewSet):
    serializer_class = WorkPackageSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = WorkPackage.objects.select_related("tender").prefetch_related(
        "submissions",
        "submissions__subcontractor",
        "contractors",
    )

    def get_queryset(self):
        qs = super().get_queryset()
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


class WorkPackageSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = WorkPackageSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = WorkPackageSubmission.objects.select_related(
        "subcontractor",
        "work_package",
        "work_package__tender",
    )

    def get_queryset(self):
        qs = super().get_queryset()
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
            logger.warning("WorkPackageSubmission create validation failed: %s", serializer.errors)
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


class TenderDocumentViewSet(viewsets.ModelViewSet):
    queryset = TenderDocument.objects.select_related("tender").all()
    serializer_class = TenderDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]


class TenderItemViewSet(viewsets.ModelViewSet):
    serializer_class = TenderItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = TenderItem.objects.select_related("tender").all()

    def get_queryset(self):
        qs = super().get_queryset()
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


class RFQViewSet(viewsets.ModelViewSet):
    queryset = RFQ.objects.select_related("tender", "supplier").all()
    serializer_class = RFQSerializer
    permission_classes = [permissions.IsAuthenticated]


class SupplierOfferViewSet(viewsets.ModelViewSet):
    queryset = SupplierOffer.objects.select_related("rfq", "rfq__tender", "rfq__supplier").all()
    serializer_class = SupplierOfferSerializer
    permission_classes = [permissions.IsAuthenticated]


class OfferItemViewSet(viewsets.ModelViewSet):
    queryset = OfferItem.objects.select_related(
        "supplier_offer",
        "tender_item",
        "tender_item__tender",
    ).all()
    serializer_class = OfferItemSerializer
    permission_classes = [permissions.IsAuthenticated]


class FinalOfferViewSet(viewsets.ModelViewSet):
    queryset = FinalOffer.objects.select_related("tender", "supplier_offer").all()
    serializer_class = FinalOfferSerializer
    permission_classes = [permissions.IsAuthenticated]
