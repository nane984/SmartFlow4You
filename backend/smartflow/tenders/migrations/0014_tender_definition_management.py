# Generated manually for Tender Definition Management

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenders", "0013_rename_tenders_pro_status_8a1f2c_idx_tenders_pro_status_5515fe_idx_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="TenderDefinition",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                (
                    "check_frequency",
                    models.CharField(
                        choices=[
                            ("1h", "Every hour"),
                            ("2h", "Every 2 hours"),
                            ("4h", "Every 4 hours"),
                            ("6h", "Every 6 hours"),
                            ("12h", "Every 12 hours"),
                            ("24h", "Once per day"),
                        ],
                        db_index=True,
                        default="6h",
                        max_length=8,
                    ),
                ),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("last_checked", models.DateTimeField(blank=True, null=True)),
                ("last_successful_check", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="tender_definitions_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "default_investor",
                    models.ForeignKey(
                        help_text="Investor company assigned to automatically imported tenders.",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="tender_definitions",
                        to="tenders.company",
                    ),
                ),
            ],
            options={"ordering": ["name", "id"]},
        ),
        migrations.AddField(
            model_name="tender",
            name="auto_imported",
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text="True when created automatically by a Tender Definition.",
            ),
        ),
        migrations.AddField(
            model_name="tender",
            name="publication_date",
            field=models.DateTimeField(
                blank=True,
                help_text="Original publication date from external source.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="tender",
            name="tender_definition",
            field=models.ForeignKey(
                blank=True,
                help_text="Tender Definition that imported this tender, if any.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="imported_tenders",
                to="tenders.tenderdefinition",
            ),
        ),
        migrations.CreateModel(
            name="TenderKeyword",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("keyword", models.CharField(db_index=True, max_length=128)),
                (
                    "tender_definition",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="keywords",
                        to="tenders.tenderdefinition",
                    ),
                ),
            ],
            options={"ordering": ["keyword", "id"]},
        ),
        migrations.CreateModel(
            name="TenderDefinitionExecutionLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("success", "Success"),
                            ("failed", "Failed"),
                            ("no_new_results", "No new results"),
                        ],
                        db_index=True,
                        default="success",
                        max_length=20,
                    ),
                ),
                ("processed_count", models.PositiveIntegerField(default=0)),
                ("imported_count", models.PositiveIntegerField(default=0)),
                ("skipped_count", models.PositiveIntegerField(default=0)),
                ("error_message", models.TextField(blank=True)),
                (
                    "tender_definition",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="execution_logs",
                        to="tenders.tenderdefinition",
                    ),
                ),
            ],
            options={"ordering": ["-started_at", "-id"]},
        ),
        migrations.CreateModel(
            name="ProcurementSource",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("api_url", models.URLField(help_text="Endpoint URL for this source.", max_length=2048)),
                (
                    "source_type",
                    models.CharField(
                        choices=[
                            ("api", "API"),
                            ("xml", "XML"),
                            ("csv", "CSV"),
                            ("web", "Web scraping (future)"),
                        ],
                        db_index=True,
                        default="api",
                        max_length=16,
                    ),
                ),
                ("enabled", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "tender_definition",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sources",
                        to="tenders.tenderdefinition",
                    ),
                ),
            ],
            options={"ordering": ["name", "id"]},
        ),
        migrations.CreateModel(
            name="TenderImportRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("external_id", models.CharField(blank=True, db_index=True, max_length=255)),
                ("reference_number", models.CharField(blank=True, db_index=True, max_length=255)),
                ("source_url", models.URLField(blank=True, max_length=2048)),
                ("source_name", models.CharField(blank=True, max_length=255)),
                ("imported_at", models.DateTimeField(auto_now_add=True)),
                (
                    "tender",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="import_record",
                        to="tenders.tender",
                    ),
                ),
                (
                    "tender_definition",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="import_records",
                        to="tenders.tenderdefinition",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="TenderNotification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("message", models.TextField()),
                ("link", models.CharField(blank=True, max_length=512)),
                ("is_read", models.BooleanField(db_index=True, default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tender_notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at", "-id"]},
        ),
        migrations.AddConstraint(
            model_name="tenderkeyword",
            constraint=models.UniqueConstraint(
                fields=("tender_definition", "keyword"),
                name="unique_keyword_per_definition",
            ),
        ),
        migrations.AddIndex(
            model_name="tenderimportrecord",
            index=models.Index(fields=["tender_definition", "external_id"], name="tenders_ti_def_ext_idx"),
        ),
        migrations.AddIndex(
            model_name="tenderimportrecord",
            index=models.Index(fields=["tender_definition", "reference_number"], name="tenders_ti_def_ref_idx"),
        ),
    ]
