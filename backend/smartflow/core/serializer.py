from django.conf import settings
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password

from .models import SupplierRegistrationRequest, User
from .registration_confirm import create_candidate_pending_and_send_email, username_or_email_taken
from .roles import ALL_ROLES, REGISTRATION_ROLES, effective_role, normalize_role, role_label


def _company_payload(user: User) -> dict:
    try:
        from tenders.access import get_user_company
    except ImportError:
        return {"company_id": None, "company_name": None}
    company = get_user_company(user)
    if company is None:
        return {"company_id": None, "company_name": None}
    return {"company_id": company.pk, "company_name": company.name}


class UserSerializer(serializers.ModelSerializer):
    role_label = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "role_label"]

    def get_role_label(self, obj: User) -> str:
        return role_label(obj.role)


class AdminUserSerializer(serializers.ModelSerializer):
    role_label = serializers.SerializerMethodField(read_only=True)
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_label",
            "last_login",
            "is_active",
            "password",
        ]
        read_only_fields = ("id", "role_label", "last_login")

    def get_role_label(self, obj: User) -> str:
        return role_label(obj.role)

    def validate_role(self, value: str) -> str:
        normalized = normalize_role(value)
        if not normalized or normalized not in ALL_ROLES:
            raise serializers.ValidationError("Invalid role.")
        return normalized

    def create(self, validated_data):
        raw_password = validated_data.pop("password", None)
        if not raw_password:
            raise serializers.ValidationError({"password": "Password is required."})
        user = User(**validated_data)
        user.set_password(raw_password)
        user.save()
        return user

    def update(self, instance: User, validated_data):
        raw_password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if raw_password:
            instance.set_password(raw_password)
        instance.save()
        return instance


class MeSerializer(serializers.ModelSerializer):
    """
    Current authenticated user — canonical role + labels for frontend RBAC.
    Used by GET /api/me/ and GET /api/core/users/me/.
    """

    role = serializers.SerializerMethodField()
    role_label = serializers.SerializerMethodField()
    role_raw = serializers.CharField(source="role", read_only=True)
    is_authenticated = serializers.SerializerMethodField()
    company_id = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_raw",
            "role_label",
            "is_authenticated",
            "company_id",
            "company_name",
        ]

    def get_role(self, obj: User) -> str:
        return effective_role(obj.role) or obj.role

    def get_role_label(self, obj: User) -> str:
        return role_label(obj.role)

    def get_is_authenticated(self, obj: User) -> bool:
        return True

    def get_company_id(self, obj: User):
        return _company_payload(obj)["company_id"]

    def get_company_name(self, obj: User):
        return _company_payload(obj)["company_name"]


class RegisterSerializer(serializers.Serializer):
    """Candidate registration — sends confirmation email; account created on verify."""

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    role = serializers.CharField(required=False, default="candidate")

    def validate_role(self, value: str) -> str:
        normalized = normalize_role(value)
        if not normalized or normalized not in REGISTRATION_ROLES:
            allowed = ", ".join(sorted(REGISTRATION_ROLES))
            raise serializers.ValidationError(
                f"Direct registration is available only for: {allowed}."
            )
        return normalized

    def validate(self, attrs: dict) -> dict:
        conflict = username_or_email_taken(attrs["username"], attrs["email"])
        if conflict:
            raise serializers.ValidationError(conflict)
        return attrs

    def create(self, validated_data):
        hours = getattr(settings, "CANDIDATE_EMAIL_CONFIRMATION_HOURS", 24)
        return create_candidate_pending_and_send_email(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            confirmation_hours=hours,
        )


class ConfirmEmailSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=64)


class SupplierRegistrationRequestSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    reviewed_by_name = serializers.CharField(source="reviewed_by.username", read_only=True)

    class Meta:
        model = SupplierRegistrationRequest
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "company_name",
            "company_city",
            "company_phone",
            "contact_person",
            "status",
            "submitted_at",
            "reviewed_at",
            "reviewed_by",
            "reviewed_by_name",
            "review_notes",
            "created_user",
        ]
        read_only_fields = (
            "status",
            "submitted_at",
            "reviewed_at",
            "reviewed_by",
            "reviewed_by_name",
            "review_notes",
            "created_user",
        )

    def validate_username(self, value: str) -> str:
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already registered.")
        pending = SupplierRegistrationRequest.objects.filter(
            username__iexact=value,
            status=SupplierRegistrationRequest.Status.PENDING,
        ).exists()
        if pending:
            raise serializers.ValidationError("A pending request already exists for this username.")
        return value

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        pending = SupplierRegistrationRequest.objects.filter(
            email__iexact=value,
            status=SupplierRegistrationRequest.Status.PENDING,
        ).exists()
        if pending:
            raise serializers.ValidationError("A pending request already exists for this email.")
        return value

    def create(self, validated_data):
        raw_password = validated_data.pop("password")
        contact = validated_data.get("contact_person", "").strip()
        if not contact:
            validated_data["contact_person"] = (
                f"{validated_data.get('first_name', '')} {validated_data.get('last_name', '')}".strip()
            )
        return SupplierRegistrationRequest.objects.create(
            password=make_password(raw_password),
            status=SupplierRegistrationRequest.Status.PENDING,
            **validated_data,
        )


class SupplierRegistrationReviewSerializer(serializers.Serializer):
    review_notes = serializers.CharField(required=False, allow_blank=True, max_length=2000)
