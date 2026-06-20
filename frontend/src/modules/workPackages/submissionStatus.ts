export const SUBMISSION_STATUSES = [
    "submitted",
    "reviewed",
    "accepted",
    "rejected",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
    submitted: "Submitted",
    reviewed: "Reviewed",
    accepted: "Accepted",
    rejected: "Rejected",
};

export const SUBMISSION_STATUS_BADGE_CLASS: Record<SubmissionStatus, string> = {
    submitted: "bg-blue-100 text-blue-900 ring-blue-200",
    reviewed: "bg-orange-100 text-orange-950 ring-orange-200",
    accepted: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    rejected: "bg-red-100 text-red-900 ring-red-200",
};

export function isSubmissionStatus(value: string): value is SubmissionStatus {
    return (SUBMISSION_STATUSES as readonly string[]).includes(value);
}

export function normalizeSubmissionStatus(raw: string | undefined | null): SubmissionStatus | null {
    if (!raw) return null;
    const v = raw.toLowerCase().trim();
    return isSubmissionStatus(v) ? v : null;
}
