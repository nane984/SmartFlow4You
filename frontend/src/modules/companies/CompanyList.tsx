import { useCallback, useEffect, useMemo, useState } from "react";
import type { Company, CompanyRoleType } from "./company.type";
import { deleteCompany, getCompanies } from "./company.api";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LinkButton from "../../components/ui/LinkButton";
import Field from "../../components/ui/Field";
import TenderStatusBadge from "../../components/ui/TenderStatusBadge";
import { controlClass } from "../../components/ui/inputStyles";
import { TENDER_STATUSES } from "../tenders/tenderStatus";

type FilterValue = "all" | CompanyRoleType;

function normalizeType(c: Company): CompanyRoleType | null {
    const t = (c.company_type ?? "").toLowerCase().trim();
    if (t === "investor" || t === "contractor" || t === "supplier") return t;
    return null;
}

function typeLabel(kind: CompanyRoleType): string {
    switch (kind) {
        case "investor":
            return "Investor";
        case "contractor":
            return "Contractor";
        case "supplier":
            return "Supplier";
    }
}

function TypeBadge({ kind }: { kind: CompanyRoleType }) {
    const styles: Record<CompanyRoleType, string> = {
        investor: "bg-blue-100 text-blue-900 ring-1 ring-blue-200",
        contractor: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
        supplier: "bg-orange-100 text-orange-900 ring-1 ring-orange-200",
    };
    return (
        <span
            className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[kind]}`}
        >
            {typeLabel(kind)}
        </span>
    );
}

function CompanyRow({
    company,
    onDeleted,
}: {
    company: Company;
    onDeleted: (id: number) => void;
}) {
    const kind = normalizeType(company);

    const handleDelete = async () => {
        if (!window.confirm(`Delete company "${company.name}"?`)) return;
        try {
            await deleteCompany(company.id);
            onDeleted(company.id);
        } catch {
            window.alert("Could not delete company. It may be linked to tenders or other records.");
        }
    };

    return (
        <li className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
                <span className="font-medium text-slate-900">{company.name}</span>
                {kind ? (
                    <TypeBadge kind={kind} />
                ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        Unknown
                    </span>
                )}
            </div>
            <div className="flex shrink-0 gap-2">
                <LinkButton variant="secondary" size="sm" to={`/companies/${company.id}/edit`}>
                    Edit
                </LinkButton>
                <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                    Delete
                </Button>
            </div>
        </li>
    );
}

function SectionBlock({
    title,
    companies,
    onDeleted,
}: {
    title: string;
    companies: Company[];
    onDeleted: (id: number) => void;
}) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h2>
            </div>
            <ul className="divide-y divide-slate-50 px-4">
                {companies.length === 0 ? (
                    <li className="py-4 text-sm text-slate-500">No companies in this category.</li>
                ) : (
                    companies.map((c) => <CompanyRow key={c.id} company={c} onDeleted={onDeleted} />)
                )}
            </ul>
        </section>
    );
}

export default function CompanyList() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterValue>("all");

    const loadCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCompanies();
            setCompanies(res);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCompanies();
    }, [loadCompanies]);

    const grouped = useMemo(() => {
        const investors: Company[] = [];
        const contractors: Company[] = [];
        const suppliers: Company[] = [];
        const other: Company[] = [];

        for (const c of companies) {
            const k = normalizeType(c);
            if (k === "investor") investors.push(c);
            else if (k === "contractor") contractors.push(c);
            else if (k === "supplier") suppliers.push(c);
            else other.push(c);
        }

        return { investors, contractors, suppliers, other };
    }, [companies]);

    const filteredFlat = useMemo(() => {
        if (filter === "all") return [];
        return companies.filter((c) => normalizeType(c) === filter);
    }, [companies, filter]);

    const empty = !loading && companies.length === 0;

    const handleCompanyDeleted = (id: number) => {
        setCompanies((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <>
            <PageHeader
                title="Companies"
                description="Organizations by role (investor, contractor, supplier). Tender statuses below match the procurement lifecycle on linked tenders."
                actions={
                    <LinkButton variant="primary" size="sm" to="/companies/new">
                        Add company
                    </LinkButton>
                }
            />

            <Card className="max-w-4xl space-y-6">
                <Field label="Filter by type">
                    <select
                        className={controlClass}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as FilterValue)}
                    >
                        <option value="all">All</option>
                        <option value="investor">Investor</option>
                        <option value="contractor">Contractor</option>
                        <option value="supplier">Supplier</option>
                    </select>
                </Field>

                {loading && <p className="text-sm text-slate-600">Loading...</p>}

                {empty && <p className="text-sm text-slate-600">No companies found.</p>}

                {!loading && !empty && filter === "all" && (
                    <div className="space-y-8">
                        <SectionBlock title="Investors" companies={grouped.investors} onDeleted={handleCompanyDeleted} />
                        <SectionBlock title="Contractors" companies={grouped.contractors} onDeleted={handleCompanyDeleted} />
                        <SectionBlock title="Suppliers" companies={grouped.suppliers} onDeleted={handleCompanyDeleted} />
                        {grouped.other.length > 0 && (
                            <SectionBlock title="Other / unspecified" companies={grouped.other} onDeleted={handleCompanyDeleted} />
                        )}
                    </div>
                )}

                {!loading && !empty && filter !== "all" && (
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
                        <ul className="px-4">
                            {filteredFlat.length === 0 ? (
                                <li className="py-6 text-sm text-slate-600">No companies found.</li>
                            ) : (
                                filteredFlat.map((c) => (
                                    <CompanyRow key={c.id} company={c} onDeleted={handleCompanyDeleted} />
                                ))
                            )}
                        </ul>
                    </div>
                )}

                {!loading && (
                    <section
                        aria-label="Tender status reference"
                        className="rounded-xl border border-dashed border-slate-200 bg-slate-50/90 px-4 py-4"
                    >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Tender statuses (reference)
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Same values as <code className="rounded bg-white px-1 py-0.5 text-slate-700">GET /api/tenders/</code>{" "}
                            — use these badges on tender lists and detail views.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {TENDER_STATUSES.map((s) => (
                                <TenderStatusBadge key={s} status={s} />
                            ))}
                        </div>
                    </section>
                )}
            </Card>
        </>
    );
}
