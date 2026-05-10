import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { getJobs, type Job } from "./jobs.api";

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

export default function OpenJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getJobs();
                setJobs(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load jobs.");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader title="Open Jobs" description="Browse available opportunities." />

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {loading ? (
                <Card>
                    <p className="text-sm text-slate-600">Loading jobs...</p>
                </Card>
            ) : jobs.length === 0 ? (
                <Card>
                    <p className="text-sm text-slate-600">No open jobs available right now.</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {jobs.map((job) => (
                        <Link
                            key={job.id}
                            to={`/jobs/${job.id}`}
                            className="block no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2"
                        >
                            <Card className="transition-shadow hover:shadow-md hover:shadow-slate-900/10">
                                <h3 className="text-lg font-semibold text-slate-900">{job.job_title}</h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    {job.job_company} · {job.job_location}
                                </p>
                                <p className="mt-3 text-sm text-slate-700">{job.job_description}</p>
                                <p className="mt-3 text-sm font-medium text-slate-800">
                                    Salary: {formatSalary(job.job_salary_min, job.job_salary_max)}
                                </p>
                                <p className="mt-4 text-sm font-medium text-brand-700">View details →</p>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
