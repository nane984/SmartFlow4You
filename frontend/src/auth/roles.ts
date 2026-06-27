/**
 * Application roles — aligned with backend RBAC (core/roles.py).
 *
 * Canonical roles are returned by GET /api/me/. Legacy slugs (investor, hr)
 * are still accepted from mock sessions and older rows.
 */
export const ROLES = {
    ADMIN: "admin",
    TENDER: "tender",
    TENDER_USER: "tender_user",
    SUPPLIER: "supplier",
    HR_ADMIN: "hr_admin",
    CANDIDATE: "candidate",
    DESIGNER: "designer",
    /** @deprecated demo alias — maps to tender_user */
    INVESTOR: "investor",
    /** @deprecated legacy — maps to hr_admin */
    HR: "hr",
    /** Legacy interviewer workflows */
    INTERVIEWER: "interviewer",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/** Roles stored canonically on the backend User model */
export type CanonicalRole =
    | typeof ROLES.ADMIN
    | typeof ROLES.TENDER
    | typeof ROLES.TENDER_USER
    | typeof ROLES.SUPPLIER
    | typeof ROLES.HR_ADMIN
    | typeof ROLES.CANDIDATE
    | typeof ROLES.DESIGNER;

const ALL_ROLES: AppRole[] = Object.values(ROLES);

const ROLE_ALIASES: Record<string, AppRole> = {
    investor: ROLES.TENDER_USER,
    hr: ROLES.HR_ADMIN,
};

/** Human-readable labels for UI (canonical + legacy keys). */
export const ROLE_LABELS: Record<string, string> = {
    admin: "Administrator",
    tender: "Tender",
    tender_user: "Tender user",
    supplier: "Supplier",
    hr_admin: "HR Admin",
    candidate: "Candidate",
    designer: "Designer",
    interviewer: "Interviewer",
    investor: "Tender user",
    hr: "HR Admin",
};

export function normalizeRole(raw: string | null | undefined): AppRole | null {
    if (!raw || typeof raw !== "string") return null;
    const value = raw.trim().toLowerCase();
    if (!value) return null;
    const mapped = (ROLE_ALIASES[value] ?? value) as AppRole;
    if (ALL_ROLES.includes(mapped)) return mapped;
    if (value === ROLES.INTERVIEWER) return ROLES.INTERVIEWER;
    return null;
}

export function roleLabel(raw: string | null | undefined): string {
    const normalized = normalizeRole(raw);
    if (normalized && ROLE_LABELS[normalized]) return ROLE_LABELS[normalized];
    if (raw && ROLE_LABELS[raw]) return ROLE_LABELS[raw];
    return raw?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Guest";
}

/** True when user's role matches any allowed entry (aliases respected). */
export function roleInList(userRole: AppRole | null, allowed: AppRole[]): boolean {
    if (!userRole) return false;
    const normalized = normalizeRole(userRole);
    return allowed.some((entry) => {
        const allowedNorm = normalizeRole(entry);
        return entry === userRole || allowedNorm === normalized;
    });
}

export const PROCUREMENT_STAFF_ROLES: AppRole[] = [
    ROLES.ADMIN,
    ROLES.TENDER,
    ROLES.TENDER_USER,
    ROLES.INVESTOR,
];

export const PROCUREMENT_SUPPLIER_ROLES: AppRole[] = [ROLES.SUPPLIER];

export const PROCUREMENT_ROLES: AppRole[] = [
    ...PROCUREMENT_STAFF_ROLES,
    ...PROCUREMENT_SUPPLIER_ROLES,
];

export const HR_STAFF_ROLES: AppRole[] = [ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR];

export const HR_INTERVIEWER_ROLES: AppRole[] = [ROLES.ADMIN, ROLES.INTERVIEWER];

export const DESIGN_STAFF_ROLES: AppRole[] = [ROLES.ADMIN, ROLES.DESIGNER];
