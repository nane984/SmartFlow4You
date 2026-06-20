import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Company } from "../companies/company.type";
import { getCompanies } from "../companies/company.api";
import { getTenders } from "../../pages/tenders/tenderApi";
import type { Tender } from "../../pages/tenders/tenderTypes";
import { formatApiErrors } from "../../util/formatApiErrors";
import { parsePriceInput } from "../../util/parsePriceInput";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import { controlClass } from "../../components/ui/inputStyles";
import { createOffer } from "./offer.api";

const DOC_ACCEPT =
    ".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export default function OfferForm() {
    const navigate = useNavigate();
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [tenderId, setTenderId] = useState<number | "">("");
    const [supplierId, setSupplierId] = useState<number | "">("");
    const [price, setPrice] = useState("");
    const [currency, setCurrency] = useState("EUR");
    const [notes, setNotes] = useState("");
    const [document, setDocument] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void Promise.all([getTenders(), getCompanies()]).then(([t, c]) => {
            setTenders(t);
            setCompanies(c);
        });
    }, []);

    const suppliers = useMemo(
        () => companies.filter((c) => (c.company_type ?? "").toLowerCase() === "supplier"),
        [companies]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!tenderId) {
            setError("Select a tender.");
            return;
        }
        if (!supplierId) {
            setError("Select a supplier company.");
            return;
        }
        const parsedPrice = parsePriceInput(price);
        if (price.trim() && parsedPrice === null) {
            setError("Enter a valid price amount.");
            return;
        }
        setSaving(true);
        try {
            await createOffer(
                {
                    tender_id: tenderId,
                    supplier_id: supplierId,
                    total_amount: parsedPrice ?? undefined,
                    currency,
                    notes: notes.trim() || undefined,
                },
                document
            );
            navigate("/offers");
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data) {
                setError(formatApiErrors(err.response.data));
            } else {
                setError("Could not create offer.");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="max-w-2xl">
            {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            )}
            <form className="space-y-5" onSubmit={handleSubmit}>
                <Field label="Tender">
                    <select
                        className={controlClass}
                        value={tenderId === "" ? "" : String(tenderId)}
                        onChange={(e) =>
                            setTenderId(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                    >
                        <option value="">Select tender…</option>
                        {tenders.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Supplier">
                    <select
                        className={controlClass}
                        value={supplierId === "" ? "" : String(supplierId)}
                        onChange={(e) =>
                            setSupplierId(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                    >
                        <option value="">Select supplier…</option>
                        {suppliers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {suppliers.length === 0 ? (
                        <p className="mt-1 text-xs text-amber-800">
                            No supplier companies yet. Add one under Companies with type Supplier.
                        </p>
                    ) : null}
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Total amount (optional)">
                        <input
                            className={controlClass}
                            type="number"
                            min={0}
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="e.g. 125000"
                        />
                    </Field>
                    <Field label="Currency">
                        <select
                            className={controlClass}
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="RSD">RSD</option>
                        </select>
                    </Field>
                </div>

                <Field label="Offer document" hint="PDF, Excel, or Word. Optional.">
                    <input
                        className={`${controlClass} cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm`}
                        type="file"
                        accept={DOC_ACCEPT}
                        onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
                    />
                    {document ? (
                        <p className="mt-1 text-xs text-slate-600">Selected: {document.name}</p>
                    ) : null}
                </Field>

                <Field label="Notes">
                    <textarea
                        className={`${controlClass} min-h-[80px] resize-y`}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Optional notes for this offer"
                    />
                </Field>

                <div className="flex flex-wrap gap-2 pt-2">
                    <Button type="submit" disabled={saving}>
                        {saving ? "Submitting…" : "Submit offer"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => navigate("/offers")}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    );
}
