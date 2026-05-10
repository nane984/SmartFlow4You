import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import LinkButton from "../../components/ui/LinkButton";
import type { CV } from "./cv.types";
import type { InterviewSession } from "./interviewRoom.types";
import {
    getCvById,
    getInterviewSessions,
    getJobPosts,
    getSessionAnswersReview,
    getSessionVideos,
    type AnswerReview,
    type VideoSubmission,
} from "./candidateDetail.api";

type SessionExtras = {
    videos: VideoSubmission[];
    answers: AnswerReview[];
};

function formatDate(value: string | null): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

function toAbsoluteMedia(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return `http://localhost:8000${url}`;
    return `http://localhost:8000/${url}`;
}

export default function CandidateDetail() {
    const { id } = useParams<{ id: string }>();
    const cvId = id ? Number.parseInt(id, 10) : NaN;
    const [cv, setCv] = useState<CV | null>(null);
    const [jobTitle, setJobTitle] = useState<string>("—");
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [sessionExtras, setSessionExtras] = useState<Record<number, SessionExtras>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!Number.isFinite(cvId) || cvId < 1) {
            setError("Invalid candidate CV id.");
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const [cvData, sessionsData, jobPosts] = await Promise.all([
                    getCvById(cvId),
                    getInterviewSessions(),
                    getJobPosts(),
                ]);

                if (cancelled) return;
                setCv(cvData);
                setSessions(sessionsData.filter((s) => s.cv === cvData.id));
                const job = jobPosts.find((jp) => jp.id === cvData.job_post);
                setJobTitle(job?.title ?? `Job #${cvData.job_post}`);

                const extrasEntries = await Promise.all(
                    sessionsData
                        .filter((s) => s.cv === cvData.id)
                        .map(async (session) => {
                            const [videos, answers] = await Promise.all([
                                getSessionVideos(session.id),
                                getSessionAnswersReview(session.id),
                            ]);
                            return [session.id, { videos, answers }] as const;
                        })
                );
                if (!cancelled) {
                    setSessionExtras(Object.fromEntries(extrasEntries));
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Failed to load candidate detail.");
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
    }, [cvId]);

    const sortedSessions = useMemo(() => {
        return [...sessions].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [sessions]);

    if (loading) {
        return (
            <Card>
                <p className="text-sm text-slate-600">Loading candidate detail...</p>
            </Card>
        );
    }

    if (error || !cv) {
        return (
            <Card>
                <p className="text-sm text-rose-700">{error ?? "Candidate CV not found."}</p>
                <div className="mt-4">
                    <LinkButton to="/hr/dashboard" variant="secondary" size="sm">
                        Back to HR Dashboard
                    </LinkButton>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Candidate Detail"
                description="Candidate profile with sessions, submitted videos, and answer review."
                actions={
                    <LinkButton to="/hr/dashboard" variant="secondary" size="sm">
                        Back to HR Dashboard
                    </LinkButton>
                }
            />

            <Card>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="font-medium text-slate-500">Applicant Name</dt>
                        <dd className="mt-1 text-slate-900">{cv.aplicant_name}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Job Post</dt>
                        <dd className="mt-1 text-slate-900">{jobTitle}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">CV Score</dt>
                        <dd className="mt-1 text-slate-900">{cv.score ?? "—"}</dd>
                    </div>
                </dl>
            </Card>

            <Card className="overflow-hidden p-0">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">Interview Sessions</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50/80">
                            <tr className="text-left text-slate-600">
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Start Time</th>
                                <th className="px-6 py-3 font-medium">End Time</th>
                                <th className="px-6 py-3 font-medium">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {sortedSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-5 text-slate-500">
                                        No interview sessions found for this candidate.
                                    </td>
                                </tr>
                            ) : (
                                sortedSessions.map((session) => (
                                    <tr key={session.id}>
                                        <td className="px-6 py-4 capitalize text-slate-900">
                                            {session.status.replace("_", " ")}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{formatDate(session.start_time)}</td>
                                        <td className="px-6 py-4 text-slate-700">{formatDate(session.end_time)}</td>
                                        <td className="px-6 py-4 text-slate-700">{session.score ?? "—"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {sortedSessions.map((session) => {
                const extras = sessionExtras[session.id] ?? { videos: [], answers: [] };
                return (
                    <Card key={session.id} className="space-y-4">
                        <h3 className="text-base font-semibold text-slate-900">
                            Session #{session.id} media and answer review
                        </h3>

                        <div>
                            <h4 className="mb-2 text-sm font-medium text-slate-700">Video Submission</h4>
                            {extras.videos.length === 0 ? (
                                <p className="text-sm text-slate-500">No video submission found.</p>
                            ) : (
                                <video
                                    controls
                                    className="w-full max-w-2xl rounded-xl border border-slate-200 bg-black"
                                    src={toAbsoluteMedia(extras.videos[0].video)}
                                />
                            )}
                        </div>

                        <div>
                            <h4 className="mb-2 text-sm font-medium text-slate-700">Answers Review</h4>
                            {extras.answers.length === 0 ? (
                                <p className="text-sm text-slate-500">No submitted answers for this session.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {extras.answers.map((a) => (
                                        <li
                                            key={a.id}
                                            className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
                                        >
                                            <p className="text-sm font-medium text-slate-900">{a.question_text}</p>
                                            <p className="mt-1 text-xs text-slate-600">
                                                Selected: <span className="font-medium">{a.selected_answer}</span>
                                                {" · "}Correct: <span className="font-medium">{a.correct_answer}</span>
                                            </p>
                                            <span
                                                className={
                                                    a.is_correct
                                                        ? "mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                                                        : "mt-1 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700"
                                                }
                                            >
                                                {a.is_correct ? "Correct" : "Incorrect"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
