import { useEffect, useState } from "react";
import type { Offer } from "./offer.types";
import { getOffers } from "./offer.api";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";

/** Lists offers under `/offers` (nested route; parent mounts at `offers/*`). */
export default function OfferList() {
    const [offers, setOffers] = useState<Offer[]>([]);

    useEffect(() => {
        void fetchOffers();
    }, []);

    const fetchOffers = async () => {
        const data = await getOffers();
        setOffers(data);
    };

    return (
        <>
            <PageHeader
                title="Offers"
                description="Submitted offers linked to tenders (price and attachments)."
            />
            <Card className="overflow-hidden p-0">
                {offers.length === 0 ? (
                    <p className="p-6 text-sm text-slate-600">No offers yet.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {offers.map((o) => (
                            <li key={o.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">Offer #{o.id}</p>
                                    <p className="text-sm text-slate-600">
                                        Tender <span className="font-mono">{o.tender}</span>
                                    </p>
                                </div>
                                <p className="text-lg font-semibold tabular-nums text-brand-800">
                                    {o.price.toLocaleString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </>
    );
}
