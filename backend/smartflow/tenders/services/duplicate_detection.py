"""Duplicate detection for public procurement imports."""

from __future__ import annotations

from ..definition_models import TenderDefinition, TenderImportRecord
from ..models import Tender
from .procurement_types import RawProcurement


class DuplicateDetectionService:
    """Prevents importing the same procurement more than once."""

    def is_duplicate(
        self,
        definition: TenderDefinition,
        record: RawProcurement,
        source_name: str,
    ) -> bool:
        if record.external_id:
            if TenderImportRecord.objects.filter(
                tender_definition=definition,
                external_id=record.external_id,
            ).exists():
                return True
            if Tender.objects.filter(
                tender_definition=definition,
                external_id=record.external_id,
            ).exists():
                return True

        if record.reference_number:
            if TenderImportRecord.objects.filter(
                tender_definition=definition,
                reference_number=record.reference_number,
            ).exists():
                return True
            if Tender.objects.filter(
                tender_definition=definition,
                external_id=record.reference_number,
            ).exists():
                return True

        if record.source_url:
            if TenderImportRecord.objects.filter(
                tender_definition=definition,
                source_url=record.source_url,
            ).exists():
                return True
            if Tender.objects.filter(source_url=record.source_url).exists():
                return True

        if record.title:
            if TenderImportRecord.objects.filter(
                tender_definition=definition,
                source_name=source_name,
                tender__title=record.title,
            ).exists():
                return True

        return False

    def partition(
        self,
        definition: TenderDefinition,
        records: list[RawProcurement],
        source_name: str,
    ) -> tuple[list[RawProcurement], list[RawProcurement]]:
        """Returns (new_records, duplicate_records)."""
        new_records: list[RawProcurement] = []
        duplicates: list[RawProcurement] = []
        for record in records:
            if self.is_duplicate(definition, record, source_name):
                duplicates.append(record)
            else:
                new_records.append(record)
        return new_records, duplicates
