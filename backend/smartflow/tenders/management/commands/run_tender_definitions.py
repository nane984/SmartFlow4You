from django.core.management.base import BaseCommand

from tenders.services.tender_import import run_due_tender_definitions, run_tender_definition
from tenders.definition_models import TenderDefinition


class Command(BaseCommand):
    help = "Run due tender definitions (or a specific definition by id)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--definition-id",
            type=int,
            help="Run a single tender definition by id (ignores schedule).",
        )
        parser.add_argument(
            "--all-active",
            action="store_true",
            help="Run all active definitions regardless of schedule.",
        )

    def handle(self, *args, **options):
        definition_id = options.get("definition_id")
        all_active = options.get("all_active")

        if definition_id:
            definition = TenderDefinition.objects.get(pk=definition_id)
            log = run_tender_definition(definition)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Ran '{definition.name}': {log.status} "
                    f"(processed={log.processed_count}, imported={log.imported_count})"
                )
            )
            return

        if all_active:
            logs = []
            for definition in TenderDefinition.objects.filter(is_active=True):
                logs.append(run_tender_definition(definition))
            self.stdout.write(self.style.SUCCESS(f"Ran {len(logs)} definition(s)."))
            return

        logs = run_due_tender_definitions()
        self.stdout.write(self.style.SUCCESS(f"Ran {len(logs)} due definition(s)."))
