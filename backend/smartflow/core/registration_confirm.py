"""Candidate email confirmation helpers."""

from __future__ import annotations

import secrets
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.utils import timezone

from .emails import send_candidate_confirmation_email
from .models import CandidateRegistrationPending, User


def _pending_unconfirmed():
    return CandidateRegistrationPending.objects.filter(confirmed_at__isnull=True)


def username_or_email_taken(username: str, email: str) -> str | None:
    if User.objects.filter(username__iexact=username).exists():
        return "This username is already registered."
    if User.objects.filter(email__iexact=email).exists():
        return "This email is already registered."
    if _pending_unconfirmed().filter(username__iexact=username).exists():
        return "A confirmation email was already sent for this username."
    if _pending_unconfirmed().filter(email__iexact=email).exists():
        return "A confirmation email was already sent for this address."
    return None


def create_candidate_pending_and_send_email(
    *,
    username: str,
    email: str,
    password: str,
    first_name: str = "",
    last_name: str = "",
    confirmation_hours: int = 24,
) -> CandidateRegistrationPending:
    conflict = username_or_email_taken(username, email)
    if conflict:
        raise ValueError(conflict)

    now = timezone.now()
    _pending_unconfirmed().filter(expires_at__lt=now, username__iexact=username).delete()
    _pending_unconfirmed().filter(expires_at__lt=now, email__iexact=email).delete()

    pending = CandidateRegistrationPending.objects.create(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        password=make_password(password),
        token=secrets.token_urlsafe(32),
        expires_at=now + timedelta(hours=confirmation_hours),
    )
    send_candidate_confirmation_email(
        email=pending.email,
        username=pending.username,
        token=pending.token,
    )
    return pending


def confirm_candidate_registration(token: str) -> tuple[User | None, str]:
    """Activate account from confirmation token. Returns (user, error_message)."""
    if not token or not str(token).strip():
        return None, "Confirmation token is missing."

    pending = CandidateRegistrationPending.objects.filter(token=token.strip()).first()
    if pending is None:
        return None, "Invalid or unknown confirmation link."

    if pending.confirmed_at is not None:
        if pending.created_user_id:
            return pending.created_user, ""
        return None, "This link was already used."

    now = timezone.now()
    if pending.expires_at < now:
        return None, "This confirmation link has expired. Please register again."

    if User.objects.filter(username__iexact=pending.username).exists():
        return None, "This username is already registered."
    if User.objects.filter(email__iexact=pending.email).exists():
        return None, "This email is already registered."

    user = User(
        username=pending.username,
        email=pending.email,
        first_name=pending.first_name,
        last_name=pending.last_name,
        role=User.Role.CANDIDATE,
        password=pending.password,
        is_active=True,
    )
    user.save()

    pending.confirmed_at = now
    pending.created_user = user
    pending.save(update_fields=["confirmed_at", "created_user"])
    return user, ""
