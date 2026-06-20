/**
 * Application roles — extend when the backend auth layer is wired.
 *
 * - ADMIN: full platform access
 * - INVESTOR: procurement / tender users (tender module)
 * - HR: job postings and applicants
 * - CANDIDATE: job seekers (public portal + optional login)
 * - INTERVIEWER: interview workflows (existing HR module)
 */
export const ROLES = {
    ADMIN: "admin",
    INVESTOR: "investor",
    HR: "hr",
    CANDIDATE: "candidate",
    INTERVIEWER: "interviewer",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/** Human-readable labels for UI */
export const ROLE_LABELS: Record<AppRole, string> = {
    admin: "Administrator",
    investor: "Investor / Tender user",
    hr: "HR user",
    candidate: "Candidate",
    interviewer: "Interviewer",
};
