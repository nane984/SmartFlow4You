from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, TenderViewSet, OfferViewSet

router = DefaultRouter()
router.register('companies', CompanyViewSet)
router.register('tenders', TenderViewSet)
router.register('offers', OfferViewSet)

urlpatterns = [
    path('', include(router.urls)),
]