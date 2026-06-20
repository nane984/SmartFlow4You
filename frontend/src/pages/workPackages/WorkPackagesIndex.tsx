import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { getWorkPackages } from "../../modules/workPackages/workPackage.api";
import type { WorkPackage } from "../../modules/workPackages/workPackage.types";
import { resolveMediaUrl } from "../../util/mediaUrl";
import { fileNameFromUrl } from "../../util/fileNameFromUrl";

export default function WorkPackagesIndex() {
    const [packages, setPackages] = useState<WorkPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            setPackages(await getWorkPackages());
        } catch {
            setError("Could not load work packages.");
            setPackages([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const byTender = useMemo(() => {
        const map = new Map<number, WorkPackage[]>();
        for (const wp of packages) {
            const list = map.get(wp.tender) ?? [];
            list.push(wp);
            map.set(wp.tender, list);
        }
        return [...map.entries()].sort(([a], [b]) => a - b);
    }, [packages]);

    return (
        <>
            <PageHeader
                title="Work packages"
                description="All tender work packages. Open a tender to create new packages, or view submissions per package."
                actions={
                    <>
                        <LinkButton to="/tenders" variant="secondary" size="sm">
                            Tenders
                        </LinkButton>
                        <LinkButton to="/submissions/submit" variant="primary" size="sm">
                            Submit a bid
                        </LinkButton>
                    </>
                }
            />

            {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            )}

            <Card className="overflow-hidden p-0">
                {loading ? (
                    <p className="p-6 text-sm text-slate-600">Loading work packages…</p>
                ) : packages.length === 0 ? (
                    <div className="space-y-3 p-6 text-sm text-slate-600">
                        <p>No work packages yet.</p>
                        <p>
                            Open a{" "}
                            <Link to="/tenders" className="font-medium text-brand-700 hover:underline">
                                tender
                            </Link>{" "}
                            and add work packages from the tender detail page.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {byTender.map(([tenderId, wps]) => (
                            <section key={tenderId} className="p-4">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        Tender #{tenderId}
                                    </h2>
                                    <LinkButton
                                        to={`/tenders/${tenderId}#work-packages`}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        Manage on tender
                                    </LinkButton>
                                </div>
                                <ul className="space-y-3">
                                    {wps.map((wp) => (
                                        <li
                                            key={wp.id}
                                            className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <Link
                                                    to={`/tenders/${tenderId}/work-packages/${wp.id}`}
                                                    className="font-medium text-slate-900 no-underline hover:text-brand-700"
                                                >
                                                    {wp.name}
                                                </Link>
                                                {wp.description ? (
                                                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                                                        {wp.description}
                                                    </p>
                                                ) : null}
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {wp.submission_count ?? 0} submission(s)
                                                    {wp.template_file ? (
                                                        <>
                                                            {" · "}
                                                            <a
                                                                href={resolveMediaUrl(wp.template_file)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-brand-700 hover:underline"
                                                            >
                                                                Template ({fileNameFromUrl(wp.template_file)})
                                                            </a>
                                                        </>
                                                    ) : null}
                                                </p>
                                            </div>
                                            <LinkButton
                                                to={`/tenders/${tenderId}/work-packages/${wp.id}`}
                                                variant="secondary"
                                                size="sm"
                                            >
                                                View & submissions
                                            </LinkButton>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </Card>
        </>
    );
}
