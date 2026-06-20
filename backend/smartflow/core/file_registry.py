"""
Unified document / file kinds across procurement and HR modules.
Upload paths remain on each model's FileField; this registry documents intent for APIs and UI.
"""

from enum import Enum


class DocumentKind(str, Enum):
    TENDER_DOCUMENT = "tender_document"
    TENDER_PRIMARY = "tender_primary"
    WORK_PACKAGE_TEMPLATE = "work_package_template"
    SUBMISSION_EXCEL = "submission_excel"
    JOB_APPLICATION_CV = "job_application_cv"
    INTERVIEW_VIDEO = "interview_video"


DOCUMENT_KIND_LABELS = {
    DocumentKind.TENDER_DOCUMENT: "Tender attachment",
    DocumentKind.TENDER_PRIMARY: "Tender document",
    DocumentKind.WORK_PACKAGE_TEMPLATE: "Work package Excel template",
    DocumentKind.SUBMISSION_EXCEL: "Subcontractor submission (Excel)",
    DocumentKind.JOB_APPLICATION_CV: "Job application CV",
    DocumentKind.INTERVIEW_VIDEO: "Interview recording",
}

ALLOWED_EXTENSIONS = {
    DocumentKind.WORK_PACKAGE_TEMPLATE: {".xls", ".xlsx"},
    DocumentKind.SUBMISSION_EXCEL: {".xls", ".xlsx"},
    DocumentKind.JOB_APPLICATION_CV: {".pdf", ".doc", ".docx"},
    DocumentKind.TENDER_PRIMARY: {".pdf", ".doc", ".docx", ".xls", ".xlsx"},
}
