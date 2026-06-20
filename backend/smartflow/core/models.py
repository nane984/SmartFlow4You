from django.contrib.auth.models import AbstractUser
from django.db import models

from .roles import (
    ROLE_ADMIN,
    ROLE_CANDIDATE,
    ROLE_HR_ADMIN,
    ROLE_HR_LEGACY,
    ROLE_INTERVIEWER_LEGACY,
    ROLE_SUPPLIER,
    ROLE_TENDER_USER,
)


class User(AbstractUser):
    """Platform user with a single application role for RBAC."""

    class Role(models.TextChoices):
        ADMIN = ROLE_ADMIN, "Administrator"
        HR_ADMIN = ROLE_HR_ADMIN, "HR Admin"
        TENDER_USER = ROLE_TENDER_USER, "Tender user"
        SUPPLIER = ROLE_SUPPLIER, "Supplier"
        CANDIDATE = ROLE_CANDIDATE, "Candidate"
        # Legacy — kept for existing rows; migrate to HR_ADMIN where possible
        HR = ROLE_HR_LEGACY, "HR (legacy)"
        INTERVIEWER = ROLE_INTERVIEWER_LEGACY, "Interviewer (legacy)"

    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.CANDIDATE,
        db_index=True,
        help_text="Application role for module access (RBAC).",
    )
    company = models.ForeignKey(
        "tenders.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        help_text="Linked organization (required for supplier/tender_user scoping when set).",
    )

    @property
    def normalized_role(self) -> str:
        from .roles import normalize_role

        return normalize_role(self.role) or self.role


class SupplierRegistrationRequest(models.Model):
    """Supplier signup awaiting admin compliance review before account creation."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    username = models.CharField(max_length=150)
    email = models.EmailField()
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    password = models.CharField(max_length=128, help_text="Hashed password — applied when approved.")
    company_name = models.CharField(max_length=255)
    company_city = models.CharField(max_length=100)
    company_phone = models.CharField(max_length=50, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_supplier_requests",
    )
    review_notes = models.TextField(blank=True)
    created_user = models.OneToOneField(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="supplier_registration_request",
    )

    class Meta:
        ordering = ["-submitted_at", "-id"]

    def __str__(self) -> str:
        return f"{self.username} ({self.company_name}) — {self.status}"


class CandidateRegistrationPending(models.Model):
    """Candidate signup — account created only after email confirmation."""

    username = models.CharField(max_length=150)
    email = models.EmailField()
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    password = models.CharField(max_length=128, help_text="Hashed password — applied when confirmed.")
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    confirmed_at = models.DateTimeField(null=True, blank=True)
    created_user = models.OneToOneField(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="candidate_registration_pending",
    )

    class Meta:
        ordering = ["-created_at", "-id"]

    @property
    def is_confirmed(self) -> bool:
        return self.confirmed_at is not None

    def __str__(self) -> str:
        state = "confirmed" if self.is_confirmed else "pending"
        return f"{self.username} ({self.email}) — {state}"
