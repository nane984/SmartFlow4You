# Generated manually for interview questions + status history

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def clear_orphan_user_references(apps, schema_editor):
    """SQLite enforces FKs after migrate — null dangling user ids from old DB rows."""
    User = apps.get_model("core", "User")
    valid_user_ids = set(User.objects.values_list("pk", flat=True))

    CV = apps.get_model("hr", "CV")
    for cv in CV.objects.exclude(submitted_by_id__isnull=True):
        if cv.submitted_by_id not in valid_user_ids:
            cv.submitted_by_id = None
            cv.save(update_fields=["submitted_by_id"])

    InterviewSession = apps.get_model("hr", "InterviewSession")
    for session in InterviewSession.objects.exclude(interviewer_id__isnull=True):
        if session.interviewer_id not in valid_user_ids:
            session.interviewer_id = None
            session.save(update_fields=["interviewer_id"])

    JobPost = apps.get_model("hr", "JobPost")
    for job in JobPost.objects.exclude(job_created_by_id__isnull=True):
        if job.job_created_by_id not in valid_user_ids:
            job.job_created_by_id = None
            job.save(update_fields=["job_created_by_id"])


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("hr", "0006_alter_cv_job_post"),
    ]

    operations = [
        migrations.RunPython(clear_orphan_user_references, migrations.RunPython.noop),
        migrations.AddField(
            model_name="interviewsession",
            name="focus_violations",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Times the candidate left the interview tab/window during an active session.",
            ),
        ),
        migrations.CreateModel(
            name="ApplicationStatusHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("from_status", models.CharField(blank=True, max_length=20)),
                ("to_status", models.CharField(max_length=20)),
                ("changed_at", models.DateTimeField(auto_now_add=True)),
                ("note", models.CharField(blank=True, max_length=255)),
                (
                    "application",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="status_history",
                        to="hr.cv",
                    ),
                ),
                (
                    "changed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="application_status_changes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Application status histories",
                "ordering": ["-changed_at", "-id"],
            },
        ),
        migrations.AddField(
            model_name="question",
            name="job_post",
            field=models.ForeignKey(
                blank=True,
                help_text="Job template question (HR-managed). Cloned into sessions on interview start.",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="interview_questions",
                to="hr.jobpost",
            ),
        ),
        migrations.AddField(
            model_name="question",
            name="response_type",
            field=models.CharField(
                choices=[
                    ("text", "Text"),
                    ("video", "Video"),
                    ("audio", "Audio"),
                    ("multiple_choice", "Multiple choice"),
                ],
                default="multiple_choice",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="question",
            name="sort_order",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name="question",
            name="correct_answer",
            field=models.CharField(
                blank=True,
                choices=[("option_1", "Option 1"), ("option_2", "Option 2"), ("option_3", "Option 3")],
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name="question",
            name="interview_session",
            field=models.ForeignKey(
                blank=True,
                help_text="When set, this question belongs to a live interview session.",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="session_questions",
                to="hr.interviewsession",
            ),
        ),
        migrations.AlterField(
            model_name="question",
            name="option_1",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name="question",
            name="option_2",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name="question",
            name="option_3",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="answer",
            name="answered_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="answer",
            name="media_file",
            field=models.FileField(blank=True, null=True, upload_to="interview_answers/"),
        ),
        migrations.AddField(
            model_name="answer",
            name="text_response",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="answer",
            name="selected_answer",
            field=models.CharField(
                blank=True,
                choices=[("option_1", "Option 1"), ("option_2", "Option 2"), ("option_3", "Option 3")],
                max_length=10,
            ),
        ),
        migrations.AlterModelOptions(
            name="question",
            options={"ordering": ["sort_order", "id"]},
        ),
    ]
