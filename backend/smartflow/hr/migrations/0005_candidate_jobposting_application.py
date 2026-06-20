# HR domain: Candidate, JobPosting status/department, JobApplication workflow

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def migrate_job_posting_status(apps, schema_editor):
    JobPost = apps.get_model("hr", "JobPost")
    for job in JobPost.objects.all():
        if job.job_published:
            job.posting_status = "published"
        else:
            job.posting_status = "draft"
        job.save(update_fields=["posting_status"])


def migrate_cv_status(apps, schema_editor):
    CV = apps.get_model("hr", "CV")
    mapping = {
        "pending": "submitted",
        "accepted": "accepted",
        "rejected": "rejected",
    }
    for cv in CV.objects.all():
        new_status = mapping.get(cv.status, cv.status)
        if new_status != cv.status:
            cv.status = new_status
            cv.save(update_fields=["status"])


class Migration(migrations.Migration):

    dependencies = [
        ("hr", "0004_remove_jobpost_job_subsubcategory"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Candidate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(blank=True, max_length=100)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at", "last_name", "first_name"],
            },
        ),
        migrations.AddField(
            model_name="jobpost",
            name="department",
            field=models.CharField(
                blank=True,
                choices=[
                    ("hr", "HR"),
                    ("engineering", "Engineering"),
                    ("operations", "Operations"),
                    ("procurement", "Procurement"),
                    ("other", "Other"),
                ],
                default="hr",
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="jobpost",
            name="posting_status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("published", "Published"),
                    ("closed", "Closed"),
                ],
                db_index=True,
                default="draft",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="cv",
            name="candidate",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="applications",
                to="hr.candidate",
            ),
        ),
        migrations.AddField(
            model_name="cv",
            name="submitted_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.RunPython(migrate_cv_status, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="cv",
            name="status",
            field=models.CharField(
                choices=[
                    ("submitted", "Submitted"),
                    ("reviewed", "Reviewed"),
                    ("interview", "Interview"),
                    ("rejected", "Rejected"),
                    ("accepted", "Accepted"),
                ],
                db_index=True,
                default="submitted",
                max_length=20,
            ),
        ),
        migrations.AlterModelOptions(
            name="cv",
            options={"ordering": ["-submitted_at", "-id"]},
        ),
        migrations.RunPython(migrate_job_posting_status, migrations.RunPython.noop),
    ]
