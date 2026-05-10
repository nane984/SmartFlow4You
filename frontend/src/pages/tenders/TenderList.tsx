import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { deleteTender, getTenders } from "./tenderApi";
import type { Tender } from "./tenderTypes";

function formatWhen(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function TenderList() {
    const navigate = useNavigate();
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const data = await getTenders();
            setTenders(data);
        } catch {
            setLoadError("Could not load tenders.");
            setTenders([]);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

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
                description="Review and manage procurement opportunities."
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
                                    <p className="mt-1 text-xs text-slate-600">
                                        <span className="font-medium uppercase tracking-wide text-slate-500">
                                            {t.status}
                                        </span>
                                        {" · "}
                                        <span>Source: {t.source || "manual"}</span>
                                        {" · "}
                                        <span>Deadline: {formatWhen(t.deadline)}</span>
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <LinkButton variant="secondary" size="sm" to={`/tenders/${t.id}`}>
                                        View
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
