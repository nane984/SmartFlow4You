import { useCallback, useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Field from "../../components/ui/Field";
import { controlClass } from "../../components/ui/inputStyles";
import {
    createJobInterviewQuestion,
    deleteJobInterviewQuestion,
    listJobInterviewQuestions,
    type InterviewQuestionType,
    type JobInterviewQuestion,
} from "./interviewQuestions.api";

const TYPE_LABELS: Record<InterviewQuestionType, string> = {
    text: "Text answer",
    video: "Video answer",
    audio: "Audio answer",
    multiple_choice: "Multiple choice",
};

type Props = {
    jobPostId: number;
    jobTitle: string;
};

const EMPTY_FORM = {
    text: "",
    response_type: "text" as InterviewQuestionType,
    option_1: "",
    option_2: "",
    option_3: "",
    correct_answer: "option_1" as "option_1" | "option_2" | "option_3",
};

export default function JobInterviewQuestionsPanel({ jobPostId, jobTitle }: Props) {
    const [questions, setQuestions] = useState<JobInterviewQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setQuestions(await listJobInterviewQuestions(jobPostId));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load interview questions.");
        } finally {
            setLoading(false);
        }
    }, [jobPostId]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleCreate = async () => {
        if (!form.text.trim()) {
            setError("Question text is required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await createJobInterviewQuestion({
                job_post: jobPostId,
                response_type: form.response_type,
                sort_order: questions.length,
                text: form.text.trim(),
                option_1: form.option_1,
                option_2: form.option_2,
                option_3: form.option_3,
                correct_answer:
                    form.response_type === "multiple_choice" ? form.correct_answer : undefined,
            });
            setForm(EMPTY_FORM);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create question.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (question: JobInterviewQuestion) => {
        if (!window.confirm(`Delete this interview question?`)) return;
        setBusyId(question.id);
        try {
            await deleteJobInterviewQuestion(question.id);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete question.");
        } finally {
            setBusyId(null);
        }
    };

    const isMc = form.response_type === "multiple_choice";

    return (
        <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
            <div>
                <h3 className="text-sm font-semibold text-slate-900">Interview questions</h3>
                <p className="mt-1 text-xs text-slate-600">
                    Templates for <span className="font-medium">{jobTitle}</span>. Copied into each
                    interview session when the candidate starts.
                </p>
            </div>

            {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <p className="text-sm text-slate-600">Loading questions…</p>
            ) : questions.length === 0 ? (
                <p className="text-sm text-slate-600">No interview questions yet for this job.</p>
            ) : (
                <ul className="space-y-2">
                    {questions.map((q, index) => (
                        <li
                            key={q.id}
                            className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                            <div>
                                <p className="font-medium text-slate-900">
                                    {index + 1}. {q.text}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {TYPE_LABELS[q.response_type]}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                disabled={busyId === q.id}
                                onClick={() => void handleDelete(q)}
                            >
                                Delete
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="space-y-3 border-t border-violet-200/80 pt-4">
                <p className="text-sm font-medium text-slate-800">Add question</p>
                <Field label="Question text">
                    <textarea
                        className={`${controlClass} min-h-[80px]`}
                        value={form.text}
                        onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))}
                    />
                </Field>
                <Field label="Answer type">
                    <select
                        className={controlClass}
                        value={form.response_type}
                        onChange={(e) =>
                            setForm((s) => ({
                                ...s,
                                response_type: e.target.value as InterviewQuestionType,
                            }))
                        }
                    >
                        {(Object.keys(TYPE_LABELS) as InterviewQuestionType[]).map((type) => (
                            <option key={type} value={type}>
                                {TYPE_LABELS[type]}
                            </option>
                        ))}
                    </select>
                </Field>
                {isMc ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Option 1">
                            <input
                                className={controlClass}
                                value={form.option_1}
                                onChange={(e) => setForm((s) => ({ ...s, option_1: e.target.value }))}
                            />
                        </Field>
                        <Field label="Option 2">
                            <input
                                className={controlClass}
                                value={form.option_2}
                                onChange={(e) => setForm((s) => ({ ...s, option_2: e.target.value }))}
                            />
                        </Field>
                        <Field label="Option 3">
                            <input
                                className={controlClass}
                                value={form.option_3}
                                onChange={(e) => setForm((s) => ({ ...s, option_3: e.target.value }))}
                            />
                        </Field>
                        <Field label="Correct option">
                            <select
                                className={controlClass}
                                value={form.correct_answer}
                                onChange={(e) =>
                                    setForm((s) => ({
                                        ...s,
                                        correct_answer: e.target.value as typeof form.correct_answer,
                                    }))
                                }
                            >
                                <option value="option_1">Option 1</option>
                                <option value="option_2">Option 2</option>
                                <option value="option_3">Option 3</option>
                            </select>
                        </Field>
                    </div>
                ) : null}
                <Button type="button" disabled={saving} onClick={() => void handleCreate()}>
                    {saving ? "Adding…" : "Add question"}
                </Button>
            </div>
        </div>
    );
}
