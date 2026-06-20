/**
 * Unified document kinds — mirrors backend `core.file_registry.DocumentKind`.
 */
export const DOCUMENT_KINDS = {
    TENDER_DOCUMENT: "tender_document",
    TENDER_PRIMARY: "tender_primary",
    WORK_PACKAGE_TEMPLATE: "work_package_template",
    SUBMISSION_EXCEL: "submission_excel",
    JOB_APPLICATION_CV: "job_application_cv",
    INTERVIEW_VIDEO: "interview_video",
} as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[keyof typeof DOCUMENT_KINDS];

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
    tender_document: "Tender attachment",
    tender_primary: "Tender document",
    work_package_template: "Work package Excel template",
    submission_excel: "Subcontractor submission (Excel)",
    job_application_cv: "Job application CV",
    interview_video: "Interview recording",
};
