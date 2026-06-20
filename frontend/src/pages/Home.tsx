import { Link, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import { ACCESS_DOMAINS } from "../auth/accessConfig";
import { ROLE_LABELS, ROLES, type AppRole } from "../auth/roles";
import { roleHomePath, setMockSession } from "../auth/accessUtils";

const domains = [
    {
        id: "procurement",
        title: "Procurement",
        subtitle: "Tenders & subcontractors",
        description:
            "Tender → Work package → Submission → Analysis. Manage investors, contractors, suppliers, Excel templates, and bids.",
        cta: "Browse Tenders",
        to: "/tenders",
        flow: "Tender → WorkPackage → Submission → Analysis",
        accent: "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
        icon: "📋",
        restricted: true,
    },
    {
        id: "hr",
        title: "HR Jobs",
        subtitle: "Hiring & applicants",
        description:
            "Job posting → Candidate → Application → Interview. HR creates roles; candidates apply with CV uploads (PDF/Word).",
        cta: "View Jobs",
        to: "/hr/jobs",
        flow: "JobPosting → Candidate → Application → Interview",
        accent: "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
        icon: "💼",
        restricted: true,
    },
    {
        id: "candidate",
        title: "Candidate Portal",
        subtitle: "Careers",
        description:
            "Public registration — create a profile, browse open positions, and submit applications without a password in this preview.",
        cta: "Join as Candidate",
        to: "/candidate",
        flow: "Register → Browse jobs → Apply",
        accent: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
        icon: "🎯",
        restricted: false,
    },
] as const;

const demoRoles: { role: AppRole; label: string }[] = [
    { role: ROLES.INVESTOR, label: ROLE_LABELS.investor },
    { role: ROLES.HR, label: ROLE_LABELS.hr },
    { role: ROLES.ADMIN, label: ROLE_LABELS.admin },
];

export default function Home() {
    const navigate = useNavigate();

    const startDemo = (role: AppRole) => {
        setMockSession(role);
        navigate(roleHomePath(role));
    };

    return (
        <div className="space-y-12 pb-8">
            <section className="text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
                    AI-ready enterprise platform
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    Smart Procurement &amp; Hiring Platform
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                    One platform for procurement tenders, HR job postings, and candidate applications.
                    Modular domains with unified document handling — structured for future AI analysis and
                    automation.
                </p>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
                {domains.map((d) => (
                    <Card key={d.id} className={`flex flex-col border-2 p-6 ${d.accent}`}>
                        <span className="text-3xl" aria-hidden>
                            {d.icon}
                        </span>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {d.subtitle}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">{d.title}</h2>
                        <p className="mt-1 font-mono text-xs text-brand-800">{d.flow}</p>
                        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{d.description}</p>
                        {d.restricted ? (
                            <p className="mt-2 text-xs font-medium text-amber-800">Restricted access</p>
                        ) : (
                            <p className="mt-2 text-xs font-medium text-emerald-800">Public access</p>
                        )}
                        <Link
                            to={d.to}
                            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-colors hover:bg-brand-700"
                        >
                            {d.cta}
                        </Link>
                    </Card>
                ))}
            </section>

            <section>
                <h2 className="text-lg font-semibold text-slate-900">Unified documents</h2>
                <p className="mt-1 text-sm text-slate-600">
                    All modules share tracked, downloadable files: work package Excel templates, submission
                    spreadsheets, tender documents, and job application CVs.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        "Work package templates (.xlsx)",
                        "Subcontractor submissions (.xlsx)",
                        "Tender documents",
                        "Application CVs (.pdf, .doc)",
                    ].map((label) => (
                        <Card key={label} className="py-3 text-center text-sm text-slate-700">
                            {label}
                        </Card>
                    ))}
                </div>
            </section>

            <Card className="border-dashed border-slate-300 bg-slate-50/80">
                <h3 className="text-sm font-semibold text-slate-900">Demo access (placeholder auth)</h3>
                <p className="mt-1 text-sm text-slate-600">
                    Explore restricted modules with a mocked role, or sign in with real credentials.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {demoRoles.map(({ role, label }) => (
                        <button
                            key={role}
                            type="button"
                            onClick={() => startDemo(role)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                        >
                            Demo: {label}
                        </button>
                    ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                    Procurement domain: <code className="rounded bg-slate-100 px-1">{ACCESS_DOMAINS.TENDERS}</code>
                    {" · "}
                    HR domain: <code className="rounded bg-slate-100 px-1">{ACCESS_DOMAINS.HR}</code>
                </p>
            </Card>
        </div>
    );
}
