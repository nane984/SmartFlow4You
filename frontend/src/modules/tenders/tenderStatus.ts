/**
 * Tender lifecycle statuses — aligned with backend `Tender.Status`.
 * Use {@link TenderStatusBadge} wherever tender status is shown.
 */
export const TENDER_STATUSES = [
    "draft",
    "published",
    "evaluation",
    "closed",
    "awarded",
    "cancelled",
] as const;

export type TenderStatus = (typeof TENDER_STATUSES)[number];

/** Human-readable labels for UI */
export const TENDER_STATUS_LABELS: Record<TenderStatus, string> = {
    draft: "Draft",
    published: "Published",
    evaluation: "Evaluation",
    closed: "Closed",
    awarded: "Awarded",
    cancelled: "Cancelled",
};

/** Tailwind classes per status — distinct, readable badges */
export const TENDER_STATUS_BADGE_CLASS: Record<TenderStatus, string> = {
    draft: "bg-slate-200 text-slate-800 ring-slate-300",
    published: "bg-blue-100 text-blue-900 ring-blue-200",
    evaluation: "bg-orange-100 text-orange-950 ring-orange-200",
    closed: "bg-zinc-300 text-zinc-950 ring-zinc-400",
    awarded: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    cancelled: "bg-red-100 text-red-900 ring-red-200",
};

export function isTenderStatus(value: string): value is TenderStatus {
    return (TENDER_STATUSES as readonly string[]).includes(value);
}

export function normalizeTenderStatus(raw: string | undefined | null): TenderStatus | null {
    if (!raw) return null;
    const v = raw.toLowerCase().trim();
    return isTenderStatus(v) ? v : null;
}
