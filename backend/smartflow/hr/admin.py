from django.contrib import admin

from .models import Answer, CV, InterviewSession, JobPost, Question, VideoSubmission


@admin.register(JobPost)
class JobPostAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "published", "published_at", "created_by")
    list_filter = ("published",)
    search_fields = ("title", "description")


@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = ("id", "aplicant_name", "job_post", "submitted_by", "score", "processed")
    list_filter = ("processed", "job_post")
    search_fields = ("aplicant_name",)


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "cv", "status", "start_time", "end_time")
    list_filter = ("status",)
    search_fields = ("cv__aplicant_name",)


@admin.register(VideoSubmission)
class VideoSubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "interview_session", "timestamp")
    list_filter = ("timestamp",)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "interview_session", "text", "correct_answer")
    search_fields = ("text", "option_1", "option_2", "option_3")


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ("id", "interview_session", "question", "selected_answer")
    list_filter = ("selected_answer",)
