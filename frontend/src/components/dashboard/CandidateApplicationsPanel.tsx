import { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import LinkButton from "../ui/LinkButton";
import {
    APPLICATION_STATUS_CANDIDATE_HINTS,
    applicationStatusBadgeClass,
    applicationStatusLabel,
    type ApplicationStatus,
} from "../../modules/hr/applicationStatus";
import { getMyApplications, type JobApplication } from "../../modules/jobs/jobs.api";
import { getMyInterviewSessions } from "../../modules/hr/interviewRoom.api";
import type { InterviewSession } from "../../modules/hr/interviewRoom.types";

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

function jobIdForApplication(app: JobApplication): number | null {
    return app.job_post ?? app.job_posting ?? null;
}

type CandidateApplicationsListProps = {
    applications: JobApplication[];
    interviews: InterviewSession[];
    loading: boolean;
    error: string | null;
    compact?: boolean;
};

export function CandidateApplicationsList({
    applications,
    interviews,
    loading,
    error,
    compact = false,
}: CandidateApplicationsListProps) {
    if (error) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
                {error}
            </div>
        );
    }

    if (loading) {
        return <p className="text-sm text-slate-600">Loading your applications…</p>;
    }

    if (applications.length === 0) {
        return (
            <p className="text-sm text-slate-600">
                You have not applied to any jobs yet.{" "}
                <LinkButton to="/candidate/jobs" variant="ghost" size="sm" className="inline px-0">
                    Browse open jobs
                </LinkButton>
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {applications.map((app) => {
                const jobId = jobIdForApplication(app);
                const status = app.status as ApplicationStatus;
                const session = interviews.find(
                    (s) => s.application_id === app.id || s.cv === app.id
                );
                const showInterview =
                    status === "interview" &&
                    session &&
                    session.status !== "cancelled";
                return (
                    <Card key={app.id} className={compact ? "p-4" : "p-5"}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-slate-900">
                                    {app.job_title ?? (jobId ? `Job #${jobId}` : "Job application")}
                                </h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    Applied {formatDate(app.submitted_at)}
                                </p>
                            </div>
                            <span className={applicationStatusBadgeClass(app.status)}>
                                {app.status_label ?? applicationStatusLabel(app.status)}
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-700">
                            {APPLICATION_STATUS_CANDIDATE_HINTS[status] ??
                                "Your application is being processed by HR."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {showInterview ? (
                                <LinkButton
                                    to={`/candidate/interview/${session.id}`}
                                    variant="primary"
                                    size="sm"
                                >
                                    {session.status === "completed"
                                        ? "View interview"
                                        : session.status === "in_progress"
                                          ? "Continue interview"
                                          : "Start interview"}
                                </LinkButton>
                            ) : null}
                            {jobId ? (
                                <LinkButton
                                    to={`/candidate/jobs/${jobId}`}
                                    variant="secondary"
                                    size="sm"
                                >
                                    View job
                                </LinkButton>
                            ) : null}
                            {status === "interview" && !showInterview ? (
                                <LinkButton to="/candidate/interviews" variant="secondary" size="sm">
                                    My interviews
                                </LinkButton>
                            ) : null}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

export function useCandidateApplications() {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [interviews, setInterviews] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const [apps, sessions] = await Promise.all([
                    getMyApplications(),
                    getMyInterviewSessions().catch(() => []),
                ]);
                if (!cancelled) {
                    setApplications(apps);
                    setInterviews(sessions);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Failed to load your applications.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const byJobId = useMemo(() => {
        const map = new Map<number, JobApplication>();
        for (const app of applications) {
            const jobId = jobIdForApplication(app);
            if (jobId != null) map.set(jobId, app);
        }
        return map;
    }, [applications]);

    return { applications, interviews, byJobId, loading, error };
}
