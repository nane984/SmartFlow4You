import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { isAppAuthenticated } from "../../auth/accessUtils";
import {
    applicationStatusBadgeClass,
    applicationStatusLabel,
} from "../../modules/hr/applicationStatus";
import { getJobs, getMyApplications, type Job, type JobApplication } from "../../modules/jobs/jobs.api";

function formatSalary(min: string, max: string): string {
    const minN = Number(min);
    const maxN = Number(max);
    const minLabel = Number.isNaN(minN) ? min : minN.toLocaleString();
    const maxLabel = Number.isNaN(maxN) ? max : maxN.toLocaleString();
    if (!min && !max) return "Not specified";
    if (!min) return `Up to ${maxLabel}`;
    if (!max) return `From ${minLabel}`;
    return `${minLabel} - ${maxLabel}`;
}

export default function CandidateJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const authenticated = isAppAuthenticated();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [jobList, apps] = await Promise.all([
                    getJobs(),
                    authenticated ? getMyApplications().catch(() => []) : Promise.resolve([]),
                ]);
                setJobs(jobList);
                setMyApplications(apps);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load jobs.");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [authenticated]);

    const applicationByJobId = new Map(
        myApplications.map((app) => [app.job_post ?? app.job_posting, app])
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Open jobs"
                description="Browse positions and apply from your candidate profile."
                actions={
                    <LinkButton to="/candidate" variant="secondary" size="sm">
                        ← Candidate home
                    </LinkButton>
                }
            />

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {loading ? (
                <Card>
                    <p className="text-sm text-slate-600">Loading jobs…</p>
                </Card>
            ) : jobs.length === 0 ? (
                <Card>
                    <p className="text-sm text-slate-600">No open jobs right now. Check back later.</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {jobs.map((job) => {
                        const application = applicationByJobId.get(job.id);
                        return (
                        <Link
                            key={job.id}
                            to={`/candidate/jobs/${job.id}`}
                            className="block no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                        >
                            <Card className="transition-shadow hover:shadow-md">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <h2 className="text-lg font-semibold text-slate-900">{job.job_title}</h2>
                                    {application ? (
                                        <span className={applicationStatusBadgeClass(application.status)}>
                                            {application.status_label ?? applicationStatusLabel(application.status)}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-1 text-sm text-slate-600">
                                    {job.job_company} · {job.job_location}
                                </p>
                                <p className="mt-2 text-sm text-slate-700 line-clamp-2">
                                    {job.job_description}
                                </p>
                                <p className="mt-2 text-xs font-medium text-slate-500">
                                    Salary: {formatSalary(job.job_salary_min, job.job_salary_max)}
                                </p>
                            </Card>
                        </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
