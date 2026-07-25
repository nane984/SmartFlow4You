"""Celery tasks for tender definition scheduling."""

from celery import shared_task

from .services.tender_import import run_due_tender_definitions, run_tender_definition


@shared_task(name="tenders.run_due_tender_definitions")
def run_due_tender_definitions_task() -> int:
    logs = run_due_tender_definitions()
    return len(logs)


@shared_task(name="tenders.run_tender_definition")
def run_tender_definition_task(definition_id: int) -> int:
    from .definition_models import TenderDefinition

    definition = TenderDefinition.objects.get(pk=definition_id)
    log = run_tender_definition(definition)
    return log.pk
