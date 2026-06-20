from pathlib import Path

from django.conf import settings
from django.db import models
from rest_framework import serializers

from .models import Answer, Candidate, CV, InterviewSession, JobPost, Question, VideoSubmission

ALLOWED_CV_EXTENSIONS = frozenset({".pdf", ".doc", ".docx"})


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

    job_posting = serializers.PrimaryKeyRelatedField(source="job_post", queryset=JobPost.objects.all())
    candidate_email = serializers.EmailField(write_only=True, required=False)
    candidate_first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    candidate_last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    candidate_name = serializers.SerializerMethodField()

    class Meta:
        model = CV
        fields = (
            "id",
            "file",
            "aplicant_name",
            "job_post",
            "job_posting",
            "candidate",
            "candidate_email",
            "candidate_first_name",
            "candidate_last_name",
            "candidate_name",
            "submitted_by",
            "score",
            "processed",
            "status",
            "submitted_at",
        )
        read_only_fields = ("id", "score", "processed", "submitted_by", "submitted_at", "candidate")

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

    class Meta:
        model = InterviewSession
        fields = (
            "id",
            "cv",
            "start_time",
            "end_time",
            "status",
            "interviewer",
            "duration_seconds",
            "score",
            "feedback",
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


class QuestionPublicSerializer(serializers.ModelSerializer):
    """Candidate-facing question (no correct answer)."""

    class Meta:
        model = Question
        fields = ("id", "text", "option_1", "option_2", "option_3")


class SubmitAnswerItemSerializer(serializers.Serializer):
    question = serializers.IntegerField(min_value=1)
    selected_answer = serializers.ChoiceField(choices=Question.ANSWER_CHOICES)


class SubmitAnswersSerializer(serializers.Serializer):
    answers = SubmitAnswerItemSerializer(many=True)

    def validate_answers(self, answers):
        if not answers:
            raise serializers.ValidationError("Provide at least one answer.")

        session = self.context["session"]
        seen: set[int] = set()
        for item in answers:
            qid = item["question"]
            if qid in seen:
                raise serializers.ValidationError(f"Duplicate question id: {qid}.")
            seen.add(qid)
            if not Question.objects.filter(pk=qid, interview_session=session).exists():
                raise serializers.ValidationError(
                    f"Question {qid} is not part of this interview session."
                )
        return answers

    def save(self, **kwargs):
        session = self.context["session"]
        for item in self.validated_data["answers"]:
            Answer.objects.update_or_create(
                interview_session=session,
                question_id=item["question"],
                defaults={"selected_answer": item["selected_answer"]},
            )

        # Calculate and persist score once (0-100 percentage).
        if session.score is None:
            total_questions = Question.objects.filter(interview_session=session).count()
            if total_questions == 0:
                score_percent = 0.0
            else:
                correct_answers = Answer.objects.filter(
                    interview_session=session,
                    question__interview_session=session,
                    selected_answer=models.F("question__correct_answer"),
                ).count()
                score_percent = round((correct_answers / total_questions) * 100.0, 2)
            session.score = score_percent
            session.save(update_fields=["score"])


class VideoUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoSubmission
        fields = ("id", "video", "timestamp")
        read_only_fields = ("id", "timestamp")


class AnswerReviewSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.text", read_only=True)
    correct_answer = serializers.CharField(source="question.correct_answer", read_only=True)
    is_correct = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = (
            "id",
            "question",
            "question_text",
            "selected_answer",
            "correct_answer",
            "is_correct",
        )

    def get_is_correct(self, obj: Answer) -> bool:
        return obj.selected_answer == obj.question.correct_answer
