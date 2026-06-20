from django.contrib import admin

from .models import Answer, Candidate, CV, InterviewSession, JobPost, Question, VideoSubmission


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ("id", "first_name", "last_name", "email", "created_at")
    search_fields = ("first_name", "last_name", "email")


@admin.register(JobPost)
class JobPostAdmin(admin.ModelAdmin):
    list_display = ("id", "job_title", "job_company", "job_location", "job_description", "job_responsibilities", "job_requirements", "job_benefits", "job_salary_min", "job_salary_max", "job_type", "job_category", "job_subcategory", "job_published", "job_published_at", "job_created_by")
    list_filter = ("posting_status", "department", "job_published")
    search_fields = ("job_title", "job_company", "job_location", "job_description", "job_responsibilities", "job_requirements", "job_benefits", "job_salary_min", "job_salary_max", "job_type", "job_category", "job_subcategory", "job_published", "job_published_at", "job_created_by")


@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = ("id", "aplicant_name", "candidate", "job_post", "status", "submitted_at", "submitted_by")
    list_filter = ("status", "processed", "job_post")
    search_fields = ("aplicant_name",)


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "cv", "status", "score", "start_time", "end_time")
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
