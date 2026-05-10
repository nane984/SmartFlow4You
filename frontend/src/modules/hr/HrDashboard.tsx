import { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import LinkButton from "../../components/ui/LinkButton";
import { getCvs, getJobPosts } from "./cv.api";
import type { CV, JobPost } from "./cv.types";
import { getInterviewSessions } from "./interviewRoom.api";
import type { InterviewSession } from "./interviewRoom.types";

function formatDate(value: string | null): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

export default function HrDashboard() {
    const [cvs, setCvs] = useState<CV[]>([]);
    const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const [cvList, sessionList, jobPostList] = await Promise.all([
                    getCvs(),
                    getInterviewSessions(),
                    getJobPosts(),
                ]);
                if (!cancelled) {
                    setCvs(cvList);
                    setSessions(sessionList);
                    setJobPosts(jobPostList);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Failed to load HR dashboard data.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const cvById = useMemo(() => {
        return new Map(cvs.map((cv) => [cv.id, cv]));
    }, [cvs]);

    const jobPostTitleById = useMemo(() => {
        return new Map(jobPosts.map((jp) => [jp.id, jp.title]));
    }, [jobPosts]);

    const statusBadgeClass = (status: InterviewSession["status"]) => {
        if (status === "scheduled") {
            return "rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700";
        }
        if (status === "in_progress") {
            return "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700";
        }
        if (status === "completed") {
            return "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700";
        }
        return "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";
    };

    const cvDecisionBadgeClass = (status: CV["status"]) => {
        if (status === "accepted") {
            return "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700";
        }
        if (status === "rejected") {
            return "rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700";
        }
        return "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";
    };

    const scoreBadgeClass = (score: number | null) => {
        if (score === null) {
            return "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600";
        }
        if (score <= 40) {
            return "rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700";
        }
        if (score <= 70) {
            return "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700";
        }
        return "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700";
    };

    const pendingCount = cvs.filter((cv) => cv.status === "pending").length;
    const acceptedCount = cvs.filter((cv) => cv.status === "accepted").length;
    const rejectedCount = cvs.filter((cv) => cv.status === "rejected").length;

    return (
        <>
            <PageHeader
                title="HR Dashboard"
                description="Overview of uploaded CVs and interview sessions."
                actions={
                    <LinkButton to="/hr/upload-cv" variant="secondary" size="sm">
                        Upload CV
                    </LinkButton>
                }
            />

            {error && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{pendingCount}</p>
                </Card>
                <Card className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Accepted</p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-700">{acceptedCount}</p>
                </Card>
                <Card className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Rejected</p>
                    <p className="mt-1 text-2xl font-semibold text-rose-700">{rejectedCount}</p>
                </Card>
            </div>

            <div className="grid gap-8">
                <Card className="overflow-hidden border-slate-200/90 p-0 shadow-md shadow-slate-900/5">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-slate-900">CV Table</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50/80">
                                <tr className="text-left text-slate-600">
                                    <th className="px-6 py-3 font-medium">Applicant Name</th>
                                    <th className="px-6 py-3 font-medium">Job Post</th>
                                    <th className="px-6 py-3 font-medium">Score</th>
                                    <th className="px-6 py-3 font-medium">Decision</th>
                                    <th className="px-6 py-3 font-medium">Processed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td className="px-6 py-5 text-slate-500" colSpan={5}>
                                            Loading CVs...
                                        </td>
                                    </tr>
                                ) : cvs.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-5 text-slate-500" colSpan={5}>
                                            No CV records found.
                                        </td>
                                    </tr>
                                ) : (
                                    cvs.map((cv) => (
                                        <tr key={cv.id} className="hover:bg-slate-50/80">
                                            <td className="px-6 py-4 text-slate-900">
                                                <LinkButton
                                                    to={`/hr/cv/${cv.id}`}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="px-0 py-0 font-semibold text-slate-800 hover:text-brand-700"
                                                >
                                                    {cv.aplicant_name}
                                                </LinkButton>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                {jobPostTitleById.get(cv.job_post) ?? `Job #${cv.job_post}`}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                <span className={scoreBadgeClass(cv.score)}>
                                                    {cv.score === null ? "N/A" : `${cv.score}%`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cvDecisionBadgeClass(cv.status)}>
                                                    {cv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={
                                                        cv.processed
                                                            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                                            : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
                                                    }
                                                >
                                                    {cv.processed ? "Yes" : "No"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card className="overflow-hidden border-slate-200/90 p-0 shadow-md shadow-slate-900/5">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-slate-900">Interview Sessions Table</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50/80">
                                <tr className="text-left text-slate-600">
                                    <th className="px-6 py-3 font-medium">Applicant</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Start Time</th>
                                    <th className="px-6 py-3 font-medium">End Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td className="px-6 py-5 text-slate-500" colSpan={4}>
                                            Loading sessions...
                                        </td>
                                    </tr>
                                ) : sessions.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-5 text-slate-500" colSpan={4}>
                                            No interview sessions found.
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-slate-50/80">
                                            <td className="px-6 py-4 text-slate-900">
                                                {cvById.get(session.cv)?.aplicant_name ?? `CV #${session.cv}`}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={statusBadgeClass(session.status)}>
                                                    {session.status.replace("_", " ")}
                                                </span>
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
                </Card>
            </div>
        </>
    );
}
