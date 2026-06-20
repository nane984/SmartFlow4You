import type { ReactNode } from "react";

export type FeatureItem = {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
    accent: string;
};

export type HowItWorksStep = {
    step: number;
    title: string;
    description: string;
};

export const FEATURES: FeatureItem[] = [
    {
        id: "procurement",
        title: "Tender & Procurement Management",
        description:
            "Publish tenders, manage work packages, collect subcontractor submissions, and track offers — all in one structured workflow built for construction and services teams.",
        accent: "from-sky-500/10 to-cyan-500/5 ring-sky-200/60",
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
        id: "hr",
        title: "HR & Recruitment System",
        description:
            "Post jobs, accept candidate applications with CV uploads, schedule interviews, and review applicants — designed for HR teams and public career portals.",
        accent: "from-violet-500/10 to-purple-500/5 ring-violet-200/60",
        icon: (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
            </svg>
        ),
    },
    {
        id: "time",
        title: "Time Tracking & Reporting",
        description:
            "Log hours, monitor team productivity, and generate reports that connect project delivery with operational insight — ready for future AI-assisted analytics.",
        accent: "from-emerald-500/10 to-teal-500/5 ring-emerald-200/60",
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

export const HOW_IT_WORKS: HowItWorksStep[] = [
    {
        step: 1,
        title: "Collect data",
        description:
            "Upload tender documents, work package templates, CVs, and timesheets into a unified platform.",
    },
    {
        step: 2,
        title: "AI processes requests",
        description:
            "Structured workflows prepare your data for analysis — tender breakdowns, applicant screening, and report generation.",
    },
    {
        step: 3,
        title: "Generate output",
        description:
            "Produce offers, ranked candidate shortlists, and operational reports your teams can act on immediately.",
    },
];

export const PRODUCTIVITY_TIPS = [
    "Batch similar tender tasks into work packages before inviting subcontractors.",
    "Publish HR roles with clear deadlines to improve application quality.",
    "Review submission status weekly to keep procurement cycles on track.",
    "Use consistent document naming so AI analysis can index files faster.",
];

/** Placeholder weather — swap for a real API later */
export const MOCK_WEATHER = {
    city: "Belgrade",
    tempC: 22,
    condition: "Partly cloudy",
    highC: 26,
    lowC: 15,
};

export const APP_VERSION = "1.0.0-preview";
