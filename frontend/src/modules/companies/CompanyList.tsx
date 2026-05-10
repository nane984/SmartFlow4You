import { useCallback, useEffect, useMemo, useState } from "react";
import type { Company } from "./company.type";
import { getCompanies } from "./company.api";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import Field from "../../components/ui/Field";
import { controlClass } from "../../components/ui/inputStyles";

type CompanyKind = "investor" | "contractor" | "supplier";
type FilterValue = "all" | CompanyKind;

function normalizeType(c: Company): CompanyKind | null {
    const t = (c.company_type ?? "").toLowerCase().trim();
    if (t === "investor" || t === "contractor" || t === "supplier") return t;
    return null;
}

function typeLabel(kind: CompanyKind): string {
    switch (kind) {
        case "investor":
            return "Investor";
        case "contractor":
            return "Contractor";
        case "supplier":
            return "Supplier";
    }
}

function TypeBadge({ kind }: { kind: CompanyKind }) {
    const styles: Record<CompanyKind, string> = {
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

function CompanyRow({ company }: { company: Company }) {
    const kind = normalizeType(company);
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
            <LinkButton variant="secondary" size="sm" to={`/companies/${company.id}/edit`}>
                Edit
            </LinkButton>
        </li>
    );
}

function SectionBlock({
    title,
    companies,
}: {
    title: string;
    companies: Company[];
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
                    companies.map((c) => <CompanyRow key={c.id} company={c} />)
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

    return (
        <>
            <PageHeader
                title="Companies"
                description="Organizations by role (investor, contractor, supplier)."
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
                        <SectionBlock title="Investors" companies={grouped.investors} />
                        <SectionBlock title="Contractors" companies={grouped.contractors} />
                        <SectionBlock title="Suppliers" companies={grouped.suppliers} />
                        {grouped.other.length > 0 && (
                            <SectionBlock title="Other / unspecified" companies={grouped.other} />
                        )}
                    </div>
                )}

                {!loading && !empty && filter !== "all" && (
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
                        <ul className="px-4">
                            {filteredFlat.length === 0 ? (
                                <li className="py-6 text-sm text-slate-600">No companies found.</li>
                            ) : (
                                filteredFlat.map((c) => <CompanyRow key={c.id} company={c} />)
                            )}
                        </ul>
                    </div>
                )}
            </Card>
        </>
    );
}
