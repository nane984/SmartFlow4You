"""HR application review workflow helpers."""

from __future__ import annotations

from rest_framework.exceptions import ValidationError

from .interview_helpers import ensure_interview_session_for_application
from .models import ApplicationStatusHistory, CV


def log_application_status_change(
    application: CV,
    *,
    from_status: str,
    to_status: str,
    changed_by=None,
    note: str = "",
) -> ApplicationStatusHistory:
    return ApplicationStatusHistory.objects.create(
        application=application,
        from_status=from_status or "",
        to_status=to_status,
        changed_by=changed_by,
        note=note,
    )


def apply_application_status_action(application: CV, action: str, *, changed_by=None) -> CV:
    status = application.status
    previous = status

    if action == "mark_reviewed":
        if status not in (CV.ApplicationStatus.SUBMITTED,):
            raise ValidationError({"detail": "Only new applications can be marked as reviewed."})
        application.processed = True
        application.status = CV.ApplicationStatus.REVIEWED

    elif action == "move_next":
        application.processed = True
        if status == CV.ApplicationStatus.SUBMITTED:
            application.status = CV.ApplicationStatus.REVIEWED
        elif status == CV.ApplicationStatus.REVIEWED:
            application.status = CV.ApplicationStatus.INTERVIEW
        elif status == CV.ApplicationStatus.INTERVIEW:
            application.status = CV.ApplicationStatus.ACCEPTED
        else:
            raise ValidationError({"detail": "This application cannot move to the next step."})

    elif action == "reject":
        application.processed = True
        application.status = CV.ApplicationStatus.REJECTED

    else:
        raise ValidationError({"action": "Unknown action."})

    application.save(update_fields=["processed", "status"])
    if application.status != previous:
        log_application_status_change(
            application,
            from_status=previous,
            to_status=application.status,
            changed_by=changed_by,
            note=action,
        )
        if application.status == CV.ApplicationStatus.INTERVIEW:
            ensure_interview_session_for_application(application)
    return application
