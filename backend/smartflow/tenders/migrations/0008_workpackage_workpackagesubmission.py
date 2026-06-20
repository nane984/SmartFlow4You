# Generated manually for WorkPackage and WorkPackageSubmission

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenders", "0007_tender_document"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkPackage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                (
                    "template_file",
                    models.FileField(
                        blank=True,
                        help_text="Excel template subcontractors fill in and return.",
                        null=True,
                        upload_to="work_packages/templates/%Y/%m/",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "tender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="work_packages",
                        to="tenders.tender",
                    ),
                ),
            ],
            options={
                "ordering": ["name", "id"],
            },
        ),
        migrations.CreateModel(
            name="WorkPackageSubmission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("uploaded_file", models.FileField(upload_to="work_packages/submissions/%Y/%m/")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("submitted", "Submitted"),
                            ("reviewed", "Reviewed"),
                            ("accepted", "Accepted"),
                            ("rejected", "Rejected"),
                        ],
                        db_index=True,
                        default="submitted",
                        max_length=20,
                    ),
                ),
                ("price", models.DecimalField(blank=True, decimal_places=2, max_digits=16, null=True)),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                (
                    "subcontractor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="work_package_submissions",
                        to="tenders.company",
                    ),
                ),
                (
                    "work_package",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="submissions",
                        to="tenders.workpackage",
                    ),
                ),
            ],
            options={
                "ordering": ["-submitted_at", "-id"],
            },
        ),
    ]
