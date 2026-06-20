import logging

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .application_workflow import apply_application_status_action
from .models import Answer, Candidate, CV, InterviewSession, JobPost, Question, VideoSubmission
from .permissions import (
    IsCandidate,
    IsHRUser,
    IsInterviewer,
    IsInterviewerOrHRStaff,
    IsStaffUser,
)
from .serializer import (
    AnswerReviewSerializer,
    ApplicationStatusActionSerializer,
    CandidateSerializer,
    CVSerializer,
    InterviewSessionSerializer,
    JobPostSerializer,
    QuestionPublicSerializer,
    SubmitAnswersSerializer,
    VideoUploadSerializer,
)

logger = logging.getLogger(__name__)


def _interview_sessions_for_user(user):
    qs = InterviewSession.objects.select_related("cv", "cv__job_post", "interviewer").order_by(
        "-start_time", "-id"
    )
    if user.role in ("admin", "hr", "hr_admin"):
        return qs
    if user.role == "interviewer":
        return qs.filter(interviewer=user)
    return qs.filter(cv__submitted_by=user)


class JobPostViewSet(viewsets.ModelViewSet):
    queryset = JobPost.objects.all()
    serializer_class = JobPostSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsHRUser()]

    def get_queryset(self):
        qs = JobPost.objects.all()
        if (
            self.action == "list"
            and self.request.query_params.get("for_application") == "1"
        ):
            return qs.filter(
                posting_status=JobPost.PostingStatus.PUBLISHED
            ).order_by("-job_published_at", "-id")
        return qs.order_by("-id")


class CVViewSet(viewsets.ModelViewSet):
    queryset = CV.objects.select_related("job_post").all()
    serializer_class = CVSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ("create",):
            return [permissions.IsAuthenticated(), IsCandidate()]
        if self.action in ("list",):
            return [permissions.IsAuthenticated(), IsHRUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = CV.objects.select_related("job_post").all().order_by("-id")
        user = self.request.user
        if not user.is_authenticated:
            return CV.objects.none()
        if user.role in ("admin", "hr", "hr_admin"):
            return qs
        return qs.filter(submitted_by=user)

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
            request.user.role in ("admin", "hr", "hr_admin")
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

    @action(
        detail=True,
        methods=["get"],
        url_path="videos",
        permission_classes=[permissions.IsAuthenticated],
    )
    def videos(self, request, pk=None):
        session = self.get_object()
        videos = VideoSubmission.objects.filter(interview_session=session).order_by("-timestamp", "-id")
        return Response(VideoUploadSerializer(videos, many=True).data)

    @action(
        detail=True,
        methods=["get"],
        url_path="answers-review",
        permission_classes=[permissions.IsAuthenticated],
    )
    def answers_review(self, request, pk=None):
        session = self.get_object()
        answers = Answer.objects.filter(interview_session=session).select_related("question").order_by("id")
        return Response(AnswerReviewSerializer(answers, many=True).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="submit-feedback",
        permission_classes=[permissions.IsAuthenticated, IsInterviewer],
    )
    def submit_feedback(self, request, pk=None):
        session = self.get_object()
        if session.interviewer_id != request.user.id and request.user.role != "admin":
            return Response({"detail": "Not assigned to this interview."}, status=status.HTTP_403_FORBIDDEN)
        feedback = request.data.get("feedback")
        if not isinstance(feedback, str) or not feedback.strip():
            return Response({"feedback": "Feedback is required."}, status=status.HTTP_400_BAD_REQUEST)
        session.feedback = feedback.strip()
        session.save(update_fields=["feedback"])
        return Response(InterviewSessionSerializer(session).data)


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


class CandidateViewSet(viewsets.ModelViewSet):
    """Public candidate registration; HR can list profiles."""

    queryset = Candidate.objects.all().order_by("-created_at")
    serializer_class = CandidateSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated(), IsHRUser()]
        return [permissions.IsAuthenticated(), IsHRUser()]


class JobAccessViewSet(viewsets.ModelViewSet):
    """
    Alias endpoints:
    - GET /api/jobs/ — published jobs for public; all jobs for HR staff
    - POST/PATCH /api/jobs/ — HR + ADMIN
    """

    queryset = JobPost.objects.all().order_by("-id")
    serializer_class = JobPostSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsHRUser()]

    def get_queryset(self):
        qs = JobPost.objects.all().order_by("-id")
        if self.action in ("list", "retrieve"):
            user = self.request.user
            if user.is_authenticated and user_has_hr_access(user):
                return qs
            return qs.filter(posting_status=JobPost.PostingStatus.PUBLISHED)
        return qs


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    Job applications (JobApplication):
    - POST /api/applications/ — public with candidate_* fields or authenticated candidate
    - GET /api/applications/ — HR + ADMIN
    - GET /api/applications/mine/ — authenticated candidate's own applications
    - POST /api/applications/{id}/status/ — HR status workflow
    """

    queryset = CV.objects.select_related("job_post", "candidate").all().order_by("-submitted_at", "-id")
    serializer_class = CVSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        if self.action == "mine":
            return [permissions.IsAuthenticated()]
        if self.action in ("list", "retrieve", "update_status"):
            return [permissions.IsAuthenticated(), IsHRUser()]
        return [permissions.IsAuthenticated(), IsHRUser()]

    def get_queryset(self):
        qs = CV.objects.select_related("job_post", "candidate").all().order_by("-submitted_at", "-id")
        user = self.request.user
        if user_has_hr_access(user):
            return qs
        if self.action == "mine":
            return applications_for_user(user)
        return qs.filter(submitted_by=user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated:
            serializer.save(submitted_by=user)
        else:
            serializer.save(submitted_by=None)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("Application create validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        qs = applications_for_user(request.user)
        return Response(CVSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="status")
    def update_status(self, request, pk=None):
        application = self.get_object()
        payload = ApplicationStatusActionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        try:
            updated = apply_application_status_action(application, payload.validated_data["action"])
        except ValidationError as exc:
            detail = exc.detail
            if isinstance(detail, dict) and "detail" in detail:
                return Response({"detail": detail["detail"]}, status=status.HTTP_400_BAD_REQUEST)
            return Response(detail, status=status.HTTP_400_BAD_REQUEST)
        return Response(CVSerializer(updated).data)


def user_has_hr_access(user) -> bool:
    role = getattr(user, "role", None)
    return role in ("admin", "hr", "hr_admin")


def applications_for_user(user):
    qs = CV.objects.select_related("job_post", "candidate").order_by("-submitted_at", "-id")
    if not user or not user.is_authenticated:
        return qs.none()
    email = (getattr(user, "email", None) or "").strip()
    filters = Q(submitted_by=user)
    if email:
        filters |= Q(candidate__email__iexact=email)
    return qs.filter(filters)


class InterviewAccessViewSet(viewsets.ModelViewSet):
    """
    Alias endpoints:
    - POST /api/interviews/ HR
    - GET /api/interviews/ INTERVIEWER + ADMIN
    """

    queryset = InterviewSession.objects.select_related("cv", "interviewer").all().order_by("-start_time", "-id")
    serializer_class = InterviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create",):
            return [permissions.IsAuthenticated(), IsHRUser()]
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated(), IsInterviewerOrHRStaff()]
        return [permissions.IsAuthenticated(), IsHRUser()]

    def get_queryset(self):
        qs = InterviewSession.objects.select_related("cv", "interviewer").all().order_by("-start_time", "-id")
        user = self.request.user
        if user.role == "admin":
            return qs
        if user.role == "interviewer":
            return qs.filter(interviewer=user)
        if user.role in ("hr", "hr_admin"):
            return qs
        return InterviewSession.objects.none()
