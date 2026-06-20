import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Company } from "../../modules/companies/company.type";
import { getCompanies } from "../../modules/companies/company.api";
import {
    TENDER_VISIBILITY,
    TENDER_VISIBILITY_LABELS,
} from "../../modules/procurement/constants";
import type { TenderCreatePayload, TenderInputSource } from "../../pages/tenders/tenderTypes";
import { createTender, getTenderById, updateTender } from "../../pages/tenders/tenderApi";
import { isoToDatetimeLocal } from "../../util/datetimeLocal";
import { documentFileName, resolveMediaUrl } from "../../util/mediaUrl";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Field from "../ui/Field";
import { controlClass } from "../ui/inputStyles";

const INPUT_SOURCES: { value: TenderInputSource; label: string }[] = [
    { value: "manual", label: "Manual" },
    { value: "email", label: "Email" },
    { value: "api", label: "API" },
];

const DOC_ACCEPT =
    ".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function emptyPayload(): TenderCreatePayload {
    return {
        title: "",
        description: "",
        investor: 0,
        deadline: "",
        status: "draft",
        source: "manual",
        external_id: "",
        source_url: "",
        tender_type: "",
        visibility: "public",
        analysis_notes: "",
    };
}

type TenderFormState = TenderCreatePayload & { document: File | null };

function emptyForm(): TenderFormState {
    return { ...emptyPayload(), document: null };
}

function formatSubmitError(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const d = err.response?.data;
        if (d == null) return err.message || "Could not save tender.";
        if (typeof d === "string") return d;
        if (typeof d === "object") {
            const parts: string[] = [];
            for (const [k, v] of Object.entries(d)) {
                if (v == null) continue;
                parts.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
            }
            if (parts.length) return parts.join(" ");
            return JSON.stringify(d);
        }
    }
    return "Could not save tender.";
}

type TenderFormProps = {
    heading?: string;
    subheading?: string;
    /** When set, form loads existing tender and updates on submit. */
    tenderId?: number;
};

export default function TenderForm({
    heading,
    subheading,
    tenderId,
}: TenderFormProps) {
    const isEdit = tenderId != null && tenderId > 0;
    const navigate = useNavigate();
    const [form, setForm] = useState<TenderFormState>(emptyForm);
    const [existingDocumentUrl, setExistingDocumentUrl] = useState<string | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    useEffect(() => {
        void getCompanies().then(setCompanies);
    }, []);

    useEffect(() => {
        if (!isEdit || !tenderId) return;
        setLoading(true);
        void getTenderById(tenderId)
            .then((t) => {
                setForm({
                    title: t.title,
                    description: t.description,
                    investor: t.investor,
                    deadline: isoToDatetimeLocal(t.deadline),
                    status: t.status,
                    source: (t.source || "manual") as TenderInputSource,
                    external_id: t.external_id ?? "",
                    source_url: t.source_url ?? "",
                    tender_type: t.tender_type ?? "",
                    visibility: t.visibility ?? "public",
                    analysis_notes: t.analysis_notes ?? "",
                    document: null,
                });
                setExistingDocumentUrl(t.document ?? null);
            })
            .catch(() => setError("Could not load tender."))
            .finally(() => setLoading(false));
    }, [isEdit, tenderId]);

    const investors = companies.filter((c) => c.company_type === "investor");

    const change =
        (field: keyof TenderCreatePayload) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const v = e.target.value;
            setForm((prev) => ({
                ...prev,
                [field]:
                    field === "investor"
                        ? Number(v)
                        : field === "source"
                          ? (v as TenderInputSource)
                          : v,
            }));
        };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!form.investor) {
            setError("Select an investor company.");
            return;
        }
        if (!form.deadline.trim()) {
            setError("Deadline is required.");
            return;
        }
        if (Number.isNaN(new Date(form.deadline).getTime())) {
            setError("Enter a valid deadline.");
            return;
        }
        setSaving(true);
        try {
            const { document, ...payload } = form;
            if (isEdit && tenderId) {
                await updateTender(tenderId, payload, document);
                setSuccess("Tender updated successfully.");
                window.setTimeout(() => navigate(`/tenders/${tenderId}`), 1200);
            } else {
                await createTender(payload, document);
                setSuccess("Tender created successfully.");
                window.setTimeout(() => navigate("/tenders"), 1600);
            }
        } catch (err) {
            setError(formatSubmitError(err));
        } finally {
            setSaving(false);
        }
    };

    const selectCompanies = investors.length > 0 ? investors : companies;

    if (loading) {
        return (
            <Card className="max-w-2xl">
                <p className="text-sm text-slate-600">Loading tender…</p>
            </Card>
        );
    }

    const resolvedHeading = heading ?? (isEdit ? "Edit tender" : "Create tender");

    return (
        <Card className="max-w-2xl">
            <div className="mb-4 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-semibold text-slate-900">{resolvedHeading}</h2>
                {subheading && <p className="mt-1 text-sm text-slate-600">{subheading}</p>}
            </div>
            {success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            )}
            <form className="space-y-5" onSubmit={handleSubmit}>
                <Field label="Title">
                    <input
                        className={controlClass}
                        value={form.title}
                        onChange={change("title")}
                        placeholder="Tender title"
                        required
                    />
                </Field>

                <Field label="Investor">
                    <select
                        className={controlClass}
                        value={form.investor || ""}
                        onChange={change("investor")}
                        required
                    >
                        <option value="">Select company…</option>
                        {selectCompanies.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                                {c.company_type ? ` (${c.company_type})` : ""}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Deadline">
                    <input
                        className={controlClass}
                        type="datetime-local"
                        value={form.deadline}
                        onChange={change("deadline")}
                        required
                    />
                </Field>

                <Field label="Status">
                    <select className={controlClass} value={form.status} onChange={change("status")}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="evaluation">Evaluation</option>
                        <option value="closed">Closed</option>
                        <option value="awarded">Awarded</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </Field>

                <Field label="Visibility (analysis)">
                    <select className={controlClass} value={form.visibility ?? "public"} onChange={change("visibility")}>
                        {TENDER_VISIBILITY.map((v) => (
                            <option key={v} value={v}>
                                {TENDER_VISIBILITY_LABELS[v]}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Analysis notes" hint="Optional — for AI / categorization layer.">
                    <textarea
                        className={`${controlClass} min-h-[72px] resize-y`}
                        value={form.analysis_notes ?? ""}
                        onChange={change("analysis_notes")}
                        rows={2}
                    />
                </Field>

                <Field label="Upload Document" hint="PDF, Excel (.xls, .xlsx), or Word (.doc, .docx). Optional.">
                    {existingDocumentUrl && !form.document ? (
                        <p className="mb-2 text-sm text-slate-600">
                            Current file:{" "}
                            <a
                                href={resolveMediaUrl(existingDocumentUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-brand-700 hover:underline"
                            >
                                {documentFileName(existingDocumentUrl)}
                            </a>
                            {" · "}
                            Upload a new file below to replace it.
                        </p>
                    ) : null}
                    <input
                        className={`${controlClass} cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200`}
                        type="file"
                        accept={DOC_ACCEPT}
                        onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setForm((prev) => ({ ...prev, document: f }));
                        }}
                    />
                    {form.document && (
                        <p className="mt-2 text-sm text-slate-600">
                            Selected file: <span className="font-medium text-slate-800">{form.document.name}</span>
                        </p>
                    )}
                </Field>

                <Field label="Input source">
                    <select className={controlClass} value={form.source} onChange={change("source")}>
                        {INPUT_SOURCES.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="External ID" hint="Optional — reference from another system.">
                    <input
                        className={controlClass}
                        value={form.external_id}
                        onChange={change("external_id")}
                        placeholder="e.g. portal-ref-12345"
                    />
                </Field>

                <Field label="Source URL" hint="Optional — link to original listing.">
                    <input
                        className={controlClass}
                        type="url"
                        value={form.source_url}
                        onChange={change("source_url")}
                        placeholder="https://…"
                    />
                </Field>

                <Field label="Tender type" hint="Optional — e.g. public, private.">
                    <input
                        className={controlClass}
                        value={form.tender_type}
                        onChange={change("tender_type")}
                        placeholder="public / private"
                    />
                </Field>

                <Field label="Description">
                    <textarea
                        className={`${controlClass} min-h-[120px] resize-y`}
                        value={form.description}
                        onChange={change("description")}
                        placeholder="Scope and requirements"
                        rows={5}
                    />
                </Field>

                <div className="flex flex-wrap gap-2 pt-2">
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving…" : isEdit ? "Update tender" : "Save tender"}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate(isEdit && tenderId ? `/tenders/${tenderId}` : "/tenders")}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    );
}
