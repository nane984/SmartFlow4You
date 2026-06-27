import { mediaUrl } from "../../util/mediaUrl";
import type { AnswerReview } from "./candidateDetail.api";
import type { RoomQuestion } from "./interviewRoom.types";

function optionLabel(question: RoomQuestion | undefined, key: string | null | undefined): string {
    if (!key || !question) return key ?? "—";
    if (key === "option_1") return question.option_1 ?? "Option 1";
    if (key === "option_2") return question.option_2 ?? "Option 2";
    if (key === "option_3") return question.option_3 ?? "Option 3";
    return key;
}

type AnswerReviewPanelProps = {
    answers: AnswerReview[];
    questions?: RoomQuestion[];
};

export default function AnswerReviewPanel({ answers, questions = [] }: AnswerReviewPanelProps) {
    if (answers.length === 0) {
        return <p className="text-sm text-slate-500">No submitted answers for this session yet.</p>;
    }

    const questionById = new Map(questions.map((q) => [q.id, q]));

    return (
        <ul className="space-y-3">
            {answers.map((answer) => {
                const question = questionById.get(answer.question);
                const mediaSrc = mediaUrl(answer.media_file_url ?? answer.media_file ?? null);

                return (
                    <li
                        key={answer.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                    >
                        <p className="text-sm font-medium text-slate-900">{answer.question_text}</p>
                        <p className="mt-1 text-xs capitalize text-slate-500">
                            {answer.response_type?.replace("_", " ") ?? "answer"}
                        </p>

                        {answer.response_type === "multiple_choice" ? (
                            <div className="mt-2 space-y-1 text-sm text-slate-700">
                                <p>
                                    Selected:{" "}
                                    <span className="font-medium">
                                        {optionLabel(question, answer.selected_answer)}
                                    </span>
                                </p>
                                {answer.correct_answer ? (
                                    <p>
                                        Correct:{" "}
                                        <span className="font-medium">
                                            {optionLabel(question, answer.correct_answer)}
                                        </span>
                                    </p>
                                ) : null}
                                {answer.is_correct != null ? (
                                    <span
                                        className={
                                            answer.is_correct
                                                ? "mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                                                : "mt-1 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700"
                                        }
                                    >
                                        {answer.is_correct ? "Correct" : "Incorrect"}
                                    </span>
                                ) : null}
                            </div>
                        ) : null}

                        {answer.response_type === "text" ? (
                            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                                {answer.text_response?.trim() || "—"}
                            </p>
                        ) : null}

                        {answer.response_type === "video" && mediaSrc ? (
                            <video
                                controls
                                className="mt-3 w-full max-w-2xl rounded-xl border border-slate-200 bg-black"
                                src={mediaSrc}
                            />
                        ) : null}

                        {answer.response_type === "audio" && mediaSrc ? (
                            <audio controls className="mt-3 w-full max-w-xl" src={mediaSrc} />
                        ) : null}

                        {(answer.response_type === "video" || answer.response_type === "audio") &&
                        !mediaSrc ? (
                            <p className="mt-2 text-sm text-slate-500">No media uploaded for this question.</p>
                        ) : null}

                        {answer.answered_at ? (
                            <p className="mt-2 text-xs text-slate-500">
                                Answered {new Date(answer.answered_at).toLocaleString()}
                            </p>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}
