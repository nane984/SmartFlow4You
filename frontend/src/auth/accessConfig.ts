import type { AppRole } from "./roles";
import {
    DESIGN_STAFF_ROLES,
    HR_STAFF_ROLES,
    PROCUREMENT_ROLES,
    ROLES,
} from "./roles";

/**
 * Logical access domains — map routes to allowed roles.
 * Mirrors backend permission groups (Step 3).
 */
export const ACCESS_DOMAINS = {
    /** Procurement: tenders, companies, work packages, submissions, offers */
    TENDERS: "tenders",
    /** HR job management and dashboards */
    HR: "hr",
    /** Interior design / CAD studio */
    INTERIOR_DESIGN: "interior_design",
    /** Public candidate portal (no role required) */
    CANDIDATE_PUBLIC: "candidate_public",
    /** Any authenticated internal user */
    AUTHENTICATED: "authenticated",
} as const;

export type AccessDomain = (typeof ACCESS_DOMAINS)[keyof typeof ACCESS_DOMAINS];

/** Roles allowed per domain */
export const DOMAIN_ROLES: Record<Exclude<AccessDomain, "candidate_public">, AppRole[]> = {
    [ACCESS_DOMAINS.TENDERS]: PROCUREMENT_ROLES,
    [ACCESS_DOMAINS.HR]: [...HR_STAFF_ROLES, ROLES.INTERVIEWER],
    [ACCESS_DOMAINS.INTERIOR_DESIGN]: DESIGN_STAFF_ROLES,
    [ACCESS_DOMAINS.AUTHENTICATED]: [
        ROLES.ADMIN,
        ROLES.TENDER,
        ROLES.TENDER_USER,
        ROLES.INVESTOR,
        ROLES.SUPPLIER,
        ROLES.HR_ADMIN,
        ROLES.HR,
        ROLES.CANDIDATE,
        ROLES.INTERVIEWER,
        ROLES.DESIGNER,
    ],
};

/** Route prefixes for documentation and guards */
export const ROUTE_ACCESS = {
    home: { path: "/", public: true },
    tenders: { path: "/tenders", domain: ACCESS_DOMAINS.TENDERS },
    workPackages: { path: "/work-packages", domain: ACCESS_DOMAINS.TENDERS },
    submissions: { path: "/submissions", domain: ACCESS_DOMAINS.TENDERS },
    companies: { path: "/companies", domain: ACCESS_DOMAINS.TENDERS },
    offers: { path: "/offers", domain: ACCESS_DOMAINS.TENDERS },
    hrJobs: { path: "/hr/jobs", domain: ACCESS_DOMAINS.HR },
    interiorDesign: { path: "/interior", domain: ACCESS_DOMAINS.INTERIOR_DESIGN },
    candidatePortal: { path: "/candidate", public: true },
} as const;
