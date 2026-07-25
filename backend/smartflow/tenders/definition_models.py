"""Tender Definition — automated public procurement discovery and import."""

from django.db import models


class TenderDefinition(models.Model):
    """Rules for discovering and importing public procurements as Tenders."""

    class CheckFrequency(models.TextChoices):
        HOURLY = "1h", "Every hour"
        EVERY_2H = "2h", "Every 2 hours"
        EVERY_4H = "4h", "Every 4 hours"
        EVERY_6H = "6h", "Every 6 hours"
        EVERY_12H = "12h", "Every 12 hours"
        DAILY = "24h", "Once per day"

    FREQUENCY_HOURS = {
        CheckFrequency.HOURLY: 1,
        CheckFrequency.EVERY_2H: 2,
        CheckFrequency.EVERY_4H: 4,
        CheckFrequency.EVERY_6H: 6,
        CheckFrequency.EVERY_12H: 12,
        CheckFrequency.DAILY: 24,
    }

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tender_definitions_created",
    )
    default_investor = models.ForeignKey(
        "Company",
        on_delete=models.PROTECT,
        related_name="tender_definitions",
        help_text="Investor company assigned to automatically imported tenders.",
    )
    check_frequency = models.CharField(
        max_length=8,
        choices=CheckFrequency.choices,
        default=CheckFrequency.EVERY_6H,
        db_index=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    last_checked = models.DateTimeField(null=True, blank=True)
    last_successful_check = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self) -> str:
        return self.name

    @property
    def check_interval_hours(self) -> int:
        return self.FREQUENCY_HOURS.get(self.check_frequency, 6)


class ProcurementSource(models.Model):
    """External procurement feed attached to a tender definition."""

    class SourceType(models.TextChoices):
        API = "api", "API"
        XML = "xml", "XML"
        CSV = "csv", "CSV"
        WEB = "web", "Web scraping (future)"

    tender_definition = models.ForeignKey(
        TenderDefinition,
        on_delete=models.CASCADE,
        related_name="sources",
    )
    name = models.CharField(max_length=255)
    api_url = models.URLField(max_length=2048, help_text="Endpoint URL for this source.")
    source_type = models.CharField(
        max_length=16,
        choices=SourceType.choices,
        default=SourceType.API,
        db_index=True,
    )
    enabled = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_source_type_display()})"


class TenderKeyword(models.Model):
    """Keyword used to match incoming public procurements."""

    tender_definition = models.ForeignKey(
        TenderDefinition,
        on_delete=models.CASCADE,
        related_name="keywords",
    )
    keyword = models.CharField(max_length=128, db_index=True)

    class Meta:
        ordering = ["keyword", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["tender_definition", "keyword"],
                name="unique_keyword_per_definition",
            ),
        ]

    def __str__(self) -> str:
        return self.keyword


class TenderDefinitionExecutionLog(models.Model):
    """History of an import run for a tender definition."""

    class Status(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        NO_NEW_RESULTS = "no_new_results", "No new results"

    tender_definition = models.ForeignKey(
        TenderDefinition,
        on_delete=models.CASCADE,
        related_name="execution_logs",
    )
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUCCESS,
        db_index=True,
    )
    processed_count = models.PositiveIntegerField(default=0)
    received_count = models.PositiveIntegerField(default=0)
    matched_count = models.PositiveIntegerField(default=0)
    duplicate_count = models.PositiveIntegerField(default=0)
    imported_count = models.PositiveIntegerField(default=0)
    skipped_count = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at", "-id"]

    def __str__(self) -> str:
        return f"{self.tender_definition.name} @ {self.started_at} ({self.status})"


class TenderImportRecord(models.Model):
    """Links an auto-imported tender back to its definition and external identity."""

    tender_definition = models.ForeignKey(
        TenderDefinition,
        on_delete=models.CASCADE,
        related_name="import_records",
    )
    tender = models.OneToOneField(
        "Tender",
        on_delete=models.CASCADE,
        related_name="import_record",
    )
    external_id = models.CharField(max_length=255, blank=True, db_index=True)
    reference_number = models.CharField(max_length=255, blank=True, db_index=True)
    source_url = models.URLField(max_length=2048, blank=True)
    source_name = models.CharField(max_length=255, blank=True)
    imported_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["tender_definition", "external_id"]),
            models.Index(fields=["tender_definition", "reference_number"]),
        ]


class TenderNotification(models.Model):
    """In-app notification for tender staff (import events, etc.)."""

    user = models.ForeignKey(
        "core.User",
        on_delete=models.CASCADE,
        related_name="tender_notifications",
    )
    tender = models.ForeignKey(
        "Tender",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=512, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return self.title
