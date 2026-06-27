import { useCallback, useRef, useState } from "react";
import Button from "../../components/ui/Button";
import { controlClass } from "../../components/ui/inputStyles";
import { uploadQuestionAnswerMedia } from "./interviewRoom.api";
import type { AnswerChoice, RoomQuestion } from "./interviewRoom.types";

const OPTION_KEYS: { key: AnswerChoice; labelKey: keyof RoomQuestion }[] = [
    { key: "option_1", labelKey: "option_1" },
    { key: "option_2", labelKey: "option_2" },
    { key: "option_3", labelKey: "option_3" },
];

type Props = {
    sessionId: number;
    question: RoomQuestion;
    index: number;
    disabled: boolean;
    mcAnswer?: AnswerChoice;
    textAnswer: string;
    mediaUploaded: boolean;
    onMcChange: (value: AnswerChoice) => void;
    onTextChange: (value: string) => void;
    onMediaUploaded: () => void;
};

function pickAudioMimeType(): string | undefined {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

function pickVideoMimeType(): string | undefined {
    const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export default function InterviewQuestionAnswer({
    sessionId,
    question,
    index,
    disabled,
    mcAnswer,
    textAnswer,
    mediaUploaded,
    onMcChange,
    onTextChange,
    onMediaUploaded,
}: Props) {
    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    const handleRecord = async () => {
        setMediaError(null);
        try {
            const isVideo = question.response_type === "video";
            const stream = await navigator.mediaDevices.getUserMedia(
                isVideo ? { video: true, audio: true } : { audio: true }
            );
            streamRef.current = stream;
            const mimeType = isVideo ? pickVideoMimeType() : pickAudioMimeType();
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.onstop = async () => {
                stopStream();
                const blob = new Blob(chunksRef.current, {
                    type: mimeType || (isVideo ? "video/webm" : "audio/webm"),
                });
                const ext = isVideo ? "webm" : "webm";
                setUploading(true);
                try {
                    await uploadQuestionAnswerMedia(
                        sessionId,
                        question.id,
                        blob,
                        `answer-q${question.id}.${ext}`
                    );
                    onMediaUploaded();
                } catch (e) {
                    setMediaError(e instanceof Error ? e.message : "Upload failed.");
                } finally {
                    setUploading(false);
                }
            };
            recorderRef.current = recorder;
            recorder.start();
            setRecording(true);
        } catch {
            setMediaError("Could not access camera/microphone.");
        }
    };

    const handleStopRecord = () => {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        }
        recorderRef.current = null;
        setRecording(false);
    };

    return (
        <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-900">
                {index + 1}. {question.text}
            </p>
            <p className="mt-1 text-xs capitalize text-slate-500">{question.response_type.replace("_", " ")}</p>

            {question.response_type === "multiple_choice" ? (
                <fieldset className="mt-3 space-y-2">
                    {OPTION_KEYS.map(({ key, labelKey }) => (
                        <label
                            key={key}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 hover:bg-slate-50 has-[:checked]:border-brand-200 has-[:checked]:bg-brand-50/50"
                        >
                            <input
                                type="radio"
                                name={`q-${question.id}`}
                                className="mt-1 text-brand-600 focus:ring-brand-500"
                                checked={mcAnswer === key}
                                onChange={() => onMcChange(key)}
                                disabled={disabled}
                            />
                            <span className="text-sm text-slate-800">{question[labelKey] as string}</span>
                        </label>
                    ))}
                </fieldset>
            ) : null}

            {question.response_type === "text" ? (
                <textarea
                    className={`${controlClass} mt-3 min-h-[100px]`}
                    value={textAnswer}
                    onChange={(e) => onTextChange(e.target.value)}
                    disabled={disabled}
                    placeholder="Type your answer…"
                />
            ) : null}

            {question.response_type === "video" || question.response_type === "audio" ? (
                <div className="mt-3 space-y-2">
                    {!mediaUploaded ? (
                        <div className="flex flex-wrap gap-2">
                            {!recording ? (
                                <Button type="button" size="sm" disabled={disabled || uploading} onClick={() => void handleRecord()}>
                                    Record {question.response_type}
                                </Button>
                            ) : (
                                <Button type="button" size="sm" variant="danger" onClick={handleStopRecord}>
                                    Stop & upload
                                </Button>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-emerald-700">Recording uploaded.</p>
                    )}
                    {uploading ? <p className="text-sm text-slate-600">Uploading…</p> : null}
                    {mediaError ? <p className="text-sm text-rose-600">{mediaError}</p> : null}
                </div>
            ) : null}
        </li>
    );
}
