import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { isAppAuthenticated } from "../../auth/accessUtils";
import { getMyInterviewSessions } from "../../modules/hr/interviewRoom.api";
import type { InterviewSession } from "../../modules/hr/interviewRoom.types";

function formatWhen(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

function statusLabel(status: string): string {
    return status.replace(/_/g, " ");
}

function sessionActionLabel(session: InterviewSession): string {
    if (session.status === "completed") return "View summary";
    if (session.status === "in_progress") return "Continue interview";
    if (session.status === "scheduled") return "Start interview";
    return "View";
}

export default function CandidateInterviewsPage() {
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAppAuthenticated()) {
            setLoading(false);
            return;
        }
        void (async () => {
            setLoading(true);
            setError(null);
            try {
                setSessions(await getMyInterviewSessions());
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load interviews.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (!isAppAuthenticated()) {
        return (
            <Card className="space-y-3">
                <p className="text-sm text-slate-700">
                    Sign in to see scheduled interviews and answer job questions.
                </p>
                <LinkButton to="/login?from=%2Fcandidate%2Finterviews" variant="primary" size="sm">
                    Sign in
                </LinkButton>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My interviews"
                description="Complete interview questions assigned by HR for jobs you applied to."
                actions={
                    <LinkButton to="/candidate-dashboard" variant="secondary" size="sm">
                        My applications
                    </LinkButton>
                }
            />

            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <Card>
                    <p className="text-sm text-slate-600">Loading interviews…</p>
                </Card>
            ) : sessions.length === 0 ? (
                <Card className="space-y-3">
                    <p className="text-sm text-slate-600">
                        No interview sessions yet. When HR moves your application to the interview
                        stage and schedules a session, it will appear here.
                    </p>
                    <LinkButton to="/candidate/jobs" variant="secondary" size="sm">
                        Browse jobs
                    </LinkButton>
                </Card>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <Card key={session.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    {session.job_title ?? `Job application #${session.application_id ?? session.cv}`}
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Scheduled {formatWhen(session.start_time)}
                                    {" · "}
                                    <span className="capitalize">{statusLabel(session.status)}</span>
                                </p>
                                {session.status === "completed" && session.score != null ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                        Knowledge check score: {session.score}%
                                    </p>
                                ) : null}
                            </div>
                            <LinkButton
                                to={`/candidate/interview/${session.id}`}
                                variant={session.status === "completed" ? "secondary" : "primary"}
                                size="sm"
                            >
                                {sessionActionLabel(session)}
                            </LinkButton>
                        </Card>
                    ))}
                </div>
            )}

            <p className="text-sm text-slate-600">
                Need to apply first?{" "}
                <Link to="/candidate/jobs" className="font-medium text-brand-700 hover:underline">
                    Browse open jobs
                </Link>
            </p>
        </div>
    );
}
