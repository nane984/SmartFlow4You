import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { Company } from "../../modules/companies/company.type";
import { getCompanies } from "../../modules/companies/company.api";
import Card from "../../components/ui/Card";
import ItemForm from "../../components/tenders/ItemForm";
import ItemList from "../../components/tenders/ItemList";
import TenderAnalysisPanel from "../../components/procurement/TenderAnalysisPanel";
import WorkPackagesSection from "../../components/workPackages/WorkPackagesSection";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { documentFileName, resolveMediaUrl } from "../../util/mediaUrl";
import { getTenderById } from "./tenderApi";
import type { Tender, TenderDocument, TenderItem } from "./tenderTypes";

function formatWhen(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function TenderDetail() {
    const { id } = useParams();
    const tenderId = id ? Number.parseInt(id, 10) : NaN;

    const [tender, setTender] = useState<Tender | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void getCompanies().then(setCompanies);
    }, []);

    useEffect(() => {
        if (!Number.isFinite(tenderId) || tenderId < 1) {
            setError("Invalid tender id.");
            setTender(null);
            return;
        }
        setError(null);
        void getTenderById(tenderId)
            .then(setTender)
            .catch(() => {
                setError("Could not load tender.");
                setTender(null);
            });
    }, [tenderId]);

    const investorName = useMemo(() => {
        if (!tender) return "";
        const c = companies.find((x) => x.id === tender.investor);
        return c ? c.name : `Company #${tender.investor}`;
    }, [tender, companies]);

    if (error && !tender) {
        return (
            <>
                <PageHeader title="Tender" description="Something went wrong." />
                <Card className="max-w-3xl space-y-3">
                    <p className="text-sm text-rose-700">{error}</p>
                    <LinkButton to="/tenders" variant="secondary" size="sm">
                        Back to list
                    </LinkButton>
                </Card>
            </>
        );
    }

    if (!tender) {
        return (
            <>
                <PageHeader title="Tender" description="Loading details…" />
                <Card>
                    <div className="animate-pulse space-y-3">
                        <div className="h-6 w-2/3 rounded-lg bg-slate-200" />
                        <div className="h-4 w-full rounded bg-slate-100" />
                        <div className="h-4 w-5/6 rounded bg-slate-100" />
                    </div>
                </Card>
            </>
        );
    }

    const items = tender.items ?? [];
    const attachedDocuments = tender.documents ?? [];
    const primaryDocumentUrl = tender.document ? resolveMediaUrl(tender.document) : null;
    const hasAnyDocument = Boolean(primaryDocumentUrl) || attachedDocuments.some((d) => d.file);

    const handleItemCreated = (item: TenderItem) => {
        setTender((prev) =>
            prev ? { ...prev, items: [...(prev.items ?? []), item] } : prev
        );
    };

    return (
        <>
            <PageHeader
                title={tender.title}
                description={`Status: ${tender.status} · Source: ${tender.source || "manual"}`}
                actions={
                    <>
                        <LinkButton to="/tenders" variant="secondary" size="sm">
                            ← All tenders
                        </LinkButton>
                        <LinkButton to={`/tenders/${tender.id}/edit`} variant="secondary" size="sm">
                            Edit
                        </LinkButton>
                        <LinkButton to={`/tenders/${tender.id}#work-packages`} variant="secondary" size="sm">
                            Work packages
                        </LinkButton>
                        <LinkButton to="/work-packages" variant="secondary" size="sm">
                            All packages
                        </LinkButton>
                        <LinkButton
                            to={`/submissions/submit?tender=${tender.id}`}
                            variant="primary"
                            size="sm"
                        >
                            Work package bid
                        </LinkButton>
                        <LinkButton to={`/offers/new?tender=${tender.id}`} variant="secondary" size="sm">
                            Supplier offer
                        </LinkButton>
                    </>
                }
            />

            <div className="grid max-w-5xl gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <h2 className="text-base font-semibold text-slate-900">Overview</h2>
                    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="font-medium text-slate-500">Investor</dt>
                            <dd className="mt-1 text-slate-900">{investorName}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-500">Deadline</dt>
                            <dd className="mt-1 text-slate-900">{formatWhen(tender.deadline)}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-500">External ID</dt>
                            <dd className="mt-1 text-slate-900">{tender.external_id || "—"}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-500">Source URL</dt>
                            <dd className="mt-1 break-all text-slate-900">
                                {tender.source_url ? (
                                    <a
                                        href={tender.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-700 underline"
                                    >
                                        {tender.source_url}
                                    </a>
                                ) : (
                                    "—"
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-500">Tender type</dt>
                            <dd className="mt-1 text-slate-900">{tender.tender_type || "—"}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-500">Updated</dt>
                            <dd className="mt-1 text-slate-900">{formatWhen(tender.updated_at)}</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="font-medium text-slate-500">Description</dt>
                            <dd className="mt-1 whitespace-pre-wrap text-slate-800">{tender.description || "—"}</dd>
                        </div>
                    </dl>
                </Card>

                <Card>
                    <h2 className="text-base font-semibold text-slate-900">Documents</h2>
                    {!hasAnyDocument ? (
                        <p className="mt-3 text-sm text-slate-600">No documents attached.</p>
                    ) : (
                        <div className="mt-3 space-y-4">
                            {primaryDocumentUrl ? (
                                <div className="rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
                                        Primary document
                                    </p>
                                    <p className="mt-1 truncate text-sm font-medium text-slate-900">
                                        {documentFileName(tender.document!)}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <a
                                            href={primaryDocumentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-brand-600 px-3 py-1.5 text-sm font-medium text-white no-underline shadow-sm hover:bg-brand-700"
                                        >
                                            Open
                                        </a>
                                        <a
                                            href={primaryDocumentUrl}
                                            download
                                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 no-underline shadow-sm hover:bg-slate-50"
                                        >
                                            Download
                                        </a>
                                    </div>
                                </div>
                            ) : null}
                            {attachedDocuments.length > 0 ? (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Additional attachments
                                    </p>
                                    <ul className="mt-2 space-y-2">
                                        {attachedDocuments.map((d: TenderDocument) => {
                                            const fileUrl = d.file ? resolveMediaUrl(d.file) : "";
                                            return (
                                                <li
                                                    key={d.id}
                                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
                                                >
                                                    <span className="font-medium text-slate-800">
                                                        {d.label || (fileUrl ? documentFileName(fileUrl) : `Document #${d.id}`)}
                                                    </span>
                                                    {fileUrl ? (
                                                        <a
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-medium text-brand-700 hover:underline"
                                                        >
                                                            Open
                                                        </a>
                                                    ) : null}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    )}
                </Card>
            </div>

            <div className="mt-6 max-w-5xl">
                <TenderAnalysisPanel
                    summary={tender.analysis_summary}
                    visibility={tender.visibility}
                    analysisNotes={tender.analysis_notes}
                    supplierNames={tender.supplier_names}
                />
            </div>

            <WorkPackagesSection tenderId={tender.id} />

            <Card className="mt-6 max-w-5xl space-y-4 p-0">
                <div className="border-b border-slate-100 px-4 py-3">
                    <h2 className="text-base font-semibold text-slate-900">Line items</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Bill of quantities for this tender</p>
                </div>
                <div className="px-4 pb-4">
                    <ItemForm tenderId={tender.id} onCreated={handleItemCreated} />
                </div>
                <div className="border-t border-slate-100 px-0 pb-0">
                    <ItemList items={items} />
                </div>
            </Card>
        </>
    );
}
