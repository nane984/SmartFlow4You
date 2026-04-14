from pathlib import Path

from django.conf import settings
from rest_framework import serializers

from .models import Answer, CV, InterviewSession, JobPost, Question, VideoSubmission

ALLOWED_CV_EXTENSIONS = frozenset({".pdf", ".doc", ".docx"})


class JobPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPost
        fields = "__all__"


class CVSerializer(serializers.ModelSerializer):
    """CV read/update; `file` validated on write."""

    class Meta:
        model = CV
        fields = (
            "id",
            "file",
            "aplicant_name",
            "job_post",
            "submitted_by",
            "score",
            "processed",
        )
        read_only_fields = ("id", "score", "processed", "submitted_by")

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
        )

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


class VideoUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoSubmission
        fields = ("id", "video", "timestamp")
        read_only_fields = ("id", "timestamp")
