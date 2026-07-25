"""Fetch and import public procurements for Tender Definitions.

Legacy module — re-exports from modular services for backward compatibility.
"""

from .tender_definition_runner import (
    definition_is_due,
    run_due_tender_definitions,
    run_tender_definition,
    test_tender_definition,
)
from .tender_import_service import SYSTEM_IMPORT_NOTE, TenderImportService
from .procurement_types import RawProcurement

__all__ = [
    "RawProcurement",
    "SYSTEM_IMPORT_NOTE",
    "TenderImportService",
    "definition_is_due",
    "run_due_tender_definitions",
    "run_tender_definition",
    "test_tender_definition",
]
