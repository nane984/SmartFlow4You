"""HR application review workflow helpers."""

from rest_framework.exceptions import ValidationError

from .models import CV


def apply_application_status_action(application: CV, action: str) -> CV:
    status = application.status

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
    return application
