from pathlib import Path

from django.conf import settings
from django.db import models
from rest_framework import serializers

from .models import Answer, ApplicationStatusHistory, Candidate, CV, InterviewSession, JobPost, Question, VideoSubmission

ALLOWED_CV_EXTENSIONS = frozenset({".pdf", ".doc", ".docx"})

APPLICATION_STATUS_LABELS = {
    "submitted": "Application received",
    "reviewed": "CV reviewed",
    "interview": "Interview stage",
    "accepted": "Selected for position",
    "rejected": "Not selected",
}


class ApplicationStatusActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=(
            ("mark_reviewed", "Mark as reviewed"),
            ("move_next", "Move to next step"),
            ("reject", "Not selected for this position"),
        )
    )


class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ("id", "first_name", "last_name", "email", "created_at")
        read_only_fields = ("id", "created_at")


class JobPostSerializer(serializers.ModelSerializer):
    """Job posting (JobPosting) API representation."""

    title = serializers.CharField(source="job_title", read_only=True)
    description = serializers.CharField(source="job_description", read_only=True)

    class Meta:
        model = JobPost
        fields = "__all__"

    def validate(self, attrs):
        status = attrs.get("posting_status")
        if status == JobPost.PostingStatus.PUBLISHED:
            attrs["job_published"] = True
            if not attrs.get("job_published_at") and not (self.instance and self.instance.job_published_at):
                from django.utils import timezone

                attrs["job_published_at"] = timezone.now()
        elif status in (JobPost.PostingStatus.DRAFT, JobPost.PostingStatus.CLOSED):
            if status == JobPost.PostingStatus.DRAFT:
                attrs["job_published"] = False
        return super().validate(attrs)


class CVSerializer(serializers.ModelSerializer):
    """Job application (JobApplication) — CV file upload."""

    job_posting = serializers.PrimaryKeyRelatedField(
        source="job_post",
        queryset=JobPost.objects.all(),
        write_only=True,
    )
    candidate_email = serializers.EmailField(write_only=True, required=False)
    candidate_first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    candidate_last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    candidate_name = serializers.SerializerMethodField()
    job_title = serializers.CharField(source="job_post.job_title", read_only=True)
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = CV
        fields = (
            "id",
            "file",
            "aplicant_name",
            "job_posting",
            "job_post",
            "job_title",
            "candidate",
            "candidate_email",
            "candidate_first_name",
            "candidate_last_name",
            "candidate_name",
            "submitted_by",
            "score",
            "processed",
            "status",
            "status_label",
            "submitted_at",
        )
        read_only_fields = (
            "id",
            "job_post",
            "score",
            "processed",
            "submitted_by",
            "submitted_at",
            "candidate",
        )

    def get_status_label(self, obj: CV) -> str:
        return APPLICATION_STATUS_LABELS.get(obj.status, obj.status.replace("_", " ").title())

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["job_posting"] = instance.job_post_id
        data["job_post"] = instance.job_post_id
        request = self.context.get("request")
        if instance.file and request is not None:
            data["file"] = request.build_absolute_uri(instance.file.url)
        elif instance.file:
            data["file"] = instance.file.url
        return data

    def get_candidate_name(self, obj: CV) -> str:
        if obj.candidate_id:
            c = obj.candidate
            return f"{c.first_name} {c.last_name}".strip()
        return obj.aplicant_name

    def _resolve_candidate(self, validated_data: dict) -> Candidate | None:
        email = validated_data.pop("candidate_email", None)
        first = validated_data.pop("candidate_first_name", None) or ""
        last = validated_data.pop("candidate_last_name", None) or ""
        if not email:
            return validated_data.get("candidate")
        candidate, _ = Candidate.objects.get_or_create(
            email=email.strip().lower(),
            defaults={
                "first_name": first.strip() or validated_data.get("aplicant_name", "Candidate"),
                "last_name": last.strip(),
            },
        )
        if first and candidate.first_name != first.strip():
            candidate.first_name = first.strip()
            candidate.save(update_fields=["first_name"])
        if last and candidate.last_name != last.strip():
            candidate.last_name = last.strip()
            candidate.save(update_fields=["last_name"])
        return candidate

    def create(self, validated_data):
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            user = request.user
            validated_data.setdefault("candidate_email", user.email)
            validated_data.setdefault("candidate_first_name", user.first_name or "")
            validated_data.setdefault("candidate_last_name", user.last_name or "")
        candidate = self._resolve_candidate(validated_data)
        if candidate:
            validated_data["candidate"] = candidate
            if not validated_data.get("aplicant_name"):
                validated_data["aplicant_name"] = f"{candidate.first_name} {candidate.last_name}".strip()
        return super().create(validated_data)

    def validate_file(self, file):
        max_bytes = getattr(settings, "HR_CV_MAX_UPLOAD_BYTES", 5 * 1024 * 1024)
        if file.size > max_bytes:
            max_mb = max(max_bytes // (1024 * 1024), 1)
            raise serializers.ValidationError(
                f"File too large. Maximum size is {max_mb} MB."
            )

        name = getattr(file, "name", "") or ""
        ext = Path(name).suffix.lower()
        if ext not in ALLOWED_CV_EXTENSIONS:
            raise serializers.ValidationError(
                "Invalid file type. Allowed: PDF (.pdf), Microsoft Word (.doc, .docx)."
            )

        return file


class InterviewSessionSerializer(serializers.ModelSerializer):
    """
    Full CRUD for InterviewSession (writes restricted to staff in the view).
    Status transitions: scheduled → in_progress → completed; scheduled/in_progress → cancelled.
    """

    job_title = serializers.CharField(source="cv.job_post.job_title", read_only=True)
    job_post_id = serializers.IntegerField(source="cv.job_post_id", read_only=True)
    application_id = serializers.IntegerField(source="cv_id", read_only=True)
    applicant_name = serializers.CharField(source="cv.aplicant_name", read_only=True)

    class Meta:
        model = InterviewSession
        fields = (
            "id",
            "cv",
            "application_id",
            "job_post_id",
            "job_title",
            "applicant_name",
            "start_time",
            "end_time",
            "status",
            "interviewer",
            "duration_seconds",
            "score",
            "feedback",
            "focus_violations",
        )
        read_only_fields = ("score",)

    def validate_duration_seconds(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError("Duration must be at least 1 second.")
        return value

    def validate(self, attrs):
        if self.instance is None:
            status = attrs.get("status", InterviewSession.STATUS_SCHEDULED)
            if status != InterviewSession.STATUS_SCHEDULED:
                raise serializers.ValidationError(
                    {
                        "status": "New interview sessions must have status 'scheduled' "
                        "(omit the field to use the default)."
                    }
                )
            attrs["status"] = status

        start = attrs.get("start_time")
        end = attrs.get("end_time")
        if self.instance is not None:
            start = start if start is not None else self.instance.start_time
            end = end if end is not None else self.instance.end_time
        if start is not None and end is not None and end < start:
            raise serializers.ValidationError(
                {"end_time": "End time must be on or after start time."}
            )

        if self.instance is not None:
            old_status = self.instance.status
            new_status = attrs.get("status", old_status)
            if new_status != old_status:
                self._validate_status_transition(old_status, new_status)

        return attrs

    @staticmethod
    def _validate_status_transition(old: str, new: str) -> None:
        terminal = (
            InterviewSession.STATUS_COMPLETED,
            InterviewSession.STATUS_CANCELLED,
        )
        if old in terminal:
            raise serializers.ValidationError(
                {"status": "Cannot change status once it is completed or cancelled."}
            )

        allowed = {
            InterviewSession.STATUS_SCHEDULED: (
                InterviewSession.STATUS_IN_PROGRESS,
                InterviewSession.STATUS_CANCELLED,
            ),
            InterviewSession.STATUS_IN_PROGRESS: (
                InterviewSession.STATUS_COMPLETED,
                InterviewSession.STATUS_CANCELLED,
            ),
        }
        if new not in allowed.get(old, ()):
            raise serializers.ValidationError(
                {
                    "status": (
                        f"Invalid status transition from '{old}' to '{new}'. "
                        "Allowed: scheduled → in_progress | cancelled; "
                        "in_progress → completed | cancelled."
                    )
                }
            )


class JobInterviewQuestionSerializer(serializers.ModelSerializer):
    """HR-managed interview question template for a job posting."""

    class Meta:
        model = Question
        fields = (
            "id",
            "job_post",
            "response_type",
            "sort_order",
            "text",
            "option_1",
            "option_2",
            "option_3",
            "correct_answer",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        response_type = attrs.get(
            "response_type",
            getattr(self.instance, "response_type", Question.ResponseType.MULTIPLE_CHOICE),
        )
        if response_type == Question.ResponseType.MULTIPLE_CHOICE:
            for field in ("option_1", "option_2", "option_3"):
                if not (attrs.get(field) or (self.instance and getattr(self.instance, field))):
                    raise serializers.ValidationError({field: "Required for multiple choice questions."})
            if not (attrs.get("correct_answer") or (self.instance and self.instance.correct_answer)):
                raise serializers.ValidationError({"correct_answer": "Required for multiple choice questions."})
        return attrs

    def create(self, validated_data):
        validated_data["interview_session"] = None
        if not validated_data.get("job_post"):
            raise serializers.ValidationError({"job_post": "This field is required."})
        return super().create(validated_data)


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()
    from_status_label = serializers.SerializerMethodField()
    to_status_label = serializers.SerializerMethodField()
    application_id = serializers.IntegerField(source="application.id", read_only=True)
    candidate_name = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationStatusHistory
        fields = (
            "id",
            "application_id",
            "candidate_name",
            "job_title",
            "from_status",
            "from_status_label",
            "to_status",
            "to_status_label",
            "changed_at",
            "changed_by",
            "changed_by_name",
            "note",
        )

    def get_changed_by_name(self, obj):
        user = obj.changed_by
        if not user:
            return "System"
        return user.get_full_name() or user.username

    def get_from_status_label(self, obj):
        return APPLICATION_STATUS_LABELS.get(obj.from_status, obj.from_status.replace("_", " ").title())

    def get_to_status_label(self, obj):
        return APPLICATION_STATUS_LABELS.get(obj.to_status, obj.to_status.replace("_", " ").title())

    def get_candidate_name(self, obj):
        return obj.application.aplicant_name

    def get_job_title(self, obj):
        return obj.application.job_post.job_title


class QuestionPublicSerializer(serializers.ModelSerializer):
    """Candidate-facing question (no correct answer)."""

    class Meta:
        model = Question
        fields = ("id", "text", "response_type", "option_1", "option_2", "option_3")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.response_type != Question.ResponseType.MULTIPLE_CHOICE:
            data.pop("option_1", None)
            data.pop("option_2", None)
            data.pop("option_3", None)
        return data


class SubmitAnswerItemSerializer(serializers.Serializer):
    question = serializers.IntegerField(min_value=1)
    selected_answer = serializers.ChoiceField(choices=Question.ANSWER_CHOICES, required=False)
    text_response = serializers.CharField(required=False, allow_blank=True)


class SubmitAnswersSerializer(serializers.Serializer):
    answers = SubmitAnswerItemSerializer(many=True)

    def validate_answers(self, answers):
        session = self.context["session"]
        session_questions = list(Question.objects.filter(interview_session=session))
        if not session_questions:
            raise serializers.ValidationError("No questions in this session.")

        if not answers:
            non_media = [q for q in session_questions if q.response_type not in (
                Question.ResponseType.VIDEO,
                Question.ResponseType.AUDIO,
            )]
            if non_media:
                raise serializers.ValidationError("Provide at least one answer.")
            for question in session_questions:
                existing = Answer.objects.filter(interview_session=session, question=question).first()
                if not existing or not existing.media_file:
                    raise serializers.ValidationError(
                        f"Question {question.id} requires a media upload before submit."
                    )
            return answers

        seen: set[int] = set()
        for item in answers:
            qid = item["question"]
            if qid in seen:
                raise serializers.ValidationError(f"Duplicate question id: {qid}.")
            seen.add(qid)
            question = Question.objects.filter(pk=qid, interview_session=session).first()
            if not question:
                raise serializers.ValidationError(
                    f"Question {qid} is not part of this interview session."
                )
            response_type = question.response_type
            if response_type == Question.ResponseType.MULTIPLE_CHOICE:
                if not item.get("selected_answer"):
                    raise serializers.ValidationError(
                        f"Question {qid} requires selected_answer."
                    )
            elif response_type == Question.ResponseType.TEXT:
                if not (item.get("text_response") or "").strip():
                    raise serializers.ValidationError(
                        f"Question {qid} requires text_response."
                    )
            else:
                existing = Answer.objects.filter(interview_session=session, question=question).first()
                if not existing or not existing.media_file:
                    raise serializers.ValidationError(
                        f"Question {qid} requires a media upload before submit."
                    )
        return answers

    def save(self, **kwargs):
        session = self.context["session"]
        for item in self.validated_data["answers"]:
            question = Question.objects.get(pk=item["question"], interview_session=session)
            defaults = {}
            if question.response_type == Question.ResponseType.MULTIPLE_CHOICE:
                defaults["selected_answer"] = item["selected_answer"]
            elif question.response_type == Question.ResponseType.TEXT:
                defaults["text_response"] = item["text_response"].strip()
            Answer.objects.update_or_create(
                interview_session=session,
                question=question,
                defaults=defaults,
            )

        mc_questions = Question.objects.filter(
            interview_session=session,
            response_type=Question.ResponseType.MULTIPLE_CHOICE,
        )
        if session.score is None and mc_questions.exists():
            total_questions = mc_questions.count()
            correct_answers = Answer.objects.filter(
                interview_session=session,
                question__in=mc_questions,
                selected_answer=models.F("question__correct_answer"),
            ).count()
            session.score = round((correct_answers / total_questions) * 100.0, 2)
            session.save(update_fields=["score"])


class VideoUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoSubmission
        fields = ("id", "video", "timestamp")
        read_only_fields = ("id", "timestamp")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if instance.video and request is not None:
            data["video"] = request.build_absolute_uri(instance.video.url)
        return data


class AnswerReviewSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.text", read_only=True)
    response_type = serializers.CharField(source="question.response_type", read_only=True)
    correct_answer = serializers.CharField(source="question.correct_answer", read_only=True)
    is_correct = serializers.SerializerMethodField()
    media_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = (
            "id",
            "question",
            "question_text",
            "response_type",
            "selected_answer",
            "text_response",
            "media_file",
            "media_file_url",
            "correct_answer",
            "is_correct",
            "answered_at",
        )

    def get_media_file_url(self, obj):
        if not obj.media_file:
            return None
        request = self.context.get("request")
        url = obj.media_file.url
        return request.build_absolute_uri(url) if request else url

    def get_is_correct(self, obj) -> bool | None:
        if obj.question.response_type != Question.ResponseType.MULTIPLE_CHOICE:
            return None
        return obj.selected_answer == obj.question.correct_answer
