"""Interview question templates and session helpers."""

from __future__ import annotations

from django.utils import timezone

from .models import CV, InterviewSession, Question


def ensure_interview_session_for_application(application: CV) -> InterviewSession:
    """Return an active session for this application, creating one if needed."""
    active = (
        application.interview_sessions.exclude(status=InterviewSession.STATUS_CANCELLED)
        .order_by("-id")
        .first()
    )
    if active:
        return active
    return InterviewSession.objects.create(
        cv=application,
        start_time=timezone.now(),
        status=InterviewSession.STATUS_SCHEDULED,
    )


def clone_job_questions_to_session(session: InterviewSession) -> int:
    """Copy job-posting interview templates into a session (once). Returns count cloned."""
    if Question.objects.filter(interview_session=session).exists():
        return 0

    job_post = session.cv.job_post
    templates = Question.objects.filter(
        job_post=job_post,
        interview_session__isnull=True,
    ).order_by("sort_order", "id")

    created = 0
    for template in templates:
        Question.objects.create(
            interview_session=session,
            response_type=template.response_type,
            sort_order=template.sort_order,
            text=template.text,
            option_1=template.option_1,
            option_2=template.option_2,
            option_3=template.option_3,
            correct_answer=template.correct_answer,
        )
        created += 1
    return created
