import { useNavigate, useParams } from "react-router-dom";
import { createCompany, getCompanyById, updateCompany } from "./company.api";
import { useEffect, useState } from "react";
import type { CompanyPayload } from "./company.type";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import Button from "../../components/ui/Button";
import { controlClass } from "../../components/ui/inputStyles";

const CompanyForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<CompanyPayload>({
        name: "",
        email: "",
        contact_person: "",
        city: "",
        company_type: "contractor",
    });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) {
            loadCompany();
        }
    }, [id]);

    const loadCompany = async () => {
        const res = await getCompanyById(Number(id));
        setData({
            name: res.name,
            email: res.email,
            contact_person: res.contact_person ?? "",
            city: res.city,
            company_type: res.company_type ?? "contractor",
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setData({
            ...data,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            if (id) {
                await updateCompany(Number(id), data);
            } else {
                await createCompany(data);
            }
            navigate("/companies");
        } catch {
            setError("Could not save company. Check the fields and try again.");
        } finally {
            setSaving(false);
        }
    };

    const isEdit = Boolean(id);

    return (
        <>
            <PageHeader
                title={isEdit ? "Edit company" : "New company"}
                description="Store contact details for partners and clients."
            />
            <Card className="max-w-xl">
                {error && (
                    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                        {error}
                    </div>
                )}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <Field label="Company type">
                        <select
                            className={controlClass}
                            name="company_type"
                            value={data.company_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="investor">Investor</option>
                            <option value="contractor">Contractor</option>
                            <option value="supplier">Supplier</option>
                        </select>
                    </Field>
                    <Field label="Company name">
                        <input
                            className={controlClass}
                            name="name"
                            placeholder="Acme d.o.o."
                            value={data.name}
                            onChange={handleChange}
                            required
                        />
                    </Field>
                    <Field label="Email">
                        <input
                            className={controlClass}
                            type="email"
                            name="email"
                            placeholder="contact@example.com"
                            value={data.email}
                            onChange={handleChange}
                            required
                        />
                    </Field>
                    <Field label="Contact person">
                        <input
                            className={controlClass}
                            name="contact_person"
                            placeholder="Full name"
                            value={data.contact_person}
                            onChange={handleChange}
                            required
                        />
                    </Field>
                    <Field label="City">
                        <input
                            className={controlClass}
                            name="city"
                            placeholder="Belgrade"
                            value={data.city}
                            onChange={handleChange}
                            required
                        />
                    </Field>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => navigate("/companies")}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </>
    );
};

export default CompanyForm;
