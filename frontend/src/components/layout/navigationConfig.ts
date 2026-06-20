import type { AppRole } from "../../auth/roles";
import { ROLES } from "../../auth/roles";

export type NavLinkItem = {
    to: string;
    label: string;
    /** Exact match for active state (e.g. Home) */
    end?: boolean;
    roles: AppRole[];
};

export type NavSection = {
    id: string;
    label: string;
    /** Roles that can see this section in the navbar */
    roles: AppRole[];
    items: NavLinkItem[];
};

const ALL_INTERNAL: AppRole[] = [
    ROLES.ADMIN,
    ROLES.INVESTOR,
    ROLES.HR,
    ROLES.CANDIDATE,
    ROLES.INTERVIEWER,
];

/**
 * Grouped navigation — add new modules by appending sections or items.
 * Visibility is filtered client-side by {@link getNavSectionsForRole}.
 */
export const NAV_SECTIONS: NavSection[] = [
    {
        id: "general",
        label: "General",
        roles: ALL_INTERNAL,
        items: [
            { to: "/", label: "Home", end: true, roles: ALL_INTERNAL },
            { to: "/dashboard", label: "Dashboard", roles: ALL_INTERNAL },
        ],
    },
    {
        id: "procurement",
        label: "Procurement",
        roles: [ROLES.ADMIN, ROLES.INVESTOR],
        items: [
            { to: "/tenders", label: "Tenders", roles: [ROLES.ADMIN, ROLES.INVESTOR] },
            { to: "/work-packages", label: "Work packages", roles: [ROLES.ADMIN, ROLES.INVESTOR] },
            { to: "/submissions", label: "Submissions", roles: [ROLES.ADMIN, ROLES.INVESTOR] },
            { to: "/companies", label: "Companies", roles: [ROLES.ADMIN, ROLES.INVESTOR] },
            { to: "/offers", label: "Offers", roles: [ROLES.ADMIN, ROLES.INVESTOR] },
        ],
    },
    {
        id: "hr",
        label: "HR",
        roles: [ROLES.ADMIN, ROLES.HR, ROLES.INTERVIEWER],
        items: [
            { to: "/hr-dashboard", label: "HR dashboard", roles: [ROLES.ADMIN, ROLES.HR] },
            { to: "/hr/jobs", label: "HR jobs", roles: [ROLES.ADMIN, ROLES.HR] },
            { to: "/interviewer-dashboard", label: "Interviewer", roles: [ROLES.ADMIN, ROLES.INTERVIEWER] },
        ],
    },
    {
        id: "candidate",
        label: "Candidate portal",
        roles: [ROLES.ADMIN, ROLES.CANDIDATE],
        items: [
            { to: "/candidate", label: "My profile", roles: [ROLES.CANDIDATE, ROLES.ADMIN] },
            { to: "/candidate/jobs", label: "Browse jobs", roles: [ROLES.CANDIDATE, ROLES.ADMIN] },
            {
                to: "/candidate-dashboard",
                label: "My applications",
                roles: [ROLES.CANDIDATE, ROLES.ADMIN],
            },
        ],
    },
    {
        id: "admin",
        label: "Admin",
        roles: [ROLES.ADMIN],
        items: [{ to: "/admin-dashboard", label: "Admin dashboard", roles: [ROLES.ADMIN] }],
    },
];

const PUBLIC_CANDIDATE_ITEMS: NavLinkItem[] = [
    { to: "/candidate", label: "My profile", roles: [] },
    { to: "/candidate/jobs", label: "Browse jobs", roles: [] },
];

/** Sections and items visible for the current role (mock / placeholder until server-driven nav). */
export function getNavSectionsForRole(role: AppRole | null): NavSection[] {
    if (!role) {
        return [
            {
                id: "general",
                label: "General",
                roles: [],
                items: [{ to: "/", label: "Home", end: true, roles: [] }],
            },
            {
                id: "candidate",
                label: "Candidate portal",
                roles: [],
                items: PUBLIC_CANDIDATE_ITEMS,
            },
        ];
    }

    return NAV_SECTIONS.map((section) => {
        if (!section.roles.includes(role)) return null;
        const items = section.items.filter((item) => item.roles.includes(role));
        if (items.length === 0) return null;
        return { ...section, items };
    }).filter((s): s is NavSection => s !== null);
}

/** Match active path for dropdown highlight */
export function isNavItemActive(pathname: string, item: NavLinkItem): boolean {
    if (item.end) {
        return pathname === item.to;
    }
    if (item.to === "/") {
        return pathname === "/";
    }
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function isSectionActive(pathname: string, section: NavSection): boolean {
    return section.items.some((item) => isNavItemActive(pathname, item));
}
