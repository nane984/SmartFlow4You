from django.urls import include, path
from rest_framework.routers import DefaultRouter

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

urlpatterns = [
    path("", include(router.urls)),
]
