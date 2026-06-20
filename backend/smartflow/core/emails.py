"""Send registration / confirmation emails."""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _frontend_url(path: str) -> str:
    base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    if not path.startswith("/"):
        path = f"/{path}"
    return f"{base}{path}"


def send_candidate_confirmation_email(*, email: str, username: str, token: str) -> None:
    confirm_url = _frontend_url(f"confirm-email?token={token}")
    subject = "Confirm your SmartFlow candidate account"
    message = (
        f"Hello {username},\n\n"
        "Thanks for registering on SmartFlow. Please confirm your email address "
        "to activate your candidate account:\n\n"
        f"{confirm_url}\n\n"
        "This link expires in 24 hours. If you did not register, you can ignore this email.\n\n"
        "— SmartFlow"
    )
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@smartflow.local")
    send_mail(subject, message, from_email, [email], fail_silently=False)
    logger.info("Candidate confirmation email queued for %s", email)
