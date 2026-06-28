import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import type { Company } from "../companies/company.type";
import { getCompanies } from "../companies/company.api";
import { getTenderById, getTenders } from "../../pages/tenders/tenderApi";
import type { TenderItem } from "../../pages/tenders/tenderTypes";
import { formatApiErrors } from "../../util/formatApiErrors";
import { parsePriceInput } from "../../util/parsePriceInput";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import { controlClass } from "../../components/ui/inputStyles";
import { createOffer, createOfferLineItems } from "./offer.api";
import BidTypeGuide from "../../components/procurement/BidTypeGuide";

const DOC_ACCEPT =
    ".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type LineRow = {
    tenderItemId: number;
    name: string;
    unit: string;
    quantity: string;
    unitPrice: string;
};

function parseQuantity(raw: string): number | null {
    const n = parsePriceInput(raw);
    if (n != null) return n;
    const direct = Number.parseFloat(raw);
    return Number.isFinite(direct) && direct >= 0 ? direct : null;
}

function lineTotal(quantity: string, unitPrice: string): number | null {
    const q = parseQuantity(quantity);
    const p = parsePriceInput(unitPrice);
    if (q == null || p == null) return null;
    return q * p;
}

function formatMoney(value: number, currency: string): string {
    try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
    } catch {
        return `${value.toFixed(2)} ${currency}`;
    }
}

function rowsFromTenderItems(items: TenderItem[]): LineRow[] {
    return items.map((item) => ({
        tenderItemId: item.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: "",
    }));
}

export default function OfferForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedTender = searchParams.get("tender");

    const [tenders, setTenders] = useState<Awaited<ReturnType<typeof getTenders>>>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [tenderId, setTenderId] = useState<number | "">("");
    const [supplierId, setSupplierId] = useState<number | "">("");
    const [lineRows, setLineRows] = useState<LineRow[]>([]);
    const [loadingLines, setLoadingLines] = useState(false);
    const [price, setPrice] = useState("");
    const [totalTouched, setTotalTouched] = useState(false);
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

    useEffect(() => {
        if (!preselectedTender) return;
        const id = Number(preselectedTender);
        if (Number.isFinite(id) && id > 0) setTenderId(id);
    }, [preselectedTender]);

    const loadTenderLines = useCallback(async (id: number) => {
        setLoadingLines(true);
        try {
            const tender = await getTenderById(id);
            setLineRows(rowsFromTenderItems(tender.items ?? []));
            setTotalTouched(false);
            setPrice("");
        } catch {
            setLineRows([]);
        } finally {
            setLoadingLines(false);
        }
    }, []);

    useEffect(() => {
        if (!tenderId) {
            setLineRows([]);
            return;
        }
        void loadTenderLines(tenderId);
    }, [tenderId, loadTenderLines]);

    const suppliers = useMemo(
        () => companies.filter((c) => (c.company_type ?? "").toLowerCase() === "supplier"),
        [companies],
    );

    const linesSum = useMemo(
        () =>
            lineRows.reduce((sum, row) => {
                const total = lineTotal(row.quantity, row.unitPrice);
                return total != null ? sum + total : sum;
            }, 0),
        [lineRows],
    );

    useEffect(() => {
        if (totalTouched || lineRows.length === 0) return;
        if (linesSum > 0) {
            setPrice(linesSum.toFixed(2));
        }
    }, [linesSum, lineRows.length, totalTouched]);

    const updateLineRow = (tenderItemId: number, patch: Partial<Pick<LineRow, "quantity" | "unitPrice">>) => {
        setLineRows((prev) =>
            prev.map((row) => (row.tenderItemId === tenderItemId ? { ...row, ...patch } : row)),
        );
    };

    const applyLinesToTotal = () => {
        if (linesSum > 0) {
            setPrice(linesSum.toFixed(2));
            setTotalTouched(false);
        }
    };

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

        const pricedLines = lineRows
            .map((row) => {
                const unitPrice = parsePriceInput(row.unitPrice);
                const quantity = parseQuantity(row.quantity);
                if (unitPrice == null || quantity == null) return null;
                return {
                    tender_item: row.tenderItemId,
                    unit_price: unitPrice,
                    quantity,
                };
            })
            .filter((row): row is NonNullable<typeof row> => row !== null);

        const parsedPrice = parsePriceInput(price);
        const finalTotal =
            parsedPrice ?? (linesSum > 0 ? linesSum : null);

        if (lineRows.length > 0 && pricedLines.length === 0 && finalTotal == null) {
            setError("Enter a unit price for at least one line item, or a total amount.");
            return;
        }
        if (price.trim() && parsedPrice === null) {
            setError("Enter a valid total amount.");
            return;
        }

        setSaving(true);
        try {
            const offer = await createOffer(
                {
                    tender_id: tenderId,
                    supplier_id: supplierId,
                    total_amount: finalTotal ?? undefined,
                    currency,
                    notes: notes.trim() || undefined,
                },
                document,
            );

            if (pricedLines.length > 0) {
                await createOfferLineItems(offer.id, pricedLines);
            }

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

    const selectedTender = tenders.find((t) => t.id === tenderId);

    return (
        <>
            <BidTypeGuide variant="supplier-offer" className="mb-4 max-w-4xl" />
            <Card className="max-w-4xl">
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
                            onChange={(e) => {
                                const v = e.target.value === "" ? "" : Number(e.target.value);
                                setTenderId(v);
                                setTotalTouched(false);
                            }}
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

                    {tenderId ? (
                        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                            <div className="flex flex-wrap items-end justify-between gap-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Line items (bill of quantities)
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-600">
                                        {selectedTender
                                            ? `From tender: ${selectedTender.title}`
                                            : "Enter a unit price per row; line totals sum into the offer total."}
                                    </p>
                                </div>
                                {linesSum > 0 ? (
                                    <Button type="button" variant="secondary" size="sm" onClick={applyLinesToTotal}>
                                        Use lines sum ({formatMoney(linesSum, currency)})
                                    </Button>
                                ) : null}
                            </div>

                            {loadingLines ? (
                                <p className="text-sm text-slate-600">Loading line items…</p>
                            ) : lineRows.length === 0 ? (
                                <p className="text-sm text-slate-600">
                                    This tender has no line items yet. Add them on the{" "}
                                    <Link
                                        to={`/tenders/${tenderId}`}
                                        className="font-medium text-brand-700 hover:underline"
                                    >
                                        tender detail
                                    </Link>{" "}
                                    page, or enter only a total amount below.
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50 text-left text-slate-600">
                                            <tr>
                                                <th className="px-3 py-2 font-medium">Item</th>
                                                <th className="px-3 py-2 font-medium">Qty</th>
                                                <th className="px-3 py-2 font-medium">Unit</th>
                                                <th className="px-3 py-2 font-medium">Unit price</th>
                                                <th className="px-3 py-2 font-medium text-right">Line total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {lineRows.map((row) => {
                                                const total = lineTotal(row.quantity, row.unitPrice);
                                                return (
                                                    <tr key={row.tenderItemId}>
                                                        <td className="px-3 py-2 font-medium text-slate-900">
                                                            {row.name}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                className={`${controlClass} w-24`}
                                                                type="number"
                                                                min={0}
                                                                step="any"
                                                                value={row.quantity}
                                                                onChange={(e) =>
                                                                    updateLineRow(row.tenderItemId, {
                                                                        quantity: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-700">{row.unit}</td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                className={`${controlClass} w-28`}
                                                                type="number"
                                                                min={0}
                                                                step="0.01"
                                                                value={row.unitPrice}
                                                                onChange={(e) =>
                                                                    updateLineRow(row.tenderItemId, {
                                                                        unitPrice: e.target.value,
                                                                    })
                                                                }
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                                                            {total != null
                                                                ? formatMoney(total, currency)
                                                                : "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        {linesSum > 0 ? (
                                            <tfoot className="bg-slate-50">
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                                                    >
                                                        Sum of lines
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-brand-800">
                                                        {formatMoney(linesSum, currency)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        ) : null}
                                    </table>
                                </div>
                            )}
                        </section>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Total amount"
                            hint={
                                lineRows.length > 0
                                    ? "Auto-filled from line items; you can override."
                                    : "Optional if you price every line item."
                            }
                        >
                            <input
                                className={controlClass}
                                type="number"
                                min={0}
                                step="0.01"
                                value={price}
                                onChange={(e) => {
                                    setTotalTouched(true);
                                    setPrice(e.target.value);
                                }}
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
                            {saving ? "Submitting…" : "Submit supplier offer"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => navigate("/offers")}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </>
    );
}
