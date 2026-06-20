from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from tenders.models import Company

from .models import SupplierRegistrationRequest, User
from .permissions import IsAdmin, IsCandidate
from .registration_confirm import confirm_candidate_registration
from .serializer import (
    AdminUserSerializer,
    ConfirmEmailSerializer,
    MeSerializer,
    RegisterSerializer,
    SupplierRegistrationRequestSerializer,
    SupplierRegistrationReviewSerializer,
)


class MeAPIView(APIView):
    """
    GET /api/me/ — current user profile + canonical role (JWT required).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class CandidateProfileAPIView(APIView):
    """
    GET/POST /api/me/candidate-profile/
    Links the logged-in User to an HR Candidate record (by email) for job applications.
    """

    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def get(self, request):
        from hr.models import Candidate
        from hr.serializer import CandidateSerializer

        user = request.user
        candidate = Candidate.objects.filter(email__iexact=user.email).first()
        return Response(
            {
                "account": MeSerializer(user).data,
                "hr_profile": CandidateSerializer(candidate).data if candidate else None,
                "linked": candidate is not None,
            }
        )

    def post(self, request):
        """Ensure HR Candidate exists for this user (get_or_create by email)."""
        from hr.models import Candidate
        from hr.serializer import CandidateSerializer

        user = request.user
        candidate, created = Candidate.objects.get_or_create(
            email=user.email.strip().lower(),
            defaults={
                "first_name": user.first_name or user.username,
                "last_name": user.last_name or "",
            },
        )
        updated = False
        if user.first_name and candidate.first_name != user.first_name:
            candidate.first_name = user.first_name
            updated = True
        if user.last_name and candidate.last_name != user.last_name:
            candidate.last_name = user.last_name
            updated = True
        if updated:
            candidate.save(update_fields=["first_name", "last_name"])

        return Response(
            {
                "hr_profile": CandidateSerializer(candidate).data,
                "linked": True,
                "created": created,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def destroy(self, request, *args, **kwargs):
        target = self.get_object()
        if target.pk == request.user.pk:
            return Response(
                {"detail": "You cannot delete your own admin account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated], url_path="me")
    def me(self, request):
        """Backward-compatible alias: GET /api/core/users/me/"""
        return Response(MeSerializer(request.user).data)


class RegisterViewSet(viewsets.ViewSet):
    """Candidate self-registration — sends email confirmation link."""

    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "detail": (
                    "Registration almost complete. We sent a confirmation link to your email. "
                    "Click the link to activate your candidate account."
                ),
                "email": serializer.validated_data["email"],
            },
            status=status.HTTP_201_CREATED,
        )


class ConfirmEmailAPIView(APIView):
    """POST /api/core/confirm-email/ — activate candidate account from email token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ConfirmEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        user, error = confirm_candidate_registration(token)
        if error and user is None:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "detail": "Your email is confirmed and your account is active. You can sign in now.",
                "username": user.username if user else None,
            },
            status=status.HTTP_200_OK,
        )


class SupplierRegistrationRequestViewSet(viewsets.ModelViewSet):
    """
    Public POST to request a supplier account; admin list/review/approve/reject.
    """

    queryset = SupplierRegistrationRequest.objects.select_related(
        "reviewed_by",
        "created_user",
    ).all()
    serializer_class = SupplierRegistrationRequestSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            {
                "detail": (
                    "Your supplier registration request has been submitted. "
                    "An administrator will review it before you can sign in."
                ),
                "id": instance.id,
                "status": instance.status,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        reg = self.get_object()
        if reg.status != SupplierRegistrationRequest.Status.PENDING:
            return Response(
                {"detail": "This request has already been processed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username__iexact=reg.username).exists():
            return Response(
                {"detail": "Username is already registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(email__iexact=reg.email).exists():
            return Response(
                {"detail": "Email is already registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review = SupplierRegistrationReviewSerializer(data=request.data)
        review.is_valid(raise_exception=True)
        notes = review.validated_data.get("review_notes", "")

        company = Company.objects.filter(
            email__iexact=reg.email,
            company_type=Company.CompanyType.SUPPLIER,
        ).first()
        if company is None:
            company = Company.objects.create(
                company_type=Company.CompanyType.SUPPLIER,
                name=reg.company_name,
                email=reg.email,
                city=reg.company_city,
                phone=reg.company_phone,
                contact_person=reg.contact_person,
            )
        else:
            company.name = reg.company_name
            company.city = reg.company_city
            company.phone = reg.company_phone or company.phone
            company.contact_person = reg.contact_person or company.contact_person
            company.save()

        user = User(
            username=reg.username,
            email=reg.email,
            first_name=reg.first_name,
            last_name=reg.last_name,
            role=User.Role.SUPPLIER,
            company=company,
            password=reg.password,
        )
        user.save()

        reg.status = SupplierRegistrationRequest.Status.APPROVED
        reg.reviewed_at = timezone.now()
        reg.reviewed_by = request.user
        reg.review_notes = notes
        reg.created_user = user
        reg.save(
            update_fields=[
                "status",
                "reviewed_at",
                "reviewed_by",
                "review_notes",
                "created_user",
            ]
        )
        return Response(SupplierRegistrationRequestSerializer(reg).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        reg = self.get_object()
        if reg.status != SupplierRegistrationRequest.Status.PENDING:
            return Response(
                {"detail": "This request has already been processed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review = SupplierRegistrationReviewSerializer(data=request.data)
        review.is_valid(raise_exception=True)
        notes = review.validated_data.get("review_notes", "")
        if not notes.strip():
            return Response(
                {"review_notes": "Please provide a reason for rejection."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reg.status = SupplierRegistrationRequest.Status.REJECTED
        reg.reviewed_at = timezone.now()
        reg.reviewed_by = request.user
        reg.review_notes = notes.strip()
        reg.save(update_fields=["status", "reviewed_at", "reviewed_by", "review_notes"])
        return Response(SupplierRegistrationRequestSerializer(reg).data)
