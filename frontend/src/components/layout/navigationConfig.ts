import type { AppRole } from "../../auth/roles";
import {
    HR_INTERVIEWER_ROLES,
    HR_STAFF_ROLES,
    PROCUREMENT_STAFF_ROLES,
    PROCUREMENT_SUPPLIER_ROLES,
    ROLES,
    roleInList,
} from "../../auth/roles";

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
    ROLES.TENDER_USER,
    ROLES.INVESTOR,
    ROLES.SUPPLIER,
    ROLES.HR_ADMIN,
    ROLES.HR,
    ROLES.CANDIDATE,
    ROLES.INTERVIEWER,
];

/**
 * Grouped navigation — visibility filtered by {@link getNavSectionsForRole}.
 */
export const NAV_SECTIONS: NavSection[] = [
    {
        id: "general",
        label: "General",
        roles: ALL_INTERNAL,
        items: [
            { to: "/dashboard", label: "Dashboard", roles: ALL_INTERNAL },
        ],
    },
    {
        id: "procurement",
        label: "Procurement",
        roles: [...PROCUREMENT_STAFF_ROLES, ...PROCUREMENT_SUPPLIER_ROLES],
        items: [
            {
                to: "/tenders",
                label: "Tenders",
                roles: [...PROCUREMENT_STAFF_ROLES, ...PROCUREMENT_SUPPLIER_ROLES],
            },
            {
                to: "/work-packages",
                label: "Work packages",
                roles: PROCUREMENT_STAFF_ROLES,
            },
            {
                to: "/submissions",
                label: "Submissions",
                roles: PROCUREMENT_STAFF_ROLES,
            },
            {
                to: "/companies",
                label: "Companies",
                roles: PROCUREMENT_STAFF_ROLES,
            },
            {
                to: "/offers",
                label: "Offers",
                roles: PROCUREMENT_STAFF_ROLES,
            },
            {
                to: "/offers",
                label: "My offers",
                roles: PROCUREMENT_SUPPLIER_ROLES,
            },
        ],
    },
    {
        id: "hr",
        label: "HR",
        roles: [...HR_STAFF_ROLES, ROLES.INTERVIEWER],
        items: [
            { to: "/hr/jobs", label: "HR jobs", roles: HR_STAFF_ROLES },
            {
                to: "/interviewer-dashboard",
                label: "Interviewer",
                roles: HR_INTERVIEWER_ROLES,
            },
        ],
    },
    {
        id: "candidate",
        label: "Candidate portal",
        roles: [ROLES.ADMIN, ROLES.CANDIDATE],
        items: [
            { to: "/candidate", label: "Candidate home", roles: [ROLES.CANDIDATE, ROLES.ADMIN] },
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
        items: [
            { to: "/admin/supplier-requests", label: "Supplier compliance", roles: [ROLES.ADMIN] },
            { to: "/admin/users", label: "User management", roles: [ROLES.ADMIN] },
        ],
    },
];

const PUBLIC_CANDIDATE_ITEMS: NavLinkItem[] = [
    { to: "/candidate", label: "My profile", roles: [] },
    { to: "/candidate/jobs", label: "Browse jobs", roles: [] },
];

/** Sections and items visible for the current role. */
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
        if (!section.roles.some((r) => roleInList(role, [r]))) return null;
        const items = section.items.filter((item) => roleInList(role, item.roles));
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
