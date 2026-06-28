import { useCallback, useEffect, useState } from "react";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { deleteOffer, getOffers } from "./offer.api";
import type { SupplierOffer } from "./offer.types";
import BidTypeGuide from "../../components/procurement/BidTypeGuide";
import { documentFileName, resolveMediaUrl } from "../../util/mediaUrl";

function formatAmount(amount: string | null, currency: string): string {
    if (amount == null || amount.trim() === "") return "—";
    const n = Number.parseFloat(amount);
    if (Number.isFinite(n)) {
        try {
            return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
        } catch {
            return `${amount} ${currency}`;
        }
    }
    return `${amount} ${currency}`;
}

function formatWhen(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function OfferList() {
    const [offers, setOffers] = useState<SupplierOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            setOffers(await getOffers());
        } catch {
            setError("Could not load offers.");
            setOffers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this offer?")) return;
        try {
            await deleteOffer(id);
            setOffers((prev) => prev.filter((o) => o.id !== id));
        } catch {
            setError("Delete failed.");
        }
    };

    return (
        <>
            <PageHeader
                title="Supplier offers"
                description="Supplier pricing responses linked to tenders via RFQ (not work-package Excel bids)."
                actions={
                    <LinkButton variant="primary" size="sm" to="/offers/new">
                        + Supplier offer
                    </LinkButton>
                }
            />
            <BidTypeGuide variant="compare" className="mb-4" />
            {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            )}
            <Card className="overflow-hidden p-0">
                {loading ? (
                    <p className="p-6 text-sm text-slate-600">Loading offers…</p>
                ) : offers.length === 0 ? (
                    <p className="p-6 text-sm text-slate-600">
                        No offers yet. Submit one linked to a tender and supplier.
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {offers.map((o) => (
                            <li
                                key={o.id}
                                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-900">
                                        {o.tender_title ?? `Tender #${o.tender}`}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Supplier: {o.supplier_name ?? `#${o.supplier}`}
                                        {o.created_by_name ? ` · by ${o.created_by_name}` : ""}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        RFQ #{o.rfq} · Submitted {formatWhen(o.submitted_at)}
                                    </p>
                                    {o.document ? (
                                        <p className="mt-2 text-sm">
                                            <a
                                                href={resolveMediaUrl(o.document)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-brand-700 hover:underline"
                                            >
                                                {documentFileName(o.document)}
                                            </a>
                                        </p>
                                    ) : null}
                                    {o.notes ? (
                                        <p className="mt-1 text-sm text-slate-600">{o.notes}</p>
                                    ) : null}
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-2">
                                    <p className="text-lg font-semibold tabular-nums text-brand-800">
                                        {formatAmount(o.total_amount, o.currency || "EUR")}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(o.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </>
    );
}
