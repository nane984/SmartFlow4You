from django.db import models
from core.models import User


class JobPost(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)


class CV(models.Model):
    file = models.FileField(upload_to='cvs/')                       # u folder cvs uploaduje cv
    aplicant_name = models.CharField(max_length=255)
    job_post = models.ForeignKey(JobPost, on_delete=models.CASCADE)
    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_cvs",
        help_text="Authenticated user who submitted this CV (for candidate-scoped APIs).",
    )
    score = models.FloatField(null=True)
    processed = models.BooleanField(default=False)


class InterviewSession(models.Model):
    STATUS_SCHEDULED = "scheduled"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, "Scheduled"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name="interview_sessions")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    interviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    duration_seconds = models.IntegerField(default=120)


class VideoSubmission(models.Model):
    interview_session = models.ForeignKey(
        InterviewSession, on_delete=models.CASCADE, related_name="video_submissions"
    )
    video = models.FileField(upload_to="interview_videos/")
    timestamp = models.DateTimeField(auto_now_add=True)


class Question(models.Model):
    ANSWER_OPTION_1 = "option_1"
    ANSWER_OPTION_2 = "option_2"
    ANSWER_OPTION_3 = "option_3"

    ANSWER_CHOICES = [
        (ANSWER_OPTION_1, "Option 1"),
        (ANSWER_OPTION_2, "Option 2"),
        (ANSWER_OPTION_3, "Option 3"),
    ]

    interview_session = models.ForeignKey(
        InterviewSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="session_questions",
        help_text="When set, this question is part of that interview room (not shown globally).",
    )
    text = models.TextField()
    option_1 = models.CharField(max_length=255)
    option_2 = models.CharField(max_length=255)
    option_3 = models.CharField(max_length=255)
    correct_answer = models.CharField(max_length=10, choices=ANSWER_CHOICES)


class Answer(models.Model):
    interview_session = models.ForeignKey(
        InterviewSession, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    selected_answer = models.CharField(max_length=10, choices=Question.ANSWER_CHOICES)