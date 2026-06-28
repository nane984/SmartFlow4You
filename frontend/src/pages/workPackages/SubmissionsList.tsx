import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SubmissionStatusBadge from "../../components/ui/SubmissionStatusBadge";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { getSubmissions } from "../../modules/workPackages/workPackage.api";
import type { WorkPackageSubmission } from "../../modules/workPackages/workPackage.types";
import BidTypeGuide from "../../components/procurement/BidTypeGuide";
import { resolveMediaUrl } from "../../util/mediaUrl";
import { fileNameFromUrl } from "../../util/fileNameFromUrl";

function formatWhen(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function SubmissionsList() {
    const [submissions, setSubmissions] = useState<WorkPackageSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            setSubmissions(await getSubmissions());
        } catch {
            setError("Could not load submissions.");
            setSubmissions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <>
            <PageHeader
                title="Work package bids"
                description="Contractor Excel submissions per work package (electrical, HVAC, civil, etc.)."
                actions={
                    <LinkButton to="/submissions/submit" variant="primary" size="sm">
                        Submit work package bid
                    </LinkButton>
                }
            />

            <BidTypeGuide variant="compare" className="mb-4" />

            {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            )}

            <Card className="overflow-hidden p-0">
                {loading ? (
                    <p className="p-6 text-sm text-slate-600">Loading submissions…</p>
                ) : submissions.length === 0 ? (
                    <div className="space-y-3 p-6 text-sm text-slate-600">
                        <p>No submissions yet.</p>
                        <LinkButton to="/submissions/submit" variant="primary" size="sm">
                            Submit work package bid
                        </LinkButton>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {submissions.map((s) => (
                            <li
                                key={s.id}
                                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="font-medium text-slate-900">{s.subcontractor_name}</p>
                                    <p className="mt-0.5 text-sm text-slate-600">
                                        Work package:{" "}
                                        {s.work_package_name && s.tender != null ? (
                                            <Link
                                                to={`/tenders/${s.tender}/work-packages/${s.work_package}`}
                                                className="text-brand-700 hover:underline"
                                            >
                                                {s.work_package_name}
                                            </Link>
                                        ) : s.work_package_name ? (
                                            s.work_package_name
                                        ) : (
                                            `#${s.work_package}`
                                        )}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <SubmissionStatusBadge status={s.status} />
                                        {s.price != null && s.price !== "" && (
                                            <span className="text-sm text-slate-600">Price: {s.price}</span>
                                        )}
                                        <span className="text-xs text-slate-500">
                                            {formatWhen(s.submitted_at)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                                    {s.uploaded_file ? (
                                        <a
                                            href={resolveMediaUrl(s.uploaded_file)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-brand-700 hover:underline"
                                        >
                                            {fileNameFromUrl(s.uploaded_file)} · Download
                                        </a>
                                    ) : null}
                                    <LinkButton
                                        to={`/submissions/submit?work_package=${s.work_package}`}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        New bid (same package)
                                    </LinkButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </>
    );
}
