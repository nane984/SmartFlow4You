import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

const tiles = [
    {
        to: "/tenders",
        title: "Tenders",
        body: "Procurement opportunities, work packages, and submissions.",
    },
    {
        to: "/hr/jobs",
        title: "HR Jobs",
        body: "Create postings and review applicants.",
    },
    {
        to: "/candidate",
        title: "Candidate portal",
        body: "Public job search and applications.",
    },
    {
        to: "/companies",
        title: "Companies",
        body: "Investor, contractor, and supplier profiles.",
    },
] as const;

export default function Dashboard() {
    return (
        <>
            <PageHeader
                title="Dashboard"
                description="Welcome to SmartFlow. Pick a module to continue — layout and styling are consistent across the app."
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {tiles.map((t) => (
                    <Link
                        key={t.to}
                        to={t.to}
                        className="group block no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2"
                    >
                        <Card className="h-full transition-shadow group-hover:shadow-md group-hover:shadow-slate-900/10">
                            <h2 className="text-base font-semibold text-slate-900 group-hover:text-brand-800">
                                {t.title}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.body}</p>
                            <span className="mt-4 inline-flex text-sm font-medium text-brand-700 group-hover:underline">
                                Open →
                            </span>
                        </Card>
                    </Link>
                ))}
            </div>
        </>
    );
}
