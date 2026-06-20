from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ApplicationViewSet,
    CandidateViewSet,
    CVViewSet,
    InterviewAccessViewSet,
    InterviewSessionViewSet,
    InterviewVideoUploadAPIView,
    JobAccessViewSet,
    JobPostViewSet,
)

router = DefaultRouter()
router.register("jobpost", JobPostViewSet)
router.register("cvs", CVViewSet)
router.register("interview-sessions", InterviewSessionViewSet, basename="interviewsession")

role_router = DefaultRouter()
role_router.register("jobs", JobAccessViewSet, basename="jobs")
role_router.register("candidates", CandidateViewSet, basename="candidates")
role_router.register("applications", ApplicationViewSet, basename="applications")
role_router.register("interviews", InterviewAccessViewSet, basename="interviews")

urlpatterns = [
    path('', include(router.urls)),
    path("", include(role_router.urls)),
    path(
        'interviews/<int:interview_session_id>/upload-video/',
        InterviewVideoUploadAPIView.as_view(),
        name='interview-video-upload',
    ),
]