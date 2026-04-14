import { useEffect, useState } from "react";
import type { TenderCreatePayload } from "./tender.type";
import { createTender } from "./tender.api";
import { useNavigate } from "react-router-dom";
import type { Company } from "../companies/company.type";
import { getCompanies } from "../companies/company.api";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import Button from "../../components/ui/Button";
import { controlClass } from "../../components/ui/inputStyles";

const TenderForm = () => {
    const navigate = useNavigate();

    const [tenderData, setTenderData] = useState<TenderCreatePayload>({
        title: "",
        source: "",
        description: "",
        deadline: "",
        type: "",
        companies: [],
    });

    const [companies, setCompanies] = useState<Company[]>([]);

    useEffect(() => {
        getCompanies().then((data) => setCompanies(data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createTender(tenderData);
        navigate("/tenders");
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (name === "companies") {
            const options = (e.target as HTMLSelectElement).selectedOptions;
            const values = Array.from(options).map((option) => Number(option.value));
            setTenderData({ ...tenderData, companies: values });
        } else {
            setTenderData({ ...tenderData, [name]: value });
        }
    };

    return (
        <>
            <PageHeader
                title="Create tender"
                description="Define the basics and link one or more companies."
            />
            <Card className="max-w-2xl">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <Field label="Title">
                        <input
                            className={controlClass}
                            name="title"
                            value={tenderData.title}
                            onChange={handleChange}
                            placeholder="Public tender title"
                            required
                        />
                    </Field>

                    <Field label="Source">
                        <input
                            className={controlClass}
                            name="source"
                            value={tenderData.source}
                            onChange={handleChange}
                            placeholder="Portal or issuer"
                        />
                    </Field>

                    <Field label="Type">
                        <input
                            className={controlClass}
                            name="type"
                            value={tenderData.type}
                            onChange={handleChange}
                            placeholder="e.g. Construction, IT services"
                        />
                    </Field>

                    <Field label="Deadline">
                        <input
                            className={controlClass}
                            type="datetime-local"
                            name="deadline"
                            value={tenderData.deadline}
                            onChange={handleChange}
                        />
                    </Field>

                    <Field label="Description">
                        <textarea
                            className={`${controlClass} min-h-[120px] resize-y`}
                            name="description"
                            value={tenderData.description}
                            onChange={handleChange}
                            placeholder="Scope, requirements, and evaluation notes"
                            rows={5}
                        />
                    </Field>

                    <Field label="Companies" hint="Hold Ctrl / Cmd to select multiple.">
                        <select
                            className={controlClass}
                            name="companies"
                            multiple
                            value={tenderData.companies.map(String)}
                            onChange={handleChange}
                            size={Math.min(Math.max(companies.length, 3), 10)}
                        >
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button type="submit">Save tender</Button>
                        <Button type="button" variant="secondary" onClick={() => navigate("/tenders")}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </>
    );
};

export default TenderForm;
