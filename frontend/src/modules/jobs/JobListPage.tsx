import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import JobStatusSelector, { jobPostingStatusBadgeClass } from "../../components/hr/JobStatusSelector";
import type { JobPostingStatus } from "../../components/hr/JobStatusSelector";
import { controlClass } from "../../components/ui/inputStyles";
import { cn } from "../../components/ui/cn";
import { getAllJobsForHr, updateJobPostingStatus, type Job } from "./jobs.api";
import JobInterviewQuestionsPanel from "../../modules/hr/JobInterviewQuestionsPanel";
import { formatJobSalary, jobEffectiveStatus } from "./jobFormDefaults";

type StatusFilter = "all" | "published" | "closed" | "draft";

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

function statusLabel(status: string): string {
    if (status === "published") return "Active";
    if (status === "closed") return "Inactive";
    return "Draft";
}

export default function JobListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [busyJobId, setBusyJobId] = useState<number | null>(null);

    const loadJobs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setJobs(await getAllJobsForHr());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load jobs.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadJobs();
    }, [loadJobs]);

    useEffect(() => {
        const fromUrl = searchParams.get("selected");
        if (fromUrl) {
            const id = Number.parseInt(fromUrl, 10);
            if (Number.isFinite(id)) setSelectedId(id);
        }
    }, [searchParams]);

    const filteredJobs = useMemo(() => {
        const q = search.trim().toLowerCase();
        return jobs.filter((job) => {
            const status = jobEffectiveStatus(job);
            if (statusFilter !== "all" && status !== statusFilter) return false;
            if (!q) return true;
            const haystack = [
                job.job_title,
                job.job_company,
                job.job_location,
                job.job_category,
                job.job_type,
            ]
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [jobs, statusFilter, search]);

    const selectedJob = useMemo(
        () => jobs.find((j) => j.id === selectedId) ?? null,
        [jobs, selectedId]
    );

    const selectJob = (job: Job) => {
        setSelectedId(job.id);
        setSearchParams({ selected: String(job.id) });
    };

    const handleJobStatusChange = async (jobId: number, posting_status: JobPostingStatus) => {
        setBusyJobId(jobId);
        setError(null);
        try {
            await updateJobPostingStatus(jobId, posting_status);
            await loadJobs();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update job status.");
            throw e;
        } finally {
            setBusyJobId(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Job openings"
                description="Browse published and draft positions, filter the list, and manage status for each role."
                actions={
                    <LinkButton to="/hr/jobs/new" variant="primary" size="sm">
                        + Create job
                    </LinkButton>
                }
            />

            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <Card className="flex flex-wrap items-end gap-4 p-4">
                <div className="min-w-[180px] flex-1">
                    <label htmlFor="job-search" className="mb-1 block text-sm font-medium text-slate-700">
                        Search
                    </label>
                    <input
                        id="job-search"
                        className={controlClass}
                        placeholder="Title, company, location…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="min-w-[160px]">
                    <label htmlFor="job-status-filter" className="mb-1 block text-sm font-medium text-slate-700">
                        Status
                    </label>
                    <select
                        id="job-status-filter"
                        className={controlClass}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    >
                        <option value="all">All statuses</option>
                        <option value="published">Active</option>
                        <option value="closed">Inactive</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
                <p className="text-sm text-slate-600">
                    {filteredJobs.length} of {jobs.length} positions
                </p>
            </Card>

            <div className="grid gap-6 lg:grid-cols-5">
                <Card className="overflow-hidden p-0 lg:col-span-2">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <h2 className="font-semibold text-slate-900">Positions</h2>
                    </div>
                    <div className="max-h-[32rem] overflow-y-auto divide-y divide-slate-100">
                        {loading ? (
                            <p className="px-4 py-6 text-sm text-slate-500">Loading jobs…</p>
                        ) : filteredJobs.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-slate-500">
                                No jobs match your filters.{" "}
                                <LinkButton to="/hr/jobs/new" variant="ghost" size="sm" className="inline px-0">
                                    Create one
                                </LinkButton>
                            </p>
                        ) : (
                            filteredJobs.map((job) => {
                                const status = jobEffectiveStatus(job);
                                const isSelected = selectedId === job.id;
                                return (
                                    <button
                                        key={job.id}
                                        type="button"
                                        onClick={() => selectJob(job)}
                                        className={cn(
                                            "w-full px-4 py-3 text-left transition-colors hover:bg-slate-50",
                                            isSelected && "bg-brand-50/80 ring-1 ring-inset ring-brand-200"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-medium text-slate-900">{job.job_title}</p>
                                                <p className="mt-0.5 text-xs text-slate-600">
                                                    {job.job_company} · {job.job_location}
                                                </p>
                                            </div>
                                            <span className={jobPostingStatusBadgeClass(status)}>
                                                {statusLabel(status)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </Card>

                <Card className="lg:col-span-3">
                    {!selectedJob ? (
                        <div className="flex min-h-[20rem] flex-col items-center justify-center px-6 py-10 text-center">
                            <p className="text-sm text-slate-600">
                                Select a job from the list to view details and change its status.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        {selectedJob.job_title}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {selectedJob.job_company} · {selectedJob.job_location}
                                    </p>
                                </div>
                                <span className={jobPostingStatusBadgeClass(jobEffectiveStatus(selectedJob))}>
                                    {statusLabel(jobEffectiveStatus(selectedJob))}
                                </span>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                                <p className="text-sm font-medium text-slate-800">Change status</p>
                                <p className="mt-1 text-xs text-slate-600">
                                    Active jobs are visible to candidates. Inactive jobs are hidden from the public
                                    list.
                                </p>
                                <div className="mt-3">
                                    <JobStatusSelector
                                        jobId={selectedJob.id}
                                        status={jobEffectiveStatus(selectedJob)}
                                        disabled={busyJobId === selectedJob.id}
                                        onChange={handleJobStatusChange}
                                    />
                                </div>
                            </div>

                            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="font-medium text-slate-500">Salary</dt>
                                    <dd className="mt-0.5 text-slate-900">
                                        {formatJobSalary(selectedJob.job_salary_min, selectedJob.job_salary_max)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Type</dt>
                                    <dd className="mt-0.5 text-slate-900">{selectedJob.job_type || "—"}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Category</dt>
                                    <dd className="mt-0.5 text-slate-900">{selectedJob.job_category || "—"}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Published</dt>
                                    <dd className="mt-0.5 text-slate-900">
                                        {formatDate(selectedJob.job_published_at)}
                                    </dd>
                                </div>
                            </dl>

                            <section>
                                <h3 className="text-sm font-semibold text-slate-900">Description</h3>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                    {selectedJob.job_description}
                                </p>
                            </section>
                            <section>
                                <h3 className="text-sm font-semibold text-slate-900">Responsibilities</h3>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                    {selectedJob.job_responsibilities}
                                </p>
                            </section>
                            {selectedJob.job_requirements ? (
                                <section>
                                    <h3 className="text-sm font-semibold text-slate-900">Requirements</h3>
                                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                        {selectedJob.job_requirements}
                                    </p>
                                </section>
                            ) : null}
                            {selectedJob.job_benefits ? (
                                <section>
                                    <h3 className="text-sm font-semibold text-slate-900">Benefits</h3>
                                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                        {selectedJob.job_benefits}
                                    </p>
                                </section>
                            ) : null}

                            <JobInterviewQuestionsPanel
                                jobPostId={selectedJob.id}
                                jobTitle={selectedJob.job_title}
                            />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
