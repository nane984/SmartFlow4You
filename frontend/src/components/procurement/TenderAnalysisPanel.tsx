import Card from "../ui/Card";
import {
    formatWorkCategories,
    type TenderAnalysisSummary,
} from "../../modules/procurement/tenderAnalysis";
import { TENDER_VISIBILITY_LABELS, type TenderVisibility } from "../../modules/procurement/constants";

type TenderAnalysisPanelProps = {
    summary?: TenderAnalysisSummary | null;
    visibility?: string;
    analysisNotes?: string;
    supplierNames?: string[];
};

export default function TenderAnalysisPanel({
    summary,
    visibility,
    analysisNotes,
    supplierNames,
}: TenderAnalysisPanelProps) {
    const vis = summary?.visibility || visibility || "";
    const visLabel =
        vis && vis in TENDER_VISIBILITY_LABELS
            ? TENDER_VISIBILITY_LABELS[vis as TenderVisibility]
            : vis || "—";

    return (
        <Card className="border-brand-100 bg-brand-50/30">
            <h2 className="text-base font-semibold text-slate-900">Tender analysis layer</h2>
            <p className="mt-1 text-xs text-slate-500">
                Logical classification for reporting and future AI automation
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                    <dt className="font-medium text-slate-500">Visibility</dt>
                    <dd className="mt-0.5 text-slate-900">{visLabel}</dd>
                </div>
                <div>
                    <dt className="font-medium text-slate-500">Work categories</dt>
                    <dd className="mt-0.5 text-slate-900">
                        {formatWorkCategories(summary?.work_categories ?? [])}
                    </dd>
                </div>
                <div>
                    <dt className="font-medium text-slate-500">Work packages</dt>
                    <dd className="mt-0.5 text-slate-900">{summary?.work_package_count ?? 0}</dd>
                </div>
                <div>
                    <dt className="font-medium text-slate-500">Submissions</dt>
                    <dd className="mt-0.5 text-slate-900">{summary?.submission_count ?? 0}</dd>
                </div>
            </dl>
            {supplierNames && supplierNames.length > 0 && (
                <p className="mt-3 text-sm text-slate-700">
                    <span className="font-medium">Suppliers:</span> {supplierNames.join(", ")}
                </p>
            )}
            {(analysisNotes || summary?.notes) && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                    <span className="font-medium">Notes:</span> {summary?.notes || analysisNotes}
                </p>
            )}
        </Card>
    );
}
