from django.db import models
from core.models import User


class Candidate(models.Model):
    """Job seeker profile (HR domain) — may exist without platform User account."""

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "last_name", "first_name"]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or self.email


class JobPost(models.Model):
    """Job posting (JobPosting) — HR creates and publishes roles."""

    class PostingStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        CLOSED = "closed", "Closed"

    class Department(models.TextChoices):
        HR = "hr", "HR"
        ENGINEERING = "engineering", "Engineering"
        OPERATIONS = "operations", "Operations"
        PROCUREMENT = "procurement", "Procurement"
        OTHER = "other", "Other"

    job_title = models.CharField(max_length=255)
    job_company = models.CharField(max_length=255)
    job_location = models.CharField(max_length=255)
    job_description = models.TextField()
    job_responsibilities = models.TextField()
    job_requirements = models.TextField()
    job_benefits = models.TextField()
    job_salary_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    job_salary_max = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    null=True,
    blank=True
)
    job_type = models.CharField(max_length=255)
    job_category = models.CharField(max_length=255)
    job_subcategory = models.CharField(max_length=255)
    
    department = models.CharField(
        max_length=50,
        choices=Department.choices,
        default=Department.HR,
        blank=True,
    )
    posting_status = models.CharField(
        max_length=20,
        choices=PostingStatus.choices,
        default=PostingStatus.DRAFT,
        db_index=True,
    )
    job_created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    job_published = models.BooleanField(default=False)
    job_published_at = models.DateTimeField(null=True, blank=True)

    @property
    def is_published(self) -> bool:
        return self.posting_status == self.PostingStatus.PUBLISHED or self.job_published


class CV(models.Model):
    """
    Job application (JobApplication) — candidate CV upload for a job posting.
  """

    class ApplicationStatus(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        REVIEWED = "reviewed", "Reviewed"
        INTERVIEW = "interview", "Interview"
        REJECTED = "rejected", "Rejected"
        ACCEPTED = "accepted", "Accepted"

    file = models.FileField(upload_to="cvs/")
    aplicant_name = models.CharField(max_length=255)
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="applications",
    )
    job_post = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name="applications")
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
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.SUBMITTED,
        db_index=True,
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at", "-id"]


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
    score = models.FloatField(
        null=True,
        blank=True,
        help_text="Final interview test score (0-100). Calculated once on answer submission.",
    )
    feedback = models.TextField(null=True, blank=True)
    focus_violations = models.PositiveIntegerField(
        default=0,
        help_text="Times the candidate left the interview tab/window during an active session.",
    )


class ApplicationStatusHistory(models.Model):
    """Audit log when HR changes application (CV) workflow status."""

    application = models.ForeignKey(CV, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="application_status_changes",
    )
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-changed_at", "-id"]
        verbose_name_plural = "Application status histories"


class VideoSubmission(models.Model):
    interview_session = models.ForeignKey(
        InterviewSession, on_delete=models.CASCADE, related_name="video_submissions"
    )
    video = models.FileField(upload_to="interview_videos/")
    timestamp = models.DateTimeField(auto_now_add=True)


class Question(models.Model):
    class ResponseType(models.TextChoices):
        TEXT = "text", "Text"
        VIDEO = "video", "Video"
        AUDIO = "audio", "Audio"
        MULTIPLE_CHOICE = "multiple_choice", "Multiple choice"

    ANSWER_OPTION_1 = "option_1"
    ANSWER_OPTION_2 = "option_2"
    ANSWER_OPTION_3 = "option_3"

    ANSWER_CHOICES = [
        (ANSWER_OPTION_1, "Option 1"),
        (ANSWER_OPTION_2, "Option 2"),
        (ANSWER_OPTION_3, "Option 3"),
    ]

    job_post = models.ForeignKey(
        JobPost,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="interview_questions",
        help_text="Job template question (HR-managed). Cloned into sessions on interview start.",
    )
    interview_session = models.ForeignKey(
        InterviewSession,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="session_questions",
        help_text="When set, this question belongs to a live interview session.",
    )
    response_type = models.CharField(
        max_length=20,
        choices=ResponseType.choices,
        default=ResponseType.MULTIPLE_CHOICE,
    )
    sort_order = models.PositiveIntegerField(default=0)
    text = models.TextField()
    option_1 = models.CharField(max_length=255, blank=True)
    option_2 = models.CharField(max_length=255, blank=True)
    option_3 = models.CharField(max_length=255, blank=True)
    correct_answer = models.CharField(max_length=10, choices=ANSWER_CHOICES, blank=True)

    class Meta:
        ordering = ["sort_order", "id"]


class Answer(models.Model):
    interview_session = models.ForeignKey(
        InterviewSession, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    selected_answer = models.CharField(max_length=10, choices=Question.ANSWER_CHOICES, blank=True)
    text_response = models.TextField(blank=True)
    media_file = models.FileField(upload_to="interview_answers/", null=True, blank=True)
    answered_at = models.DateTimeField(auto_now=True)