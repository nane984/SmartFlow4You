/** HR domain — job postings & applications */

export const JOB_POSTING_STATUSES = ["draft", "published", "closed"] as const;
export type JobPostingStatus = (typeof JOB_POSTING_STATUSES)[number];

export const JOB_POSTING_STATUS_LABELS: Record<JobPostingStatus, string> = {
    draft: "Draft",
    published: "Published",
    closed: "Closed",
};

export const JOB_DEPARTMENTS = ["hr", "engineering", "operations", "procurement", "other"] as const;
export type JobDepartment = (typeof JOB_DEPARTMENTS)[number];

export const JOB_DEPARTMENT_LABELS: Record<JobDepartment, string> = {
    hr: "HR",
    engineering: "Engineering",
    operations: "Operations",
    procurement: "Procurement",
    other: "Other",
};

export const APPLICATION_STATUSES = [
    "submitted",
    "reviewed",
    "interview",
    "rejected",
    "accepted",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    submitted: "Submitted",
    reviewed: "Reviewed",
    interview: "Interview",
    rejected: "Rejected",
    accepted: "Accepted",
};

export const APPLICATION_STATUS_BADGE_CLASS: Record<ApplicationStatus, string> = {
    submitted: "bg-blue-100 text-blue-900 ring-blue-200",
    reviewed: "bg-orange-100 text-orange-950 ring-orange-200",
    interview: "bg-violet-100 text-violet-900 ring-violet-200",
    rejected: "bg-red-100 text-red-900 ring-red-200",
    accepted: "bg-emerald-100 text-emerald-900 ring-emerald-200",
};
