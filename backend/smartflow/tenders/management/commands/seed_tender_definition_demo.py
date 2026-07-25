"""Seed a demo Tender Definition for automated procurement discovery."""

from django.core.management.base import BaseCommand
from django.db import transaction

from tenders.definition_models import ProcurementSource, TenderDefinition, TenderKeyword
from tenders.models import Company


DEMO_NAME = "Construction Electrical Projects"
DEMO_KEYWORDS = ["electrical", "installation", "lighting", "power"]
MOCK_SOURCE_NAME = "Mock Procurement API"
MOCK_SOURCE_PATH = "/api/mock/procurements/"


class Command(BaseCommand):
    help = "Create or update the Construction Electrical Projects demo tender definition."

    def add_arguments(self, parser):
        parser.add_argument(
            "--base-url",
            default="http://127.0.0.1:8000",
            help="Base URL for the mock procurement API (default: http://127.0.0.1:8000)",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        base_url = str(options["base_url"]).rstrip("/")
        mock_url = f"{base_url}{MOCK_SOURCE_PATH}"

        investor = Company.objects.filter(company_type=Company.CompanyType.INVESTOR).first()
        if not investor:
            self.stderr.write(self.style.ERROR("No investor company found. Create one first."))
            return

        definition, created = TenderDefinition.objects.get_or_create(
            name=DEMO_NAME,
            defaults={
                "description": (
                    "Demo definition — discovers electrical and installation procurements "
                    "from the mock public procurement API."
                ),
                "default_investor": investor,
                "check_frequency": TenderDefinition.CheckFrequency.EVERY_4H,
                "is_active": True,
            },
        )
        if not created:
            definition.description = (
                "Demo definition — discovers electrical and installation procurements "
                "from the mock public procurement API."
            )
            definition.default_investor = investor
            definition.check_frequency = TenderDefinition.CheckFrequency.EVERY_4H
            definition.is_active = True
            definition.save()

        definition.keywords.all().delete()
        for kw in DEMO_KEYWORDS:
            TenderKeyword.objects.create(tender_definition=definition, keyword=kw)

        definition.sources.all().delete()
        ProcurementSource.objects.create(
            tender_definition=definition,
            name=MOCK_SOURCE_NAME,
            api_url=mock_url,
            source_type=ProcurementSource.SourceType.API,
            enabled=True,
        )

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} demo definition #{definition.pk} “{DEMO_NAME}” "
                f"with source {mock_url}"
            )
        )
        self.stdout.write(
            "Keywords: " + ", ".join(DEMO_KEYWORDS) + " · Frequency: Every 4 hours"
        )
        self.stdout.write(
            "Run test: POST /api/tender-definitions/{id}/run_test/ · "
            "Import: POST /api/tender-definitions/{id}/run/"
        )
