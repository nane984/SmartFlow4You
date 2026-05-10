import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { cn } from "../../components/ui/cn";
import {
    completeInterviewSession,
    getInterviewQuestions,
    getInterviewSession,
    startInterviewSession,
    submitInterviewAnswers,
    uploadInterviewVideo,
} from "./interviewRoom.api";
import type { AnswerChoice, InterviewSession, RoomQuestion } from "./interviewRoom.types";

function pickRecorderMimeType(): string | undefined {
    const candidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
    ];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

function extensionForMime(mime: string): string {
    if (mime.includes("webm")) return "webm";
    if (mime.includes("mp4")) return "mp4";
    return "webm";
}

const OPTION_KEYS: { key: AnswerChoice; labelKey: keyof RoomQuestion }[] = [
    { key: "option_1", labelKey: "option_1" },
    { key: "option_2", labelKey: "option_2" },
    { key: "option_3", labelKey: "option_3" },
];

export default function InterviewRoom() {
    const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
    const sessionId = sessionIdParam ? Number.parseInt(sessionIdParam, 10) : NaN;

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [questions, setQuestions] = useState<RoomQuestion[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [tabHidden, setTabHidden] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);

    const [cameraOn, setCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

    const [answers, setAnswers] = useState<Partial<Record<number, AnswerChoice>>>({});
    const [answersSubmitted, setAnswersSubmitted] = useState(false);
    const [answersError, setAnswersError] = useState<string | null>(null);

    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadDone, setUploadDone] = useState(false);
    const [completeDone, setCompleteDone] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setTimerRemaining(null);
    }, []);

    const stopCamera = useCallback(() => {
        recorderRef.current?.stop();
        recorderRef.current = null;
        stopTimer();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraOn(false);
        setIsRecording(false);
    }, [stopTimer]);

    const stopRecordingInternal = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        }
        recorderRef.current = null;
        setIsRecording(false);
        stopTimer();
    }, [stopTimer]);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    useEffect(() => {
        const onVis = () => {
            const hidden = document.visibilityState === "hidden";
            setTabHidden(hidden);
            if (hidden) {
                setTabSwitchCount((c) => c + 1);
            }
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    const loadRoom = useCallback(async () => {
        if (!Number.isFinite(sessionId) || sessionId < 1) return;
        setLoadError(null);
        try {
            const [s, q] = await Promise.all([
                getInterviewSession(sessionId),
                getInterviewQuestions(sessionId),
            ]);
            setSession(s);
            setQuestions(q);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Failed to load interview.");
        }
    }, [sessionId]);

    useEffect(() => {
        void loadRoom();
    }, [loadRoom]);

    const handleBeginInterview = async () => {
        if (!Number.isFinite(sessionId)) return;
        setBusy(true);
        setActionMessage(null);
        try {
            const s = await startInterviewSession(sessionId);
            setSession(s);
            setActionMessage("Interview started. Enable your camera when you are ready.");
        } catch (e) {
            setActionMessage(e instanceof Error ? e.message : "Could not start interview.");
        } finally {
            setBusy(false);
        }
    };

    const startCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            const el = videoRef.current;
            if (el) {
                el.srcObject = stream;
                await el.play();
            }
            setCameraOn(true);
        } catch (e) {
            setCameraError(e instanceof Error ? e.message : "Could not access camera or microphone.");
        }
    };

    const startRecordingWithTimer = () => {
        const stream = streamRef.current;
        if (!stream || !session) return;

        chunksRef.current = [];
        const mimeType = pickRecorderMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

        recorder.ondataavailable = (ev) => {
            if (ev.data.size > 0) {
                chunksRef.current.push(ev.data);
            }
        };

        recorder.onstop = () => {
            const type = recorder.mimeType || "video/webm";
            const blob = new Blob(chunksRef.current, { type });
            setRecordedBlob(blob);
        };

        recorder.start(250);
        recorderRef.current = recorder;
        setIsRecording(true);
        setRecordedBlob(null);
        setUploadDone(false);
        setUploadError(null);

        const total = Math.max(1, session.duration_seconds);
        setTimerRemaining(total);

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
            setTimerRemaining((prev) => {
                if (prev === null) return null;
                if (prev <= 1) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    const r = recorderRef.current;
                    if (r && r.state !== "inactive") {
                        r.stop();
                    }
                    recorderRef.current = null;
                    setIsRecording(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleUploadVideo = async () => {
        if (!recordedBlob || !Number.isFinite(sessionId)) return;
        setBusy(true);
        setUploadError(null);
        try {
            const ext = extensionForMime(recordedBlob.type);
            await uploadInterviewVideo(sessionId, recordedBlob, `interview-recording.${ext}`);
            setUploadDone(true);
            setActionMessage("Video uploaded successfully.");
        } catch (e) {
            setUploadError(e instanceof Error ? e.message : "Upload failed.");
        } finally {
            setBusy(false);
        }
    };

    const handleSubmitAnswers = async () => {
        if (!Number.isFinite(sessionId) || questions.length === 0) {
            setAnswersError("No questions to submit.");
            return;
        }
        const missing = questions.filter((q) => !answers[q.id]);
        if (missing.length > 0) {
            setAnswersError(`Please answer all questions (${missing.length} missing).`);
            return;
        }
        setBusy(true);
        setAnswersError(null);
        try {
            const payload = questions.map((q) => ({
                question: q.id,
                selected_answer: answers[q.id]!,
            }));
            await submitInterviewAnswers(sessionId, payload);
            setAnswersSubmitted(true);
            setActionMessage("Answers saved.");
        } catch (e) {
            setAnswersError(e instanceof Error ? e.message : "Failed to submit answers.");
        } finally {
            setBusy(false);
        }
    };

    const handleComplete = async () => {
        if (!Number.isFinite(sessionId)) return;
        setBusy(true);
        try {
            const s = await completeInterviewSession(sessionId);
            setSession(s);
            setCompleteDone(true);
            stopCamera();
            setActionMessage("Interview marked as completed.");
        } catch (e) {
            setActionMessage(e instanceof Error ? e.message : "Could not complete interview.");
        } finally {
            setBusy(false);
        }
    };

    if (!Number.isFinite(sessionId) || sessionId < 1) {
        return (
            <Card className="max-w-lg border-amber-200/80 bg-amber-50/50">
                <p className="text-sm text-amber-900">Invalid session id in URL.</p>
                <Link to="/hr-dashboard" className="mt-3 inline-block text-sm font-medium text-brand-800 underline">
                    Back to HR
                </Link>
            </Card>
        );
    }

    if (loadError) {
        return (
            <Card className="max-w-lg border-rose-200">
                <p className="text-sm text-rose-800">{loadError}</p>
                <Button type="button" variant="secondary" className="mt-4" onClick={() => void loadRoom()}>
                    Retry
                </Button>
                <Link to="/hr-dashboard" className="ml-3 text-sm font-medium text-brand-800 underline">
                    Back to HR
                </Link>
            </Card>
        );
    }

    if (!session) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <p className="text-sm text-slate-600">Loading interview room…</p>
            </div>
        );
    }

    const canRecord = session.status === "in_progress";
    const isTerminal = session.status === "completed" || session.status === "cancelled";
    const canAnswer = session.status === "in_progress";

    return (
        <div className="space-y-6">
            <PageHeader
                title="Interview room"
                description={`Session #${session.id} · CV #${session.cv} · ${session.duration_seconds}s allotted for recording`}
                actions={
                    <LinkButton to="/hr-dashboard" variant="secondary" size="sm">
                        ← HR home
                    </LinkButton>
                }
            />

            {tabHidden && (
                <div
                    className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
                    role="status"
                >
                    <strong className="font-semibold">Tab hidden.</strong> Stay on this tab during the interview.
                    {tabSwitchCount > 0 && (
                        <span className="ml-1 text-amber-900/90">(Visibility changes recorded: {tabSwitchCount})</span>
                    )}
                </div>
            )}

            {actionMessage && (
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-950">
                    {actionMessage}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Session</h2>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-slate-500">Status</dt>
                        <dd className="font-medium capitalize text-slate-900">{session.status.replace("_", " ")}</dd>
                        <dt className="text-slate-500">Starts</dt>
                        <dd className="text-slate-800">{new Date(session.start_time).toLocaleString()}</dd>
                    </dl>

                    {session.status === "scheduled" && (
                        <Button type="button" onClick={() => void handleBeginInterview()} disabled={busy}>
                            Begin interview
                        </Button>
                    )}

                    {isTerminal && (
                        <p className="text-sm text-slate-600">
                            This session is closed. Recording and uploads are no longer available.
                        </p>
                    )}
                </Card>

                <Card
                    className={cn(
                        "flex flex-col items-center justify-center border-2 py-10",
                        timerRemaining !== null && timerRemaining <= 10 && isRecording
                            ? "border-rose-300 bg-rose-50/40"
                            : "border-slate-200 bg-slate-50/60"
                    )}
                >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Timer</p>
                    <p
                        className={cn(
                            "mt-2 font-mono text-5xl font-bold tabular-nums",
                            timerRemaining !== null && timerRemaining <= 10 ? "text-rose-700" : "text-slate-900"
                        )}
                    >
                        {timerRemaining === null ? "—" : `${timerRemaining}s`}
                    </p>
                    <p className="mt-2 max-w-xs text-center text-xs text-slate-500">
                        Starts with recording. At 0s the recording stops automatically.
                    </p>
                </Card>
            </div>

            <Card className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Video</h2>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner">
                    <video
                        ref={videoRef}
                        className="aspect-video w-full object-cover"
                        muted
                        playsInline
                    />
                </div>
                {cameraError && (
                    <p className="text-sm text-rose-600" role="alert">
                        {cameraError}
                    </p>
                )}
                <div className="flex flex-wrap gap-2">
                    {!cameraOn ? (
                        <Button type="button" variant="primary" onClick={() => void startCamera()} disabled={!canRecord || isTerminal}>
                            Enable camera
                        </Button>
                    ) : (
                        <Button type="button" variant="secondary" onClick={stopCamera} disabled={isRecording}>
                            Stop camera
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="primary"
                        onClick={startRecordingWithTimer}
                        disabled={!cameraOn || isRecording || !canRecord || isTerminal}
                    >
                        Start recording & timer
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={stopRecordingInternal}
                        disabled={!isRecording}
                    >
                        Stop recording early
                    </Button>
                </div>
                {recordedBlob && (
                    <p className="text-sm text-slate-600">
                        Clip ready: {(recordedBlob.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                )}
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void handleUploadVideo()}
                        disabled={!recordedBlob || !canRecord || busy || uploadDone}
                    >
                        {uploadDone ? "Video uploaded" : "Upload recording"}
                    </Button>
                    {uploadError && (
                        <p className="w-full text-sm text-rose-600" role="alert">
                            {uploadError}
                        </p>
                    )}
                </div>
            </Card>

            <Card className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Knowledge check</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Select one answer per question, then submit. You can submit before or after your video.
                    </p>
                </div>

                {questions.length === 0 ? (
                    <p className="text-sm text-slate-500">No questions are linked to this session yet.</p>
                ) : (
                    <ul className="space-y-6">
                        {questions.map((q, idx) => (
                            <li key={q.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm font-medium text-slate-900">
                                    {idx + 1}. {q.text}
                                </p>
                                <fieldset className="mt-3 space-y-2">
                                    {OPTION_KEYS.map(({ key, labelKey }) => (
                                        <label
                                            key={key}
                                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 hover:bg-slate-50 has-[:checked]:border-brand-200 has-[:checked]:bg-brand-50/50"
                                        >
                                            <input
                                                type="radio"
                                                name={`q-${q.id}`}
                                                className="mt-1 text-brand-600 focus:ring-brand-500"
                                                checked={answers[q.id] === key}
                                                onChange={() =>
                                                    setAnswers((prev) => ({
                                                        ...prev,
                                                        [q.id]: key,
                                                    }))
                                                }
                                                disabled={answersSubmitted || isTerminal || !canAnswer}
                                            />
                                            <span className="text-sm text-slate-800">{q[labelKey]}</span>
                                        </label>
                                    ))}
                                </fieldset>
                            </li>
                        ))}
                    </ul>
                )}

                {answersError && (
                    <p className="text-sm text-rose-600" role="alert">
                        {answersError}
                    </p>
                )}
                <Button
                    type="button"
                    onClick={() => void handleSubmitAnswers()}
                    disabled={
                        questions.length === 0 || answersSubmitted || busy || isTerminal || !canAnswer
                    }
                >
                    {answersSubmitted ? "Answers submitted" : "Submit answers"}
                </Button>
            </Card>

            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Finish</h2>
                    <p className="text-sm text-slate-600">
                        After uploading your video (while the session is still in progress), mark the interview
                        complete.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="primary"
                    onClick={() => void handleComplete()}
                    disabled={!canRecord || completeDone || busy}
                >
                    {completeDone ? "Completed" : "Mark interview complete"}
                </Button>
            </Card>
        </div>
    );
}
