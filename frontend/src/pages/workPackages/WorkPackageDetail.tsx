import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SubmissionStatusBadge from "../../components/ui/SubmissionStatusBadge";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import {
    OBJECT_TYPE_LABELS,
    WORK_CATEGORY_LABELS,
    type ObjectType,
    type WorkCategory,
} from "../../modules/procurement/constants";
import { getWorkPackageById } from "../../modules/workPackages/workPackage.api";
import type { WorkPackage, WorkPackageSubmission } from "../../modules/workPackages/workPackage.types";
import { documentFileName, resolveMediaUrl } from "../../util/mediaUrl";
import { fileNameFromUrl } from "../../util/fileNameFromUrl";

function formatWhen(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function categoryLabel(value: string | undefined): string {
    if (!value) return "—";
    return WORK_CATEGORY_LABELS[value as WorkCategory] ?? value;
}

function objectTypeLabel(value: string | undefined): string {
    if (!value) return "—";
    return OBJECT_TYPE_LABELS[value as ObjectType] ?? value;
}

function formatPrice(price: string | null | undefined): string {
    if (price == null || price.trim() === "") return "—";
    const n = Number.parseFloat(price);
    if (Number.isFinite(n)) {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(n);
    }
    return price;
}

export default function WorkPackageDetail() {
    const { tenderId: tenderIdParam, wpId: wpIdParam } = useParams();
    const routeTenderId = tenderIdParam ? Number.parseInt(tenderIdParam, 10) : NaN;
    const wpId = wpIdParam ? Number.parseInt(wpIdParam, 10) : NaN;

    const [workPackage, setWorkPackage] = useState<WorkPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!Number.isFinite(wpId) || wpId < 1) {
            setError("Invalid work package.");
            setLoading(false);
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const wp = await getWorkPackageById(wpId);
            setWorkPackage(wp);
        } catch {
            setError("Could not load work package.");
            setWorkPackage(null);
        } finally {
            setLoading(false);
        }
    }, [wpId]);

    useEffect(() => {
        void load();
    }, [load]);

    const submissions = useMemo<WorkPackageSubmission[]>(
        () => workPackage?.submissions ?? [],
        [workPackage]
    );

    const templateUrl = workPackage?.template_file ? resolveMediaUrl(workPackage.template_file) : null;
    const tenderId = Number.isFinite(routeTenderId) ? routeTenderId : workPackage?.tender;
    const tenderLink = tenderId ? `/tenders/${tenderId}` : "/tenders";

    if (loading) {
        return (
            <>
                <PageHeader title="Work package" description="Loading…" />
                <Card>
                    <div className="animate-pulse space-y-3 p-4">
                        <div className="h-6 w-1/2 rounded bg-slate-200" />
                        <div className="h-4 w-full rounded bg-slate-100" />
                        <div className="h-4 w-3/4 rounded bg-slate-100" />
                    </div>
                </Card>
            </>
        );
    }

    if (error || !workPackage) {
        return (
            <>
                <PageHeader title="Work package" description="Something went wrong." />
                <Card className="max-w-3xl space-y-3 p-4">
                    <p className="text-sm text-rose-700">{error ?? "Not found."}</p>
                    <LinkButton to={tenderLink} variant="secondary" size="sm">
                        Back to tender
                    </LinkButton>
                </Card>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title={workPackage.name}
                description={
                    workPackage.tender_title
                        ? `Tender: ${workPackage.tender_title}`
                        : `Tender #${workPackage.tender}`
                }
                actions={
                    <div className="flex flex-wrap gap-2">
                        <LinkButton to={tenderLink} variant="secondary" size="sm">
                            ← Tender
                        </LinkButton>
                        <LinkButton to="/work-packages" variant="secondary" size="sm">
                            All work packages
                        </LinkButton>
                        <LinkButton to="/submissions" variant="secondary" size="sm">
                            All submissions
                        </LinkButton>
                        <LinkButton
                            to={`/submissions/submit?work_package=${workPackage.id}`}
                            variant="primary"
                            size="sm"
                        >
                            Submit bid
                        </LinkButton>
                    </div>
                }
            />

            <div className="grid max-w-5xl gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <h2 className="text-base font-semibold text-slate-900">Details</h2>
                    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="font-medium text-slate-500">Category</dt>
                            <dd className="mt-1 text-slate-900">{categoryLabel(workPackage.work_category)}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-500">Object type</dt>
                            <dd className="mt-1 text-slate-900">{objectTypeLabel(workPackage.object_type)}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-500">Tender</dt>
                            <dd className="mt-1">
                                <Link
                                    to={tenderLink}
                                    className="font-medium text-brand-700 no-underline hover:underline"
                                >
                                    {workPackage.tender_title ?? `Tender #${workPackage.tender}`}
                                </Link>
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-500">Created</dt>
                            <dd className="mt-1 text-slate-900">{formatWhen(workPackage.created_at)}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-500">Submissions</dt>
                            <dd className="mt-1 text-slate-900">
                                {workPackage.submission_count ?? submissions.length}
                            </dd>
                        </div>
                        {workPackage.contractor_names && workPackage.contractor_names.length > 0 ? (
                            <div className="sm:col-span-2">
                                <dt className="font-medium text-slate-500">Assigned contractors</dt>
                                <dd className="mt-1 flex flex-wrap gap-1.5">
                                    {workPackage.contractor_names.map((name) => (
                                        <span
                                            key={name}
                                            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                                        >
                                            {name}
                                        </span>
                                    ))}
                                </dd>
                            </div>
                        ) : null}
                        <div className="sm:col-span-2">
                            <dt className="font-medium text-slate-500">Description</dt>
                            <dd className="mt-1 whitespace-pre-wrap text-slate-800">
                                {workPackage.description?.trim() ? workPackage.description : "—"}
                            </dd>
                        </div>
                    </dl>
                </Card>

                <Card>
                    <h2 className="text-base font-semibold text-slate-900">Excel template</h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Template subcontractors download, complete, and return as a bid.
                    </p>
                    {templateUrl ? (
                        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
                            <p className="truncate text-sm font-medium text-slate-900">
                                {documentFileName(workPackage.template_file!)}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <a
                                    href={templateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-brand-600 px-3 py-1.5 text-sm font-medium text-white no-underline shadow-sm hover:bg-brand-700"
                                >
                                    Open template
                                </a>
                                <a
                                    href={templateUrl}
                                    download
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 no-underline shadow-sm hover:bg-slate-50"
                                >
                                    Download template
                                </a>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-slate-600">No template file uploaded yet.</p>
                    )}
                </Card>
            </div>

            <Card className="mt-6 max-w-5xl overflow-hidden p-0">
                <div className="border-b border-slate-100 px-4 py-3">
                    <h2 className="text-base font-semibold text-slate-900">Submissions</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Bids from contractors and suppliers for this work package
                    </p>
                </div>
                {submissions.length === 0 ? (
                    <p className="p-6 text-sm text-slate-600">No submissions yet.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {submissions.map((s) => {
                            const fileUrl = s.uploaded_file ? resolveMediaUrl(s.uploaded_file) : "";
                            return (
                                <li
                                    key={s.id}
                                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-900">{s.subcontractor_name}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <SubmissionStatusBadge status={s.status} />
                                            <span className="text-sm text-slate-600">
                                                Price: {formatPrice(s.price)}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Submitted {formatWhen(s.submitted_at)}
                                        </p>
                                    </div>
                                    {fileUrl ? (
                                        <div className="shrink-0 text-right">
                                            <p className="max-w-[14rem] truncate text-xs text-slate-500">
                                                {fileNameFromUrl(s.uploaded_file)}
                                            </p>
                                            <div className="mt-1 flex flex-wrap justify-end gap-2">
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium text-brand-700 hover:underline"
                                                >
                                                    Open
                                                </a>
                                                <a
                                                    href={fileUrl}
                                                    download
                                                    className="text-sm font-medium text-slate-600 hover:underline"
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">No file attached</p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>
        </>
    );
}
