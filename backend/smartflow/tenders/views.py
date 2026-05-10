from rest_framework import permissions, viewsets

from .models import (
    Company,
    FinalOffer,
    OfferItem,
    RFQ,
    SupplierOffer,
    Tender,
    TenderDocument,
    TenderItem,
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
)


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
            .prefetch_related("items", "documents")
            .order_by("-created_at", "-id")
        )


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

    def perform_create(self, serializer):
        tender_id = self._query_tender_id()
        if tender_id is not None:
            serializer.save(tender_id=tender_id)
        else:
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
