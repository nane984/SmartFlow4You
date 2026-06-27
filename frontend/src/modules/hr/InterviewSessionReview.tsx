import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { mediaUrl } from "../../util/mediaUrl";
import AnswerReviewPanel from "./AnswerReviewPanel";
import {
    getSessionAnswersReview,
    getSessionVideos,
    type AnswerReview,
    type VideoSubmission,
} from "./candidateDetail.api";
import { getInterviewQuestions, getInterviewSession } from "./interviewRoom.api";
import type { InterviewSession, RoomQuestion } from "./interviewRoom.types";

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

export default function InterviewSessionReview() {
    const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
    const sessionId = sessionIdParam ? Number.parseInt(sessionIdParam, 10) : NaN;

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [questions, setQuestions] = useState<RoomQuestion[]>([]);
    const [answers, setAnswers] = useState<AnswerReview[]>([]);
    const [videos, setVideos] = useState<VideoSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!Number.isFinite(sessionId) || sessionId < 1) return;
        setLoading(true);
        setError(null);
        try {
            const [sessionData, questionData, answerData, videoData] = await Promise.all([
                getInterviewSession(sessionId),
                getInterviewQuestions(sessionId),
                getSessionAnswersReview(sessionId),
                getSessionVideos(sessionId),
            ]);
            setSession(sessionData);
            setQuestions(questionData);
            setAnswers(answerData);
            setVideos(videoData);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load interview review.");
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        void load();
    }, [load]);

    if (!Number.isFinite(sessionId) || sessionId < 1) {
        return (
            <Card>
                <p className="text-sm text-rose-700">Invalid session id.</p>
                <LinkButton to="/dashboard" variant="secondary" size="sm" className="mt-4">
                    Back to dashboard
                </LinkButton>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card>
                <p className="text-sm text-slate-600">Loading interview review…</p>
            </Card>
        );
    }

    if (error || !session) {
        return (
            <Card className="space-y-3">
                <p className="text-sm text-rose-700">{error ?? "Session not found."}</p>
                <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
                    Retry
                </Button>
                <LinkButton to="/dashboard" variant="secondary" size="sm">
                    Back to dashboard
                </LinkButton>
            </Card>
        );
    }

    const applicationId = session.application_id ?? session.cv;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Interview review"
                description="Review candidate answers and recordings. HR staff cannot take the interview on behalf of the candidate."
                actions={
                    <div className="flex flex-wrap gap-2">
                        {applicationId ? (
                            <LinkButton to={`/hr/cv/${applicationId}`} variant="secondary" size="sm">
                                Candidate profile
                            </LinkButton>
                        ) : null}
                        <LinkButton to="/dashboard" variant="secondary" size="sm">
                            ← HR home
                        </LinkButton>
                    </div>
                }
            />

            <Card>
                <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <dt className="font-medium text-slate-500">Candidate</dt>
                        <dd className="mt-1 font-medium text-slate-900">
                            {session.applicant_name ?? `Application #${applicationId}`}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Job</dt>
                        <dd className="mt-1 text-slate-900">{session.job_title ?? "—"}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Status</dt>
                        <dd className="mt-1 capitalize text-slate-900">{session.status.replace("_", " ")}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Score</dt>
                        <dd className="mt-1 text-slate-900">
                            {session.score != null ? `${session.score}%` : "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Scheduled</dt>
                        <dd className="mt-1 text-slate-900">{formatDate(session.start_time)}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Completed</dt>
                        <dd className="mt-1 text-slate-900">{formatDate(session.end_time)}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Focus violations</dt>
                        <dd className="mt-1 text-slate-900">{session.focus_violations ?? 0}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Session</dt>
                        <dd className="mt-1 text-slate-900">#{session.id}</dd>
                    </div>
                </dl>
            </Card>

            <Card className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Session recording</h2>
                <p className="text-sm text-slate-600">
                    Full interview video recorded by the candidate during the session.
                </p>
                {videos.length === 0 ? (
                    <p className="text-sm text-slate-500">No session video uploaded yet.</p>
                ) : (
                    videos.map((video) => (
                        <video
                            key={video.id}
                            controls
                            className="w-full max-w-3xl rounded-xl border border-slate-200 bg-black"
                            src={mediaUrl(video.video)}
                        />
                    ))
                )}
            </Card>

            <Card className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Question answers</h2>
                <p className="text-sm text-slate-600">
                    Responses submitted by the candidate for each interview question.
                </p>
                <AnswerReviewPanel answers={answers} questions={questions} />
            </Card>

            {questions.length > 0 && answers.length === 0 && session.status === "scheduled" ? (
                <Card className="border-amber-200 bg-amber-50/50">
                    <p className="text-sm text-amber-900">
                        This interview has not started yet. The candidate must open their interview from{" "}
                        <Link to="/candidate/interviews" className="font-medium underline">
                            My interviews
                        </Link>{" "}
                        and submit answers before they appear here.
                    </p>
                </Card>
            ) : null}
        </div>
    );
}
