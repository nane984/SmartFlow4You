import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import LinkButton from "../../components/ui/LinkButton";
import {
    applicationStatusBadgeClass,
    applicationStatusLabel,
} from "../../modules/hr/applicationStatus";
import AnswerReviewPanel from "./AnswerReviewPanel";
import type { CV } from "./cv.types";
import type { InterviewSession, RoomQuestion } from "./interviewRoom.types";
import {
    getCvById,
    getCvFileBlob,
    getInterviewSessions,
    getJobPosts,
    getSessionAnswersReview,
    getSessionVideos,
    type AnswerReview,
    type VideoSubmission,
} from "./candidateDetail.api";
import { getInterviewQuestions } from "./interviewRoom.api";
import { mediaUrl } from "../../util/mediaUrl";

type SessionExtras = {
    videos: VideoSubmission[];
    answers: AnswerReview[];
    questions: RoomQuestion[];
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

function cvFileName(url: string): string {
    const segment = url.split("/").pop()?.split("?")[0] ?? "";
    try {
        return decodeURIComponent(segment) || "CV document";
    } catch {
        return segment || "CV document";
    }
}

function isPdfCv(url: string): boolean {
    return /\.pdf($|\?)/i.test(url);
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
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);
    const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);

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
                            const [videos, answers, questions] = await Promise.all([
                                getSessionVideos(session.id),
                                getSessionAnswersReview(session.id),
                                getInterviewQuestions(session.id),
                            ]);
                            return [session.id, { videos, answers, questions }] as const;
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

    const cvFileUrl = cv?.file ? toAbsoluteMedia(cv.file) : null;
    const cvIsPdf = cvFileUrl ? isPdfCv(cvFileUrl) : false;

    useEffect(() => {
        if (!cv || !cvIsPdf) {
            setPdfPreviewUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return null;
            });
            setPdfPreviewError(null);
            setPdfPreviewLoading(false);
            return;
        }

        let cancelled = false;

        void (async () => {
            setPdfPreviewLoading(true);
            setPdfPreviewError(null);
            try {
                const blob = await getCvFileBlob(cv.id);
                if (cancelled) return;
                const objectUrl = URL.createObjectURL(blob);
                setPdfPreviewUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return objectUrl;
                });
            } catch {
                if (!cancelled) {
                    setPdfPreviewError("Could not load CV preview. Use Download CV instead.");
                    setPdfPreviewUrl((current) => {
                        if (current) URL.revokeObjectURL(current);
                        return null;
                    });
                }
            } finally {
                if (!cancelled) setPdfPreviewLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            setPdfPreviewUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return null;
            });
        };
    }, [cv, cvIsPdf]);

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
                    <LinkButton to="/dashboard" variant="secondary" size="sm">
                        Back to dashboard
                    </LinkButton>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={cv.aplicant_name}
                description="Application details, CV document, and interview review."
                actions={
                    <LinkButton to="/dashboard" variant="secondary" size="sm">
                        Back to dashboard
                    </LinkButton>
                }
            />

            <Card>
                <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <dt className="font-medium text-slate-500">Applicant name</dt>
                        <dd className="mt-1 text-slate-900">{cv.aplicant_name}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Job post</dt>
                        <dd className="mt-1 text-slate-900">{jobTitle}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Applied</dt>
                        <dd className="mt-1 text-slate-900">{formatDate(cv.submitted_at ?? null)}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Status</dt>
                        <dd className="mt-1">
                            <span className={applicationStatusBadgeClass(cv.status)}>
                                {cv.status_label ?? applicationStatusLabel(cv.status)}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Processed</dt>
                        <dd className="mt-1 text-slate-900">{cv.processed ? "Yes" : "No"}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">CV score</dt>
                        <dd className="mt-1 text-slate-900">{cv.score ?? "—"}</dd>
                    </div>
                </dl>
            </Card>

            <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Submitted CV</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            {cvFileUrl ? cvFileName(cvFileUrl) : "No file uploaded for this application."}
                        </p>
                    </div>
                    {cvFileUrl ? (
                        <a
                            href={cvFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
                        >
                            Download CV
                        </a>
                    ) : null}
                </div>
                {cvFileUrl ? (
                    cvIsPdf ? (
                        pdfPreviewLoading ? (
                            <p className="text-sm text-slate-600">Loading CV preview…</p>
                        ) : pdfPreviewError ? (
                            <p className="text-sm text-rose-700">{pdfPreviewError}</p>
                        ) : pdfPreviewUrl ? (
                            <iframe
                                title={`CV — ${cv.aplicant_name}`}
                                src={pdfPreviewUrl}
                                className="h-[min(70vh,720px)] w-full rounded-xl border border-slate-200 bg-white"
                            />
                        ) : null
                    ) : (
                        <p className="text-sm text-slate-600">
                            Preview is available for PDF files. Use{" "}
                            <a
                                href={cvFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-brand-700 underline"
                            >
                                Download CV
                            </a>{" "}
                            to open Word documents.
                        </p>
                    )
                ) : (
                    <p className="text-sm text-rose-700">
                        The CV file is missing from this application record.
                    </p>
                )}
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
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {sortedSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-5 text-slate-500">
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
            </Card>

            {sortedSessions.map((session) => {
                const extras = sessionExtras[session.id] ?? { videos: [], answers: [], questions: [] };
                return (
                    <Card key={session.id} className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-base font-semibold text-slate-900">
                                Session #{session.id} — answers & media
                            </h3>
                            <LinkButton to={`/hr/interview/${session.id}`} variant="secondary" size="sm">
                                Full review
                            </LinkButton>
                        </div>

                        <div>
                            <h4 className="mb-2 text-sm font-medium text-slate-700">Session recording</h4>
                            {extras.videos.length === 0 ? (
                                <p className="text-sm text-slate-500">No session video uploaded yet.</p>
                            ) : (
                                extras.videos.map((video) => (
                                    <video
                                        key={video.id}
                                        controls
                                        className="w-full max-w-2xl rounded-xl border border-slate-200 bg-black"
                                        src={mediaUrl(video.video)}
                                    />
                                ))
                            )}
                        </div>

                        <div>
                            <h4 className="mb-2 text-sm font-medium text-slate-700">Question answers</h4>
                            <AnswerReviewPanel answers={extras.answers} questions={extras.questions} />
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
