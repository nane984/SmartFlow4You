import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenders", "0011_supplieroffer_document_created_by"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Procurement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                (
                    "reference_number",
                    models.CharField(
                        blank=True,
                        help_text="External notice or tender reference number.",
                        max_length=64,
                    ),
                ),
                ("description", models.TextField(blank=True)),
                (
                    "link",
                    models.URLField(
                        help_text="URL to the procurement notice on a public portal.",
                        max_length=500,
                    ),
                ),
                (
                    "buyer",
                    models.CharField(
                        blank=True,
                        help_text="Contracting authority or buyer organization.",
                        max_length=255,
                    ),
                ),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("goods", "Goods"),
                            ("services", "Services"),
                            ("works", "Works"),
                            ("mixed", "Mixed"),
                            ("other", "Other"),
                        ],
                        db_index=True,
                        default="other",
                        max_length=20,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("active", "Active"),
                            ("closed", "Closed"),
                            ("cancelled", "Cancelled"),
                        ],
                        db_index=True,
                        default="draft",
                        max_length=20,
                    ),
                ),
                ("deadline", models.DateTimeField(blank=True, null=True)),
                (
                    "estimated_value",
                    models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
                ),
                ("currency", models.CharField(default="EUR", max_length=3)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="procurements_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-deadline", "-created_at", "-id"],
                "indexes": [
                    models.Index(fields=["status", "deadline"], name="tenders_pro_status_8a1f2c_idx"),
                    models.Index(fields=["category", "status"], name="tenders_pro_categor_4b9e1a_idx"),
                ],
            },
        ),
    ]
