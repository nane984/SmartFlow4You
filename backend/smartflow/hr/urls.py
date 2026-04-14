from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CVViewSet,
    InterviewSessionViewSet,
    InterviewVideoUploadAPIView,
    JobPostViewSet,
)

router = DefaultRouter()
router.register("jobpost", JobPostViewSet)
router.register("cvs", CVViewSet)
router.register("interview-sessions", InterviewSessionViewSet, basename="interviewsession")

urlpatterns = [
    path('', include(router.urls)),
    path(
        'interviews/<int:interview_session_id>/upload-video/',
        InterviewVideoUploadAPIView.as_view(),
        name='interview-video-upload',
    ),
]