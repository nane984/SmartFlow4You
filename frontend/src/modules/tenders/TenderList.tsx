import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import type { Tender } from "./tender.type";
import { deleteData, getTenders } from "./tender.api";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LinkButton from "../../components/ui/LinkButton";

const TenderList = () => {
    const navigate = useNavigate();
    const [tenders, setTenders] = useState<Tender[]>([]);

    const handleDelete = async (id: number) => {
        await deleteData(id);
        setTenders((old) => old.filter((t) => t.id !== id));
    };

    useEffect(() => {
        getTenders().then((res) => {
            setTenders(res);
        });
    }, []);

    return (
        <>
            <PageHeader
                title="Tenders"
                description="Review and manage procurement opportunities."
                actions={
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => navigate("/tenders/new")}
                    >
                        + New tender
                    </Button>
                }
            />
            <Card className="overflow-hidden p-0">
                {tenders.length === 0 ? (
                    <p className="p-6 text-sm text-slate-600">No tenders yet. Create one to get started.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {tenders.map((t) => (
                            <li
                                key={t.id}
                                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <Link
                                        to={`/tenders/${t.id}`}
                                        className="text-base font-medium text-slate-900 no-underline hover:text-brand-700"
                                    >
                                        {t.title}
                                    </Link>
                                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                                        {t.status}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <LinkButton variant="secondary" size="sm" to={`/tenders/${t.id}`}>
                                        View
                                    </LinkButton>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(t.id)}
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

export default TenderList;
