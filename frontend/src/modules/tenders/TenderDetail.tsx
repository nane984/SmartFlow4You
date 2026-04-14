import type { Tender } from "./tender.type";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getTenderById } from "./tender.api";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";

const TenderDetail = () => {
    const { id } = useParams();
    const [tender, setTender] = useState<Tender | null>(null);

    useEffect(() => {
        if (id) {
            getTenderById(Number(id)).then((res) => setTender(res));
        }
    }, [id]);

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

    return (
        <>
            <PageHeader title={tender.title} description={`Status: ${tender.status}`} />
            <Card className="max-w-3xl">
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="font-medium text-slate-500">Source</dt>
                        <dd className="mt-1 text-slate-900">{tender.source || "—"}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-slate-500">Type</dt>
                        <dd className="mt-1 text-slate-900">{tender.type || "—"}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="font-medium text-slate-500">Description</dt>
                        <dd className="mt-1 whitespace-pre-wrap text-slate-800">{tender.description}</dd>
                    </div>
                </dl>
            </Card>
        </>
    );
};

export default TenderDetail;
