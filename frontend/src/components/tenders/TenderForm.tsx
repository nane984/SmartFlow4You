import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Company } from "../../modules/companies/company.type";
import { getCompanies } from "../../modules/companies/company.api";
import type { TenderCreatePayload, TenderInputSource } from "../../pages/tenders/tenderTypes";
import { createTender } from "../../pages/tenders/tenderApi";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Field from "../ui/Field";
import { controlClass } from "../ui/inputStyles";

const INPUT_SOURCES: { value: TenderInputSource; label: string }[] = [
    { value: "manual", label: "Manual" },
    { value: "email", label: "Email" },
    { value: "api", label: "API" },
];

const emptyPayload = (): TenderCreatePayload => ({
    title: "",
    description: "",
    investor: 0,
    deadline: "",
    status: "draft",
    source: "manual",
    external_id: "",
    source_url: "",
    tender_type: "",
});

type TenderFormProps = {
    heading?: string;
    subheading?: string;
};

export default function TenderForm({ heading = "Create tender", subheading }: TenderFormProps) {
    const navigate = useNavigate();
    const [form, setForm] = useState<TenderCreatePayload>(emptyPayload);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void getCompanies().then(setCompanies);
    }, []);

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
        if (!form.investor) {
            setError("Select an investor company.");
            return;
        }
        setSaving(true);
        try {
            await createTender(form);
            navigate("/tenders");
        } catch (err) {
            const msg =
                err && typeof err === "object" && "response" in err
                    ? JSON.stringify((err as { response?: { data?: unknown } }).response?.data)
                    : "Could not save tender.";
            setError(typeof msg === "string" ? msg : "Could not save tender.");
        } finally {
            setSaving(false);
        }
    };

    const selectCompanies = investors.length > 0 ? investors : companies;

    return (
        <Card className="max-w-2xl">
            <div className="mb-4 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
                {subheading && <p className="mt-1 text-sm text-slate-600">{subheading}</p>}
            </div>
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
                        {saving ? "Saving…" : "Save tender"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => navigate("/tenders")}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    );
}
