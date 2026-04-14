import { useState, useEffect } from "react";
import type { Company } from "./company.type";
import { getCompanies, deleteCompany } from "./company.api";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LinkButton from "../../components/ui/LinkButton";

const CompanyList = () => {
    const [companies, setCompanies] = useState<Company[]>([]);

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        const res = await getCompanies();
        setCompanies(res);
    };

    const handleDelete = async (id: number) => {
        await deleteCompany(id);
        setCompanies((company) => company.filter((c) => c.id !== id));
    };

    return (
        <>
            <PageHeader
                title="Companies"
                description="Organizations you work with across tenders and HR."
                actions={
                    <LinkButton variant="primary" size="sm" to="/companies/new">
                        Add company
                    </LinkButton>
                }
            />
            <Card className="overflow-hidden p-0">
                {companies.length === 0 ? (
                    <p className="p-6 text-sm text-slate-600">No companies yet.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {companies.map((company) => (
                            <li
                                key={company.id}
                                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="text-base font-semibold text-slate-900">{company.name}</p>
                                    <p className="text-sm text-slate-600">
                                        {company.city}
                                        {company.email ? ` · ${company.email}` : ""}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <LinkButton variant="secondary" size="sm" to={`/companies/${company.id}/edit`}>
                                        Edit
                                    </LinkButton>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(company.id)}
                                    >
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
};

export default CompanyList;
