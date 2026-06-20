import type { WorkCategory } from "./constants";
import { WORK_CATEGORY_LABELS } from "./constants";

/** Logical tender analysis layer (maps to backend `analysis_summary`). */
export type TenderAnalysisSummary = {
    visibility: string;
    work_categories: string[];
    work_package_count: number;
    submission_count: number;
    notes: string;
};

export function formatWorkCategories(categories: string[]): string {
    if (!categories.length) return "—";
    return categories
        .map((c) => WORK_CATEGORY_LABELS[c as WorkCategory] ?? c)
        .join(", ");
}

export function analysisReadyForAi(summary: TenderAnalysisSummary | null | undefined): boolean {
    if (!summary) return false;
    return summary.work_package_count > 0 || Boolean(summary.notes?.trim());
}
