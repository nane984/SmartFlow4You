import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { Company } from "../../modules/companies/company.type";
import { getCompanies } from "../../modules/companies/company.api";
import Card from "../../components/ui/Card";
import ItemForm from "../../components/tenders/ItemForm";
import ItemList from "../../components/tenders/ItemList";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { getTenderById } from "./tenderApi";
import type { Tender, TenderItem } from "./tenderTypes";

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
    const documents = tender.documents ?? [];

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
                    <LinkButton to="/tenders" variant="secondary" size="sm">
                        ← All tenders
                    </LinkButton>
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
                    {documents.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-600">No documents attached.</p>
                    ) : (
                        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
                            {documents.map((d) => (
                                <li key={d.id}>
                                    {d.label || d.file || `Document #${d.id}`}
                                    {d.file ? (
                                        <>
                                            {" "}
                                            <a
                                                href={d.file}
                                                className="text-brand-700 underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Open
                                            </a>
                                        </>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

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
