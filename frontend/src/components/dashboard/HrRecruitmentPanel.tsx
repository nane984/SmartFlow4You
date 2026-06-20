import { useCallback, useEffect, useMemo, useState } from "react";
import ApplicationStatusSelector from "../hr/ApplicationStatusSelector";
import JobStatusSelector, { jobPostingStatusBadgeClass } from "../hr/JobStatusSelector";
import type { JobPostingStatus } from "../hr/JobStatusSelector";
import Card from "../ui/Card";
import LinkButton from "../ui/LinkButton";
import { controlClass } from "../ui/inputStyles";
import { cn } from "../ui/cn";
import {
    applicationStatusBadgeClass,
    applicationStatusLabel,
} from "../../modules/hr/applicationStatus";
import type { HrStatusAction } from "../../modules/hr/applicationStatus";
import {
    getApplications,
    updateApplicationStatus,
    updateJobPostingStatus,
    type JobApplication,
} from "../../modules/jobs/jobs.api";
import { getCvs, getJobPosts } from "../../modules/hr/cv.api";
import type { JobPost } from "../../modules/hr/cv.types";
import { getInterviewSessions } from "../../modules/hr/interviewRoom.api";
import type { InterviewSession } from "../../modules/hr/interviewRoom.types";
import { formatApiErrors } from "../../util/formatApiErrors";

type HrTab = "applications" | "jobs" | "interviews";

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

function jobTitle(job: JobPost): string {
    return job.title || (job as { job_title?: string }).job_title || `Job #${job.id}`;
}

async function loadApplicationsForHr(): Promise<JobApplication[]> {
    try {
        return await getApplications();
    } catch {
        return getCvs();
    }
}

function jobIdForApplication(app: JobApplication): number | null {
    return app.job_post ?? app.job_posting ?? null;
}

const TAB_LABELS: Record<HrTab, string> = {
    applications: "Applications",
    jobs: "Job positions",
    interviews: "Interviews",
};

export default function HrRecruitmentPanel() {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [busyJobId, setBusyJobId] = useState<number | null>(null);
    const [jobFilter, setJobFilter] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<HrTab>("applications");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const errors: string[] = [];

        const [appResult, sessionResult, jobPostResult] = await Promise.allSettled([
            loadApplicationsForHr(),
            getInterviewSessions(),
            getJobPosts(),
        ]);

        if (appResult.status === "fulfilled") setApplications(appResult.value);
        else errors.push("applications");

        if (sessionResult.status === "fulfilled") setSessions(sessionResult.value);
        else errors.push("interview sessions");

        if (jobPostResult.status === "fulfilled") setJobPosts(jobPostResult.value);
        else errors.push("job postings");

        if (errors.length === 3) setError("Failed to load recruitment data.");
        else if (errors.length > 0) setError(`Some data could not be loaded: ${errors.join(", ")}.`);

        setLoading(false);
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const appById = useMemo(() => new Map(applications.map((app) => [app.id, app])), [applications]);

    const jobPostTitleById = useMemo(
        () => new Map(jobPosts.map((jp) => [jp.id, jobTitle(jp)])),
        [jobPosts]
    );

    const filteredApplications = useMemo(() => {
        if (jobFilter === "all") return applications;
        const jobId = Number.parseInt(jobFilter, 10);
        if (!Number.isFinite(jobId)) return applications;
        return applications.filter((app) => jobIdForApplication(app) === jobId);
    }, [applications, jobFilter]);

    const filteredSessions = useMemo(() => {
        if (jobFilter === "all") return sessions;
        const jobId = Number.parseInt(jobFilter, 10);
        if (!Number.isFinite(jobId)) return sessions;
        const appIdsForJob = new Set(
            applications.filter((app) => jobIdForApplication(app) === jobId).map((app) => app.id)
        );
        return sessions.filter((session) => appIdsForJob.has(session.cv));
    }, [sessions, applications, jobFilter]);

    const filteredJobs = useMemo(() => {
        if (jobFilter === "all") return jobPosts;
        const jobId = Number.parseInt(jobFilter, 10);
        if (!Number.isFinite(jobId)) return jobPosts;
        return jobPosts.filter((job) => job.id === jobId);
    }, [jobPosts, jobFilter]);

    const activeJobsCount = jobPosts.filter((jp) => jp.posting_status === "published").length;
    const submittedCount = filteredApplications.filter((a) => a.status === "submitted").length;
    const inProgressCount = filteredApplications.filter((a) =>
        ["reviewed", "interview"].includes(a.status)
    ).length;
    const acceptedCount = filteredApplications.filter((a) => a.status === "accepted").length;

    const filterLabel =
        jobFilter === "all"
            ? "All jobs"
            : jobPostTitleById.get(Number.parseInt(jobFilter, 10)) ?? "Selected job";

    const handleStatusAction = async (applicationId: number, action: HrStatusAction) => {
        setBusyId(applicationId);
        setError(null);
        try {
            await updateApplicationStatus(applicationId, action);
            await load();
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(
                ax.response?.data
                    ? formatApiErrors(ax.response.data)
                    : "Failed to update application status."
            );
        } finally {
            setBusyId(null);
        }
    };

    const handleJobStatusChange = async (jobId: number, posting_status: JobPostingStatus) => {
        setBusyJobId(jobId);
        setError(null);
        try {
            await updateJobPostingStatus(jobId, posting_status);
            await load();
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(
                ax.response?.data ? formatApiErrors(ax.response.data) : "Failed to update job status."
            );
            throw err;
        } finally {
            setBusyJobId(null);
        }
    };

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
                        HR recruitment
                    </p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        Candidate pipeline
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Review applications, manage openings, and schedule interviews — filtered view:{" "}
                        <span className="font-medium text-slate-800">{filterLabel}</span>
                    </p>
                </div>
                <LinkButton to="/hr/jobs" variant="secondary" size="sm">
                    Create & edit jobs
                </LinkButton>
            </div>

            <Card className="flex flex-wrap items-center gap-3 border-slate-200/90 p-4 shadow-sm">
                <label htmlFor="hr-job-filter" className="text-sm font-medium text-slate-700">
                    Job
                </label>
                <select
                    id="hr-job-filter"
                    className={`${controlClass} min-w-[220px] flex-1 sm:max-w-xs`}
                    value={jobFilter}
                    onChange={(e) => setJobFilter(e.target.value)}
                >
                    <option value="all">All jobs</option>
                    {jobPosts.map((job) => (
                        <option key={job.id} value={String(job.id)}>
                            {jobTitle(job)}
                        </option>
                    ))}
                </select>
                <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                    {(Object.keys(TAB_LABELS) as HrTab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                                activeTab === tab
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            {TAB_LABELS[tab]}
                            {tab === "applications" && submittedCount > 0 ? (
                                <span className="ml-1.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-xs text-sky-800">
                                    {submittedCount}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </Card>

            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
                    {error}
                </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Active jobs
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{activeJobsCount}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                        New applications
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-sky-800">{submittedCount}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                        In progress
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-violet-800">{inProgressCount}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        Selected
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-800">{acceptedCount}</p>
                </Card>
            </div>

            {activeTab === "applications" ? (
                <Card className="overflow-hidden border-slate-200/90 p-0 shadow-md shadow-slate-900/5">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-slate-900">Applications</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Choose an action from the dropdown to move candidates through the pipeline.
                        </p>
                    </div>
                    <ApplicationsTable
                        loading={loading}
                        applications={applications}
                        filtered={filteredApplications}
                        busyId={busyId}
                        jobPostTitleById={jobPostTitleById}
                        onApply={handleStatusAction}
                    />
                </Card>
            ) : null}

            {activeTab === "jobs" ? (
                <Card className="overflow-hidden border-slate-200/90 p-0 shadow-md shadow-slate-900/5">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-slate-900">Job positions</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Set each position to Active (visible to candidates) or Inactive.
                        </p>
                    </div>
                    <JobsTable
                        loading={loading}
                        jobs={jobPosts}
                        filtered={filteredJobs}
                        busyJobId={busyJobId}
                        onStatusChange={handleJobStatusChange}
                    />
                </Card>
            ) : null}

            {activeTab === "interviews" ? (
                <Card className="overflow-hidden border-slate-200/90 p-0 shadow-md shadow-slate-900/5">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-slate-900">Interview sessions</h3>
                    </div>
                    <InterviewsTable
                        loading={loading}
                        sessions={sessions}
                        filtered={filteredSessions}
                        appById={appById}
                    />
                </Card>
            ) : null}
        </section>
    );
}

function ApplicationsTable({
    loading,
    applications,
    filtered,
    busyId,
    jobPostTitleById,
    onApply,
}: {
    loading: boolean;
    applications: JobApplication[];
    filtered: JobApplication[];
    busyId: number | null;
    jobPostTitleById: Map<number, string>;
    onApply: (id: number, action: HrStatusAction) => Promise<void>;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/80">
                    <tr className="text-left text-slate-600">
                        <th className="px-6 py-3 font-medium">Applicant</th>
                        <th className="px-6 py-3 font-medium">Job</th>
                        <th className="px-6 py-3 font-medium">Applied</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Processed</th>
                        <th className="px-6 py-3 font-medium">Update</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={6}>
                                Loading…
                            </td>
                        </tr>
                    ) : applications.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={6}>
                                No applications yet.
                            </td>
                        </tr>
                    ) : filtered.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={6}>
                                No applications for this job.
                            </td>
                        </tr>
                    ) : (
                        filtered.map((app) => {
                            const jobId = jobIdForApplication(app);
                            return (
                                <tr key={app.id} className="hover:bg-slate-50/80">
                                    <td className="px-6 py-4">
                                        <LinkButton
                                            to={`/hr/cv/${app.id}`}
                                            variant="ghost"
                                            size="sm"
                                            className="px-0 py-0 font-semibold text-slate-800 hover:text-brand-700"
                                        >
                                            {app.aplicant_name}
                                        </LinkButton>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {app.job_title ??
                                            (jobId ? jobPostTitleById.get(jobId) ?? `Job #${jobId}` : "—")}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {formatDate(app.submitted_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={applicationStatusBadgeClass(app.status)}>
                                            {app.status_label ?? applicationStatusLabel(app.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={
                                                app.processed
                                                    ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                                    : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
                                            }
                                        >
                                            {app.processed ? "Yes" : "No"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <ApplicationStatusSelector
                                            applicationId={app.id}
                                            currentStatus={app.status}
                                            disabled={busyId === app.id}
                                            onApply={onApply}
                                        />
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}

function JobsTable({
    loading,
    jobs,
    filtered,
    busyJobId,
    onStatusChange,
}: {
    loading: boolean;
    jobs: JobPost[];
    filtered: JobPost[];
    busyJobId: number | null;
    onStatusChange: (jobId: number, status: JobPostingStatus) => Promise<void>;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/80">
                    <tr className="text-left text-slate-600">
                        <th className="px-6 py-3 font-medium">Title</th>
                        <th className="px-6 py-3 font-medium">Company</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Change</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={4}>
                                Loading…
                            </td>
                        </tr>
                    ) : jobs.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={4}>
                                No jobs yet. Use Create & edit jobs to add openings.
                            </td>
                        </tr>
                    ) : filtered.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={4}>
                                No job matches this filter.
                            </td>
                        </tr>
                    ) : (
                        filtered.map((job) => {
                            const status = job.posting_status ?? "draft";
                            return (
                                <tr key={job.id} className="hover:bg-slate-50/80">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {jobTitle(job)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {(job as { job_company?: string }).job_company ?? "—"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={jobPostingStatusBadgeClass(status)}>
                                            {status === "published"
                                                ? "Active"
                                                : status === "closed"
                                                  ? "Inactive"
                                                  : "Draft"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <JobStatusSelector
                                            jobId={job.id}
                                            status={status}
                                            disabled={busyJobId === job.id}
                                            onChange={onStatusChange}
                                        />
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}

function InterviewsTable({
    loading,
    sessions,
    filtered,
    appById,
}: {
    loading: boolean;
    sessions: InterviewSession[];
    filtered: InterviewSession[];
    appById: Map<number, JobApplication>;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/80">
                    <tr className="text-left text-slate-600">
                        <th className="px-6 py-3 font-medium">Applicant</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Start</th>
                        <th className="px-6 py-3 font-medium">End</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={4}>
                                Loading…
                            </td>
                        </tr>
                    ) : sessions.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={4}>
                                No interview sessions yet.
                            </td>
                        </tr>
                    ) : filtered.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={4}>
                                No sessions for this job.
                            </td>
                        </tr>
                    ) : (
                        filtered.map((session) => (
                            <tr key={session.id} className="hover:bg-slate-50/80">
                                <td className="px-6 py-4 text-slate-900">
                                    {appById.get(session.cv)?.aplicant_name ?? `CV #${session.cv}`}
                                </td>
                                <td className="px-6 py-4 capitalize text-slate-700">
                                    {session.status.replace("_", " ")}
                                </td>
                                <td className="px-6 py-4 text-slate-700">
                                    {formatDate(session.start_time)}
                                </td>
                                <td className="px-6 py-4 text-slate-700">
                                    {formatDate(session.end_time)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
