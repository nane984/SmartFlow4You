from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ApplicationViewSet, InterviewAccessViewSet, JobAccessViewSet

router = DefaultRouter()
router.register("jobs", JobAccessViewSet, basename="jobs")
router.register("applications", ApplicationViewSet, basename="applications")
router.register("interviews", InterviewAccessViewSet, basename="interviews")

urlpatterns = [
    path("", include(router.urls)),
]
