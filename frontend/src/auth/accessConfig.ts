import type { AppRole } from "./roles";
import { ROLES } from "./roles";

/**
 * Logical access domains — map routes to allowed roles.
 * Replace checks with server-side permissions when auth is enforced.
 */
export const ACCESS_DOMAINS = {
    /** Procurement: tenders, companies, work packages, submissions */
    TENDERS: "tenders",
    /** HR job management and dashboards */
    HR: "hr",
    /** Public candidate portal (no role required) */
    CANDIDATE_PUBLIC: "candidate_public",
    /** Any authenticated internal user */
    AUTHENTICATED: "authenticated",
} as const;

export type AccessDomain = (typeof ACCESS_DOMAINS)[keyof typeof ACCESS_DOMAINS];

/** Roles allowed per domain */
export const DOMAIN_ROLES: Record<Exclude<AccessDomain, "candidate_public">, AppRole[]> = {
    [ACCESS_DOMAINS.TENDERS]: [ROLES.ADMIN, ROLES.INVESTOR],
    [ACCESS_DOMAINS.HR]: [ROLES.ADMIN, ROLES.HR, ROLES.INTERVIEWER],
    [ACCESS_DOMAINS.AUTHENTICATED]: [
        ROLES.ADMIN,
        ROLES.INVESTOR,
        ROLES.HR,
        ROLES.CANDIDATE,
        ROLES.INTERVIEWER,
    ],
};

/** Route prefixes for documentation and future guards */
export const ROUTE_ACCESS = {
    home: { path: "/", public: true },
    tenders: { path: "/tenders", domain: ACCESS_DOMAINS.TENDERS },
    workPackages: { path: "/work-packages", domain: ACCESS_DOMAINS.TENDERS },
    submissions: { path: "/submissions", domain: ACCESS_DOMAINS.TENDERS },
    companies: { path: "/companies", domain: ACCESS_DOMAINS.TENDERS },
    hrJobs: { path: "/hr/jobs", domain: ACCESS_DOMAINS.HR },
    candidatePortal: { path: "/candidate", public: true },
} as const;
