from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ConfirmEmailAPIView, RegisterViewSet, SupplierRegistrationRequestViewSet, UserViewSet

router = DefaultRouter()
router.register("users", UserViewSet)
router.register("register", RegisterViewSet, basename="register")
router.register(
    "supplier-registration-requests",
    SupplierRegistrationRequestViewSet,
    basename="supplier-registration-request",
)

urlpatterns = [
    path("confirm-email/", ConfirmEmailAPIView.as_view(), name="confirm-email"),
    path("", include(router.urls)),
]