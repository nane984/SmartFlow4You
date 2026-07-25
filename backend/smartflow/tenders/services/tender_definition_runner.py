"""Orchestrates tender definition runs and dry-run tests."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone

from ..definition_models import TenderDefinition, TenderDefinitionExecutionLog
from .duplicate_detection import DuplicateDetectionService
from .procurement_fetcher import ProcurementFetcherService
from .tender_import_service import TenderImportService
from .tender_matching import TenderMatchingService

logger = logging.getLogger(__name__)


@dataclass
class RunStats:
    received_count: int = 0
    matched_count: int = 0
    duplicate_count: int = 0
    imported_count: int = 0
    ignored_count: int = 0
    errors: list[str] = field(default_factory=list)

    @property
    def new_import_count(self) -> int:
        return self.imported_count

    def to_dict(self, definition_name: str = "") -> dict:
        return {
            "definition_name": definition_name,
            "received_count": self.received_count,
            "matched_count": self.matched_count,
            "duplicate_count": self.duplicate_count,
            "new_import_count": self.new_import_count,
            "imported_count": self.imported_count,
            "ignored_count": self.ignored_count,
            "errors": self.errors,
        }


class TenderDefinitionRunner:
    """Runs import or dry-run test for a tender definition."""

    def __init__(self) -> None:
        self.fetcher = ProcurementFetcherService()
        self.matcher = TenderMatchingService()
        self.deduplicator = DuplicateDetectionService()
        self.importer = TenderImportService()

    def test_definition(self, definition: TenderDefinition) -> RunStats:
        """Dry run — fetch, match, and count without creating tenders."""
        return self._execute(definition, dry_run=True, persist_log=False)

    @transaction.atomic
    def run_definition(self, definition: TenderDefinition) -> TenderDefinitionExecutionLog:
        """Full import run with execution log and notifications."""
        log = TenderDefinitionExecutionLog.objects.create(
            tender_definition=definition,
            status=TenderDefinitionExecutionLog.Status.NO_NEW_RESULTS,
        )
        stats = self._execute(definition, dry_run=False, persist_log=True)
        self._finalize_log(log, definition, stats)
        return log

    def _execute(
        self,
        definition: TenderDefinition,
        *,
        dry_run: bool,
        persist_log: bool,
    ) -> RunStats:
        stats = RunStats()
        keywords = list(definition.keywords.values_list("keyword", flat=True))
        batches, fetch_errors = self.fetcher.fetch_all_enabled(definition)
        stats.errors.extend(fetch_errors)

        now = timezone.now()
        if persist_log and not dry_run:
            definition.last_checked = now
            definition.save(update_fields=["last_checked"])

        imported_tenders = []

        for source, records in batches:
            stats.received_count += len(records)
            matching, ignored = self.matcher.filter_matching(records, keywords)
            stats.ignored_count += len(ignored)
            stats.matched_count += len(matching)

            new_records, duplicates = self.deduplicator.partition(
                definition, matching, source.name
            )
            stats.duplicate_count += len(duplicates)

            for record in new_records:
                if dry_run:
                    stats.imported_count += 1
                else:
                    tender = self.importer.create_tender(definition, record, source.name)
                    stats.imported_count += 1
                    imported_tenders.append(tender)

        if not dry_run and imported_tenders:
            definition.last_successful_check = now
            definition.save(update_fields=["last_successful_check"])
            self.importer.notify_imports(definition, imported_tenders)

        if stats.errors and stats.received_count == 0 and stats.imported_count == 0:
            stats.errors  # keep for finalize

        return stats

    def _finalize_log(
        self,
        log: TenderDefinitionExecutionLog,
        definition: TenderDefinition,
        stats: RunStats,
    ) -> None:
        if stats.errors and stats.received_count == 0 and stats.imported_count == 0:
            log.status = TenderDefinitionExecutionLog.Status.FAILED
            log.error_message = "; ".join(stats.errors)
        elif stats.imported_count > 0:
            log.status = TenderDefinitionExecutionLog.Status.SUCCESS
            if stats.errors:
                log.error_message = "; ".join(stats.errors)
        else:
            log.status = TenderDefinitionExecutionLog.Status.NO_NEW_RESULTS
            if stats.errors:
                log.error_message = "; ".join(stats.errors)

        log.received_count = stats.received_count
        log.matched_count = stats.matched_count
        log.duplicate_count = stats.duplicate_count
        log.processed_count = stats.received_count
        log.imported_count = stats.imported_count
        log.skipped_count = stats.ignored_count
        log.finished_at = timezone.now()
        log.save()


def definition_is_due(definition: TenderDefinition, now: datetime | None = None) -> bool:
    if not definition.is_active:
        return False
    now = now or timezone.now()
    if definition.last_checked is None:
        return True
    delta = timedelta(hours=definition.check_interval_hours)
    return definition.last_checked + delta <= now


def run_due_tender_definitions() -> list[TenderDefinitionExecutionLog]:
    runner = TenderDefinitionRunner()
    logs: list[TenderDefinitionExecutionLog] = []
    now = timezone.now()
    for definition in TenderDefinition.objects.filter(is_active=True).prefetch_related(
        "sources", "keywords"
    ):
        if definition_is_due(definition, now):
            logs.append(runner.run_definition(definition))
    return logs


def run_tender_definition(definition: TenderDefinition) -> TenderDefinitionExecutionLog:
    return TenderDefinitionRunner().run_definition(definition)


def test_tender_definition(definition: TenderDefinition) -> dict:
    stats = TenderDefinitionRunner().test_definition(definition)
    return stats.to_dict(definition.name)
