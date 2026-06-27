import type { ReactNode } from "react";
import type { AppRole } from "../../auth/roles";
import {
    DESIGN_STAFF_ROLES,
    HR_INTERVIEWER_ROLES,
    HR_STAFF_ROLES,
    PROCUREMENT_ROLES,
    PROCUREMENT_STAFF_ROLES,
    PROCUREMENT_SUPPLIER_ROLES,
    ROLES,
} from "../../auth/roles";

export type DashboardModule = {
    id: string;
    to: string;
    title: string;
    description: string;
    accent: string;
    icon: ReactNode;
    roles: AppRole[];
};

export const DASHBOARD_MODULES: DashboardModule[] = [
    {
        id: "tenders",
        to: "/tenders",
        title: "Tenders",
        description: "Browse and manage procurement opportunities, documents, and tender lifecycle.",
        accent: "from-sky-500/10 to-cyan-500/5 ring-sky-200/60",
        roles: PROCUREMENT_ROLES,
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        ),
    },
    {
        id: "work-packages",
        to: "/work-packages",
        title: "Work packages",
        description: "Organize subcontractor scopes, templates, and package-level tracking.",
        accent: "from-indigo-500/10 to-blue-500/5 ring-indigo-200/60",
        roles: PROCUREMENT_STAFF_ROLES,
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
            </svg>
        ),
    },
    {
        id: "submissions",
        to: "/submissions",
        title: "Submissions",
        description: "Review subcontractor file uploads, prices, and submission status.",
        accent: "from-violet-500/10 to-purple-500/5 ring-violet-200/60",
        roles: PROCUREMENT_STAFF_ROLES,
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
            </svg>
        ),
    },
    {
        id: "companies",
        to: "/companies",
        title: "Companies",
        description: "Investor, contractor, and supplier profiles in one directory.",
        accent: "from-teal-500/10 to-emerald-500/5 ring-teal-200/60",
        roles: PROCUREMENT_STAFF_ROLES,
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
            </svg>
        ),
    },
    {
        id: "offers",
        to: "/offers",
        title: "Offers",
        description: "Track supplier bids, RFQs, and offer documents across tenders.",
        accent: "from-amber-500/10 to-orange-500/5 ring-amber-200/60",
        roles: PROCUREMENT_STAFF_ROLES,
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
    },
    {
        id: "my-offers",
        to: "/offers",
        title: "My offers",
        description: "Submit and review your company's bids on assigned tenders.",
        accent: "from-amber-500/10 to-orange-500/5 ring-amber-200/60",
        roles: PROCUREMENT_SUPPLIER_ROLES,
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
            </svg>
        ),
    },
    {
        id: "hr-jobs",
        to: "/hr/jobs",
        title: "HR & recruitment",
        description: "Publish job postings, manage applicants, and run interview workflows.",
        accent: "from-violet-500/10 to-purple-500/5 ring-violet-200/60",
        roles: [...HR_STAFF_ROLES, ROLES.INTERVIEWER],
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
            </svg>
        ),
    },
    {
        id: "candidate",
        to: "/candidate/jobs",
        title: "Candidate portal",
        description: "Browse open roles and manage your profile and applications.",
        accent: "from-emerald-500/10 to-teal-500/5 ring-emerald-200/60",
        roles: [ROLES.CANDIDATE, ROLES.ADMIN],
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
            </svg>
        ),
    },
    {
        id: "supplier-compliance",
        to: "/admin/supplier-requests",
        title: "Supplier compliance",
        description: "Review pending supplier registration requests and approve or reject them.",
        accent: "from-orange-500/10 to-amber-500/5 ring-orange-200/60",
        roles: [ROLES.ADMIN],
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
            </svg>
        ),
    },
    {
        id: "user-management",
        to: "/admin/users",
        title: "User management",
        description: "Create users, assign roles, edit accounts, and monitor last login.",
        accent: "from-blue-500/10 to-indigo-500/5 ring-blue-200/60",
        roles: [ROLES.ADMIN],
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>
        ),
    },
    {
        id: "interior-design",
        to: "/interior",
        title: "Design studio",
        description: "CAD floor plans, furniture layout, 3D walkthrough, and AI space planning.",
        accent: "from-fuchsia-500/10 to-pink-500/5 ring-fuchsia-200/60",
        roles: DESIGN_STAFF_ROLES,
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
            </svg>
        ),
    },
    {
        id: "time-tracking",
        to: "/time-tracking",
        title: "Time tracking",
        description: "Log hours and generate productivity reports across teams.",
        accent: "from-emerald-500/10 to-teal-500/5 ring-emerald-200/60",
        roles: [ROLES.ADMIN, ROLES.TENDER_USER, ROLES.INVESTOR, ROLES.HR_ADMIN, ROLES.HR],
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
    },
];

export type RoleShortcut = {
    to: string;
    label: string;
    roles: AppRole[];
};

export const ROLE_SHORTCUTS: RoleShortcut[] = [
    {
        to: "/interviewer-dashboard",
        label: "Interviewer panel",
        roles: HR_INTERVIEWER_ROLES,
    },
    { to: "/candidate-dashboard", label: "My applications", roles: [ROLES.CANDIDATE, ROLES.ADMIN] },
    { to: "/candidate/interviews", label: "My interviews", roles: [ROLES.CANDIDATE, ROLES.ADMIN] },
    { to: "/interior", label: "Design studio", roles: DESIGN_STAFF_ROLES },
    { to: "/interior/catalog", label: "Furniture catalog", roles: DESIGN_STAFF_ROLES },
    { to: "/interior/electrical-catalog", label: "Electrical catalog", roles: DESIGN_STAFF_ROLES },
    { to: "/interior/structure-catalog", label: "Structure catalog", roles: DESIGN_STAFF_ROLES },
];
