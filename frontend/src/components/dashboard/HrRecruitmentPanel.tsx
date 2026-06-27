import { useCallback, useEffect, useMemo, useState } from "react";
import ApplicationStatusSelector from "../hr/ApplicationStatusSelector";
import JobStatusSelector, { jobPostingStatusBadgeClass } from "../hr/JobStatusSelector";
import type { JobPostingStatus } from "../hr/JobStatusSelector";
import Card from "../ui/Card";
import Button from "../ui/Button";
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
import { getInterviewSessions, createInterviewSession, scheduleApplicationInterview } from "../../modules/hr/interviewRoom.api";
import type { InterviewSession } from "../../modules/hr/interviewRoom.types";
import { listApplicationStatusHistory } from "../../modules/hr/applicationStatusHistory.api";
import type { ApplicationStatusHistoryEntry } from "../../modules/hr/applicationStatusHistory.api";
import { formatApiErrors } from "../../util/formatApiErrors";

type HrTab = "applications" | "jobs" | "interviews" | "status_history";

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

function toDatetimeLocalValue(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const TAB_LABELS: Record<HrTab, string> = {
    applications: "Applications",
    jobs: "Job positions",
    interviews: "Interviews",
    status_history: "Status history",
};

export default function HrRecruitmentPanel() {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [statusHistory, setStatusHistory] = useState<ApplicationStatusHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [busyJobId, setBusyJobId] = useState<number | null>(null);
    const [scheduleBusyId, setScheduleBusyId] = useState<number | null>(null);
    const [scheduleFormAppId, setScheduleFormAppId] = useState<string>("");
    const [scheduleStartTime, setScheduleStartTime] = useState(() => toDatetimeLocalValue(new Date()));
    const [scheduleDuration, setScheduleDuration] = useState("120");
    const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
    const [jobFilter, setJobFilter] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<HrTab>("applications");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const errors: string[] = [];

        const [appResult, sessionResult, jobPostResult, historyResult] = await Promise.allSettled([
            loadApplicationsForHr(),
            getInterviewSessions(),
            getJobPosts(),
            listApplicationStatusHistory(),
        ]);

        if (appResult.status === "fulfilled") setApplications(appResult.value);
        else errors.push("applications");

        if (sessionResult.status === "fulfilled") setSessions(sessionResult.value);
        else errors.push("interview sessions");

        if (jobPostResult.status === "fulfilled") setJobPosts(jobPostResult.value);
        else errors.push("job postings");

        if (historyResult.status === "fulfilled") setStatusHistory(historyResult.value);
        else errors.push("status history");

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

    const filteredStatusHistory = useMemo(() => {
        if (jobFilter === "all") return statusHistory;
        const jobId = Number.parseInt(jobFilter, 10);
        if (!Number.isFinite(jobId)) return statusHistory;
        const appIds = new Set(
            applications.filter((app) => jobIdForApplication(app) === jobId).map((app) => app.id)
        );
        return statusHistory.filter((entry) => appIds.has(entry.application_id));
    }, [statusHistory, jobFilter, applications]);

    const sessionsByCvId = useMemo(() => {
        const map = new Map<number, InterviewSession>();
        for (const session of sessions) {
            if (session.status === "cancelled") continue;
            const existing = map.get(session.cv);
            if (!existing || session.id > existing.id) {
                map.set(session.cv, session);
            }
        }
        return map;
    }, [sessions]);

    const scheduleEligibleApplications = useMemo(() => {
        return applications.filter((app) => {
            if (!["reviewed", "interview"].includes(app.status)) return false;
            return !sessionsByCvId.has(app.id);
        });
    }, [applications, sessionsByCvId]);

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

    const handleQuickSchedule = async (applicationId: number) => {
        setScheduleBusyId(applicationId);
        setError(null);
        try {
            await scheduleApplicationInterview(applicationId);
            await load();
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(
                ax.response?.data
                    ? formatApiErrors(ax.response.data)
                    : "Failed to schedule interview."
            );
        } finally {
            setScheduleBusyId(null);
        }
    };

    const handleScheduleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const appId = Number.parseInt(scheduleFormAppId, 10);
        const duration = Number.parseInt(scheduleDuration, 10);
        if (!Number.isFinite(appId) || appId < 1) {
            setError("Select an application to schedule.");
            return;
        }
        if (!Number.isFinite(duration) || duration < 1) {
            setError("Duration must be at least 1 second.");
            return;
        }
        setScheduleSubmitting(true);
        setError(null);
        try {
            await createInterviewSession({
                cv: appId,
                start_time: new Date(scheduleStartTime).toISOString(),
                duration_seconds: duration,
            });
            setScheduleFormAppId("");
            setScheduleStartTime(toDatetimeLocalValue(new Date()));
            await load();
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(
                ax.response?.data
                    ? formatApiErrors(ax.response.data)
                    : "Failed to create interview session."
            );
        } finally {
            setScheduleSubmitting(false);
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
                <div className="flex flex-wrap gap-2">
                    <LinkButton to="/hr/jobs" variant="secondary" size="sm">
                        Job openings
                    </LinkButton>
                    <LinkButton to="/hr/jobs/new" variant="primary" size="sm">
                        Create job
                    </LinkButton>
                </div>
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
                        scheduleBusyId={scheduleBusyId}
                        sessionsByCvId={sessionsByCvId}
                        jobPostTitleById={jobPostTitleById}
                        onApply={handleStatusAction}
                        onSchedule={handleQuickSchedule}
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
                        <p className="mt-1 text-sm text-slate-600">
                            Schedule interviews for candidates. Moving an application to the interview
                            stage also creates a session automatically.
                        </p>
                    </div>
                    <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
                        <form
                            className="flex flex-wrap items-end gap-3"
                            onSubmit={(e) => void handleScheduleFormSubmit(e)}
                        >
                            <div className="min-w-[220px] flex-1">
                                <label
                                    htmlFor="schedule-application"
                                    className="mb-1 block text-xs font-medium text-slate-600"
                                >
                                    Application
                                </label>
                                <select
                                    id="schedule-application"
                                    className={`${controlClass} w-full`}
                                    value={scheduleFormAppId}
                                    onChange={(e) => setScheduleFormAppId(e.target.value)}
                                    required
                                >
                                    <option value="">Select candidate…</option>
                                    {scheduleEligibleApplications.map((app) => {
                                        const jobId = jobIdForApplication(app);
                                        return (
                                            <option key={app.id} value={String(app.id)}>
                                                {app.aplicant_name}
                                                {" · "}
                                                {app.job_title ??
                                                    (jobId
                                                        ? jobPostTitleById.get(jobId) ?? `Job #${jobId}`
                                                        : "Job")}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="schedule-start"
                                    className="mb-1 block text-xs font-medium text-slate-600"
                                >
                                    Start time
                                </label>
                                <input
                                    id="schedule-start"
                                    type="datetime-local"
                                    className={controlClass}
                                    value={scheduleStartTime}
                                    onChange={(e) => setScheduleStartTime(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="w-28">
                                <label
                                    htmlFor="schedule-duration"
                                    className="mb-1 block text-xs font-medium text-slate-600"
                                >
                                    Duration (s)
                                </label>
                                <input
                                    id="schedule-duration"
                                    type="number"
                                    min={1}
                                    className={controlClass}
                                    value={scheduleDuration}
                                    onChange={(e) => setScheduleDuration(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={scheduleSubmitting || scheduleEligibleApplications.length === 0}>
                                {scheduleSubmitting ? "Scheduling…" : "Schedule interview"}
                            </Button>
                        </form>
                        {scheduleEligibleApplications.length === 0 ? (
                            <p className="mt-2 text-xs text-slate-500">
                                All reviewed / interview-stage applications already have a session, or
                                none are ready yet.
                            </p>
                        ) : null}
                    </div>
                    <InterviewsTable
                        loading={loading}
                        sessions={sessions}
                        filtered={filteredSessions}
                        appById={appById}
                    />
                </Card>
            ) : null}

            {activeTab === "status_history" ? (
                <Card className="overflow-hidden border-slate-200/90 p-0 shadow-md shadow-slate-900/5">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-slate-900">Application status changes</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Audit log of status updates made by HR staff.
                        </p>
                    </div>
                    <StatusHistoryTable loading={loading} entries={filteredStatusHistory} />
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
    scheduleBusyId,
    sessionsByCvId,
    jobPostTitleById,
    onApply,
    onSchedule,
}: {
    loading: boolean;
    applications: JobApplication[];
    filtered: JobApplication[];
    busyId: number | null;
    scheduleBusyId: number | null;
    sessionsByCvId: Map<number, InterviewSession>;
    jobPostTitleById: Map<number, string>;
    onApply: (id: number, action: HrStatusAction) => Promise<void>;
    onSchedule: (id: number) => Promise<void>;
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
                        <th className="px-6 py-3 font-medium">Interview</th>
                        <th className="px-6 py-3 font-medium">Update</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={7}>
                                Loading…
                            </td>
                        </tr>
                    ) : applications.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={7}>
                                No applications yet.
                            </td>
                        </tr>
                    ) : filtered.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={7}>
                                No applications for this job.
                            </td>
                        </tr>
                    ) : (
                        filtered.map((app) => {
                            const jobId = jobIdForApplication(app);
                            const session = sessionsByCvId.get(app.id);
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
                                        {session ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <LinkButton
                                                    to={`/hr/interview/${session.id}`}
                                                    variant="secondary"
                                                    size="sm"
                                                >
                                                    Review
                                                </LinkButton>
                                                <span className="text-xs capitalize text-slate-500">
                                                    {session.status.replace("_", " ")}
                                                </span>
                                            </div>
                                        ) : ["reviewed", "interview"].includes(app.status) ? (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                disabled={scheduleBusyId === app.id}
                                                onClick={() => void onSchedule(app.id)}
                                            >
                                                {scheduleBusyId === app.id ? "Scheduling…" : "Schedule"}
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
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
                        <th className="px-6 py-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={5}>
                                Loading…
                            </td>
                        </tr>
                    ) : sessions.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={5}>
                                No interview sessions yet. Use Schedule interview above or move a
                                candidate to the interview stage.
                            </td>
                        </tr>
                    ) : filtered.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={5}>
                                No sessions for this job.
                            </td>
                        </tr>
                    ) : (
                        filtered.map((session) => (
                            <tr key={session.id} className="hover:bg-slate-50/80">
                                <td className="px-6 py-4 text-slate-900">
                                    {session.applicant_name ??
                                        appById.get(session.cv)?.aplicant_name ??
                                        `CV #${session.cv}`}
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
                                <td className="px-6 py-4">
                                    <LinkButton
                                        to={`/hr/interview/${session.id}`}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        Review
                                    </LinkButton>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function StatusHistoryTable({
    loading,
    entries,
}: {
    loading: boolean;
    entries: ApplicationStatusHistoryEntry[];
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/80">
                    <tr className="text-left text-slate-600">
                        <th className="px-6 py-3 font-medium">When</th>
                        <th className="px-6 py-3 font-medium">Candidate</th>
                        <th className="px-6 py-3 font-medium">Job</th>
                        <th className="px-6 py-3 font-medium">From</th>
                        <th className="px-6 py-3 font-medium">To</th>
                        <th className="px-6 py-3 font-medium">Changed by</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={6}>
                                Loading…
                            </td>
                        </tr>
                    ) : entries.length === 0 ? (
                        <tr>
                            <td className="px-6 py-5 text-slate-500" colSpan={6}>
                                No status changes recorded yet.
                            </td>
                        </tr>
                    ) : (
                        entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-50/80">
                                <td className="px-6 py-4 text-slate-700">{formatDate(entry.changed_at)}</td>
                                <td className="px-6 py-4 font-medium text-slate-900">{entry.candidate_name}</td>
                                <td className="px-6 py-4 text-slate-700">{entry.job_title}</td>
                                <td className="px-6 py-4 text-slate-700">
                                    {entry.from_status_label || "—"}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                        {entry.to_status_label}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-700">{entry.changed_by_name}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
