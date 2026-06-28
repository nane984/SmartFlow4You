import Card from "../ui/Card";

type BidTypeGuideProps = {
    /** Which flow this page belongs to — shows a short “the other option” note. */
    variant: "supplier-offer" | "work-package" | "compare";
    className?: string;
};

/**
 * Explains the difference between supplier offers (RFQ / line items) and
 * work package bids (contractor Excel submissions).
 */
export default function BidTypeGuide({ variant, className }: BidTypeGuideProps) {
    if (variant === "compare") {
        return (
            <Card
                className={`border-slate-200/90 bg-slate-50/90 p-4 text-sm text-slate-700 ${className ?? ""}`}
            >
                <p className="font-semibold text-slate-900">Two ways to collect bids</p>
                <ul className="mt-3 space-y-3">
                    <li>
                        <span className="font-medium text-slate-900">Supplier offer</span>{" "}
                        <span className="text-slate-600">
                            — for <strong>suppliers</strong> quoting goods or services on a tender
                            (linked to RFQ and line items). Use{" "}
                            <a href="/offers/new" className="font-medium text-brand-700 hover:underline">
                                Submit supplier offer
                            </a>
                            .
                        </span>
                    </li>
                    <li>
                        <span className="font-medium text-slate-900">Work package bid</span>{" "}
                        <span className="text-slate-600">
                            — for <strong>contractors</strong> (or suppliers on trade packages): download
                            the Excel template, fill it in, and upload. Use{" "}
                            <a
                                href="/submissions/submit"
                                className="font-medium text-brand-700 hover:underline"
                            >
                                Submit work package bid
                            </a>
                            .
                        </span>
                    </li>
                </ul>
            </Card>
        );
    }

    if (variant === "supplier-offer") {
        return (
            <Card
                className={`border-amber-100 bg-amber-50/60 p-4 text-sm text-slate-700 ${className ?? ""}`}
            >
                <p className="font-medium text-slate-900">Supplier offer</p>
                <p className="mt-1 text-slate-600">
                    Price a tender for a <strong>supplier company</strong> (materials, equipment, or
                    services). Tied to RFQ and optional offer document — not the work-package Excel
                    template.
                </p>
                <p className="mt-2 text-slate-600">
                    For construction/trade scopes with an Excel template, use{" "}
                    <a href="/submissions/submit" className="font-medium text-brand-700 hover:underline">
                        work package bids
                    </a>{" "}
                    instead.
                </p>
            </Card>
        );
    }

    return (
        <Card
            className={`border-violet-100 bg-violet-50/50 p-4 text-sm text-slate-700 ${className ?? ""}`}
        >
            <p className="font-medium text-slate-900">Work package bid</p>
            <p className="mt-1 text-slate-600">
                For <strong>contractors</strong> bidding on a scoped package (electrical, HVAC, civil,
                etc.): download the package Excel template, complete it, upload, and optional total
                price.
            </p>
            <p className="mt-2 text-slate-600">
                For supplier pricing on tender line items / RFQ, use{" "}
                <a href="/offers/new" className="font-medium text-brand-700 hover:underline">
                    supplier offers
                </a>{" "}
                instead.
            </p>
        </Card>
    );
}
