import { useCallback, useEffect, useState } from "react";
import Card from "../ui/Card";
import LinkButton from "../ui/LinkButton";
import WorkPackageForm from "./WorkPackageForm";
import WorkPackageList from "./WorkPackageList";
import { getWorkPackages } from "../../modules/workPackages/workPackage.api";
import type { WorkPackage } from "../../modules/workPackages/workPackage.types";

type WorkPackagesSectionProps = {
    tenderId: number;
};

export default function WorkPackagesSection({ tenderId }: WorkPackagesSectionProps) {
    const [packages, setPackages] = useState<WorkPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const data = await getWorkPackages(tenderId);
            setPackages(data);
        } catch {
            setError("Could not load work packages.");
            setPackages([]);
        } finally {
            setLoading(false);
        }
    }, [tenderId]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleCreated = (wp: WorkPackage) => {
        setPackages((prev) => [...prev, wp].sort((a, b) => a.name.localeCompare(b.name)));
    };

    return (
        <Card id="work-packages" className="mt-6 max-w-5xl scroll-mt-20 space-y-0 overflow-hidden p-0">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">Work packages</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Admin-defined scopes with Excel templates for subcontractor bids
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <LinkButton variant="secondary" size="sm" to="/work-packages">
                        All work packages
                    </LinkButton>
                    <LinkButton variant="secondary" size="sm" to="/submissions">
                        All submissions
                    </LinkButton>
                    <LinkButton variant="primary" size="sm" to="/submissions/submit">
                        Submit a bid
                    </LinkButton>
                </div>
            </div>
            {error && (
                <p className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-800">{error}</p>
            )}
            <div className="px-4 py-4">
                <WorkPackageForm tenderId={tenderId} onCreated={handleCreated} />
            </div>
            {loading ? (
                <p className="px-4 py-6 text-sm text-slate-600">Loading work packages…</p>
            ) : (
                <WorkPackageList tenderId={tenderId} packages={packages} />
            )}
        </Card>
    );
}
