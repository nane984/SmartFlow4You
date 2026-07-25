from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .mock_views import MockProcurementsAPIView
from .views import (
    CompanyViewSet,
    FinalOfferViewSet,
    OfferItemViewSet,
    RFQViewSet,
    SupplierOfferViewSet,
    TenderDocumentViewSet,
    TenderItemViewSet,
    TenderViewSet,
    WorkPackageSubmissionViewSet,
    WorkPackageViewSet,
)
from .definition_views import (
    ProcurementSourceViewSet,
    TenderDefinitionExecutionLogViewSet,
    TenderDefinitionViewSet,
    TenderKeywordViewSet,
    TenderNotificationViewSet,
)

router = DefaultRouter()
router.register("companies", CompanyViewSet, basename="company")
router.register("tenders", TenderViewSet, basename="tender")
router.register("items", TenderItemViewSet, basename="tenderitem")
router.register("documents", TenderDocumentViewSet, basename="tenderdocument")
router.register("rfqs", RFQViewSet, basename="rfq")
router.register("offers", SupplierOfferViewSet, basename="supplieroffer")
router.register("offer-items", OfferItemViewSet, basename="offeritem")
router.register("final-offers", FinalOfferViewSet, basename="finaloffer")
router.register("work-packages", WorkPackageViewSet, basename="workpackage")
router.register("submissions", WorkPackageSubmissionViewSet, basename="workpackagesubmission")
router.register("tender-definitions", TenderDefinitionViewSet, basename="tenderdefinition")
router.register("procurement-sources", ProcurementSourceViewSet, basename="procurementsource")
router.register("tender-keywords", TenderKeywordViewSet, basename="tenderkeyword")
router.register("tender-definition-logs", TenderDefinitionExecutionLogViewSet, basename="tenderdefinitionlog")
router.register("tender-notifications", TenderNotificationViewSet, basename="tendernotification")

urlpatterns = [
    path("mock/procurements/", MockProcurementsAPIView.as_view(), name="mock-procurements"),
    path("", include(router.urls)),
]
