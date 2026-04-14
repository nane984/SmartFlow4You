from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CV, InterviewSession, JobPost, Question
from .permissions import IsStaffUser
from .serializer import (
    CVSerializer,
    InterviewSessionSerializer,
    JobPostSerializer,
    QuestionPublicSerializer,
    SubmitAnswersSerializer,
    VideoUploadSerializer,
)


def _interview_sessions_for_user(user):
    qs = InterviewSession.objects.select_related("cv", "cv__job_post", "interviewer").order_by(
        "-start_time", "-id"
    )
    if user.is_staff:
        return qs
    return qs.filter(cv__submitted_by=user)


class JobPostViewSet(viewsets.ModelViewSet):
    queryset = JobPost.objects.all()
    serializer_class = JobPostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = JobPost.objects.all()
        if (
            self.action == "list"
            and self.request.query_params.get("for_application") == "1"
        ):
            return qs.filter(published=True).order_by("-published_at", "-id")
        return qs.order_by("-id")


class CVViewSet(viewsets.ModelViewSet):
    queryset = CV.objects.select_related("job_post").all()
    serializer_class = CVSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)


class InterviewSessionViewSet(viewsets.ModelViewSet):
    """Staff: full CRUD. Non-staff: list/retrieve only for sessions linked to their CVs."""

    serializer_class = InterviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsStaffUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return _interview_sessions_for_user(self.request.user)

    def _can_control_session(self, request, session) -> bool:
        return bool(
            request.user.is_staff
            or (session.cv.submitted_by_id and session.cv.submitted_by_id == request.user.id)
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="start",
        permission_classes=[permissions.IsAuthenticated],
    )
    def start_interview(self, request, pk=None):
        session = self.get_object()
        if session.status != InterviewSession.STATUS_SCHEDULED:
            return Response(
                {"detail": "Interview can only be started from the scheduled state."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not self._can_control_session(request, session):
            return Response(
                {"detail": "You cannot start this interview."},
                status=status.HTTP_403_FORBIDDEN,
            )
        session.status = InterviewSession.STATUS_IN_PROGRESS
        session.save(update_fields=["status"])
        return Response(InterviewSessionSerializer(session).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="complete",
        permission_classes=[permissions.IsAuthenticated],
    )
    def complete_interview(self, request, pk=None):
        session = self.get_object()
        if session.status != InterviewSession.STATUS_IN_PROGRESS:
            return Response(
                {"detail": "Interview must be in progress to complete."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not self._can_control_session(request, session):
            return Response(
                {"detail": "You cannot complete this interview."},
                status=status.HTTP_403_FORBIDDEN,
            )
        session.status = InterviewSession.STATUS_COMPLETED
        session.end_time = timezone.now()
        session.save(update_fields=["status", "end_time"])
        return Response(InterviewSessionSerializer(session).data)

    @action(
        detail=True,
        methods=["get"],
        url_path="questions",
        permission_classes=[permissions.IsAuthenticated],
    )
    def questions(self, request, pk=None):
        session = self.get_object()
        qs = Question.objects.filter(interview_session=session).order_by("id")
        return Response(QuestionPublicSerializer(qs, many=True).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="submit-answers",
        permission_classes=[permissions.IsAuthenticated],
    )
    def submit_answers(self, request, pk=None):
        session = self.get_object()
        if not self._can_control_session(request, session):
            return Response(
                {"detail": "You cannot submit answers for this interview."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = SubmitAnswersSerializer(data=request.data, context={"session": session})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Answers saved.", "count": len(serializer.validated_data["answers"])},
            status=status.HTTP_200_OK,
        )


class InterviewVideoUploadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, interview_session_id):
        interview_session = get_object_or_404(
            _interview_sessions_for_user(request.user), id=interview_session_id
        )

        if interview_session.status != "in_progress":
            return Response({"error": "Interview is not active"}, status=400)

        if "video" not in request.FILES:
            return Response({"error": "No video file provided"}, status=400)

        video = request.FILES.get("video")

        if video.size > 50 * 1024 * 1024:
            return Response({"error": "File too large"}, status=400)

        serializer = VideoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(interview_session=interview_session)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
