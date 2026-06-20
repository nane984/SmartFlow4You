import { cn } from "./cn";
import {
    normalizeTenderStatus,
    TENDER_STATUS_BADGE_CLASS,
    TENDER_STATUS_LABELS,
    type TenderStatus,
} from "../../modules/tenders/tenderStatus";

type TenderStatusBadgeProps = {
    status: string;
    className?: string;
};

/**
 * Displays backend tender status as a labeled badge. Unknown values fall back to a neutral pill.
 */
export default function TenderStatusBadge({ status, className }: TenderStatusBadgeProps) {
    const normalized = normalizeTenderStatus(status);
    if (!normalized) {
        return (
            <span
                className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1",
                    "bg-slate-100 text-slate-700 ring-slate-200",
                    className
                )}
            >
                {status || "—"}
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1",
                TENDER_STATUS_BADGE_CLASS[normalized],
                className
            )}
        >
            {TENDER_STATUS_LABELS[normalized]}
        </span>
    );
}

export type { TenderStatus };
