import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import TenderStatusBadge from "../../components/ui/TenderStatusBadge";
import { getCompanies } from "../../modules/companies/company.api";
import type { Company } from "../../modules/companies/company.type";
import {
    normalizeTenderStatus,
    TENDER_STATUSES,
    TENDER_STATUS_LABELS,
    type TenderStatus,
} from "../../modules/tenders/tenderStatus";
import { deleteTender, getTenders } from "./tenderApi";
import type { Tender } from "./tenderTypes";
import { documentFileName, resolveMediaUrl } from "../../util/mediaUrl";

function formatWhen(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function isInvestorCompany(c: Company): boolean {
    return (c.company_type ?? "").toLowerCase().trim() === "investor";
}

const selectClass =
    "min-w-[12rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export default function TenderList() {
    const navigate = useNavigate();
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedInvestorId, setSelectedInvestorId] = useState<number | "">("");
    const [selectedStatus, setSelectedStatus] = useState<TenderStatus | "all">("all");

    const load = useCallback(async () => {
        setLoadError(null);
        setLoading(true);
        try {
            const [tenderData, companyData] = await Promise.all([getTenders(), getCompanies()]);
            setTenders(tenderData);
            setCompanies(companyData);
        } catch {
            setLoadError("Could not load tenders or companies.");
            setTenders([]);
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const investors = useMemo(() => companies.filter(isInvestorCompany), [companies]);

    const companyNameById = useMemo(() => {
        const m = new Map<number, string>();
        for (const c of companies) {
            m.set(c.id, c.name);
        }
        return m;
    }, [companies]);

    const filteredTenders = useMemo(() => {
        let list = tenders;
        if (selectedInvestorId !== "") {
            list = list.filter((t) => t.investor === selectedInvestorId);
        }
        if (selectedStatus !== "all") {
            list = list.filter((t) => normalizeTenderStatus(t.status) === selectedStatus);
        }
        return list;
    }, [tenders, selectedInvestorId, selectedStatus]);

    const hasActiveFilters = selectedInvestorId !== "" || selectedStatus !== "all";

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this tender?")) return;
        try {
            await deleteTender(id);
            setTenders((prev) => prev.filter((t) => t.id !== id));
        } catch {
            setLoadError("Delete failed.");
        }
    };

    return (
        <>
            <PageHeader
                title="Tenders"
                description="Review and manage procurement opportunities. Tenders are linked to an investor company."
                actions={
                    <Button type="button" variant="primary" size="sm" onClick={() => navigate("/tenders/new")}>
                        + New tender
                    </Button>
                }
            />
            {loadError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {loadError}
                </div>
            )}

            <Card className="mb-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="filter-investor" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Filter by Investor
                        </label>
                        <select
                            id="filter-investor"
                            className={selectClass}
                            value={selectedInvestorId === "" ? "" : String(selectedInvestorId)}
                            onChange={(e) => {
                                const v = e.target.value;
                                setSelectedInvestorId(v === "" ? "" : Number(v));
                            }}
                            disabled={loading}
                        >
                            <option value="">All investors</option>
                            {investors.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="filter-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Filter by status
                        </label>
                        <select
                            id="filter-status"
                            className={selectClass}
                            value={selectedStatus}
                            onChange={(e) => {
                                const v = e.target.value;
                                setSelectedStatus(v === "all" ? "all" : (v as TenderStatus));
                            }}
                            disabled={loading}
                        >
                            <option value="all">All statuses</option>
                            {TENDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {TENDER_STATUS_LABELS[s]}
                                </option>
                            ))}
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="sm:mb-0.5"
                            onClick={() => {
                                setSelectedInvestorId("");
                                setSelectedStatus("all");
                            }}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            </Card>

            <Card className="overflow-hidden p-0">
                {loading ? (
                    <p className="p-6 text-sm text-slate-600">Loading tenders…</p>
                ) : filteredTenders.length === 0 ? (
                    <p className="p-6 text-sm text-slate-600">
                        {tenders.length === 0
                            ? "No tenders yet. Create one to get started."
                            : "No tenders found."}
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {filteredTenders.map((t) => (
                            <li
                                key={t.id}
                                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link
                                            to={`/tenders/${t.id}`}
                                            className="text-base font-medium text-slate-900 no-underline hover:text-brand-700"
                                        >
                                            {t.title}
                                        </Link>
                                        <TenderStatusBadge status={t.status} />
                                    </div>
                                    <p className="mt-1 text-sm text-slate-700">
                                        <span className="font-medium text-slate-600">Company:</span>{" "}
                                        {companyNameById.get(t.investor) ?? `Company #${t.investor}`}
                                    </p>
                                    {t.document ? (
                                        <p className="mt-1 text-sm">
                                            <a
                                                href={resolveMediaUrl(t.document)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-brand-700 hover:underline"
                                            >
                                                {documentFileName(t.document)}
                                            </a>
                                            <span className="ml-1 text-slate-500">· View / download</span>
                                        </p>
                                    ) : null}
                                    <p className="mt-1 text-xs text-slate-600">
                                        <span>Source: {t.source || "manual"}</span>
                                        {" · "}
                                        <span>Deadline: {formatWhen(t.deadline)}</span>
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <LinkButton variant="secondary" size="sm" to={`/tenders/${t.id}`}>
                                        View
                                    </LinkButton>
                                    <LinkButton variant="secondary" size="sm" to={`/tenders/${t.id}/edit`}>
                                        Edit
                                    </LinkButton>
                                    <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(t.id)}>
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
