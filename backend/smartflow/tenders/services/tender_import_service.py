"""Creates Tender records from matched public procurements."""

from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from core.models import User
from core.roles import TENDER_DEFINITION_ROLES

from ..definition_models import TenderDefinition, TenderImportRecord, TenderNotification
from ..models import Tender
from .procurement_types import RawProcurement

SYSTEM_IMPORT_NOTE = "Created by: System — Tender Definition"


class TenderImportService:
    """Maps procurements to Tender model instances and sends notifications."""

    def create_tender(
        self,
        definition: TenderDefinition,
        record: RawProcurement,
        source_name: str,
    ) -> Tender:
        notes_parts = [
            SYSTEM_IMPORT_NOTE,
            f"Definition: {definition.name}",
            f"Source: {source_name}",
            "Import source: Tender Definition",
        ]
        if record.category:
            notes_parts.append(f"Category: {record.category}")

        tender = Tender.objects.create(
            title=record.title,
            description=record.description,
            investor=definition.default_investor,
            deadline=self._default_deadline(record),
            status=Tender.Status.DRAFT,
            source=Tender.InputSource.API,
            external_id=record.external_id or record.reference_number,
            source_url=record.source_url[:2048] if record.source_url else "",
            visibility=Tender.Visibility.PUBLIC,
            analysis_notes="\n".join(notes_parts),
            auto_imported=True,
            tender_definition=definition,
            publication_date=record.publication_date,
        )
        TenderImportRecord.objects.create(
            tender_definition=definition,
            tender=tender,
            external_id=record.external_id,
            reference_number=record.reference_number,
            source_url=record.source_url[:2048] if record.source_url else "",
            source_name=source_name,
        )
        return tender

    def notify_imports(self, definition: TenderDefinition, tenders: list[Tender]) -> None:
        if not tenders:
            return
        users = User.objects.filter(role__in=TENDER_DEFINITION_ROLES, is_active=True)
        notifications: list[TenderNotification] = []
        for tender in tenders:
            message = f'New public procurement imported: "{tender.title}"'
            link = f"/tenders/{tender.id}"
            for user in users:
                notifications.append(
                    TenderNotification(
                        user=user,
                        tender=tender,
                        title="New tender imported",
                        message=message,
                        link=link,
                    )
                )
        TenderNotification.objects.bulk_create(notifications)

    def _default_deadline(self, record: RawProcurement):
        if record.deadline:
            return record.deadline
        return timezone.now() + timedelta(days=30)
