import { useCallback, useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Field from "../../components/ui/Field";
import { controlClass } from "../../components/ui/inputStyles";
import {
    approveSupplierRequest,
    listSupplierRegistrationRequests,
    rejectSupplierRequest,
    type SupplierRegistrationRequest,
    type SupplierRequestStatus,
} from "../../modules/admin/supplierRequests.api";
import { formatApiErrors } from "../../util/formatApiErrors";

function apiErrorMessage(err: unknown, fallback: string): string {
    const ax = err as { response?: { data?: unknown } };
    if (ax.response?.data) return formatApiErrors(ax.response.data);
    return fallback;
}

const STATUS_LABELS: Record<SupplierRequestStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
};

function statusBadgeClass(status: SupplierRequestStatus): string {
    switch (status) {
        case "pending":
            return "bg-amber-50 text-amber-800 ring-amber-200";
        case "approved":
            return "bg-emerald-50 text-emerald-800 ring-emerald-200";
        case "rejected":
            return "bg-rose-50 text-rose-800 ring-rose-200";
    }
}

function formatWhen(iso: string | null): string {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function SupplierRequestsPage() {
    const [filter, setFilter] = useState<SupplierRequestStatus | "all">("pending");
    const [requests, setRequests] = useState<SupplierRegistrationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<number | null>(null);
    const [rejectNotes, setRejectNotes] = useState("");
    const [rejectTarget, setRejectTarget] = useState<SupplierRegistrationRequest | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listSupplierRegistrationRequests(
                filter === "all" ? undefined : filter
            );
            setRequests(data);
        } catch (e) {
            setError(apiErrorMessage(e, "Failed to load supplier requests."));
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleApprove = async (req: SupplierRegistrationRequest) => {
        setActionId(req.id);
        setError(null);
        try {
            await approveSupplierRequest(req.id);
            await load();
        } catch (e) {
            setError(apiErrorMessage(e, "Approval failed."));
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        setActionId(rejectTarget.id);
        setError(null);
        try {
            await rejectSupplierRequest(rejectTarget.id, rejectNotes);
            setRejectTarget(null);
            setRejectNotes("");
            await load();
        } catch (e) {
            setError(apiErrorMessage(e, "Rejection failed."));
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Supplier compliance"
                description="Review supplier registration requests before accounts are created."
            />

            <div className="flex flex-wrap gap-2">
                {(["pending", "approved", "rejected", "all"] as const).map((value) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setFilter(value)}
                        className={
                            filter === value
                                ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
                                : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        }
                    >
                        {value === "all" ? "All" : STATUS_LABELS[value]}
                    </button>
                ))}
            </div>

            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <Card>
                    <p className="text-sm text-slate-600">Loading requests…</p>
                </Card>
            ) : requests.length === 0 ? (
                <Card>
                    <p className="text-sm text-slate-600">No supplier requests in this view.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <Card key={req.id} className="space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-semibold text-slate-900">
                                            {req.company_name}
                                        </h2>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(req.status)}`}
                                        >
                                            {STATUS_LABELS[req.status]}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {req.first_name} {req.last_name} · @{req.username} · {req.email}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {req.company_city}
                                        {req.company_phone ? ` · ${req.company_phone}` : ""}
                                        {req.contact_person ? ` · ${req.contact_person}` : ""}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Submitted {formatWhen(req.submitted_at)}
                                </p>
                            </div>

                            {req.review_notes ? (
                                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                    <span className="font-medium">Review notes:</span> {req.review_notes}
                                </p>
                            ) : null}

                            {req.status === "pending" ? (
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={actionId === req.id}
                                        onClick={() => void handleApprove(req)}
                                    >
                                        {actionId === req.id ? "Approving…" : "Approve & create account"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        disabled={actionId === req.id}
                                        onClick={() => {
                                            setRejectTarget(req);
                                            setRejectNotes("");
                                        }}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    Reviewed {formatWhen(req.reviewed_at)}
                                    {req.reviewed_by_name ? ` by ${req.reviewed_by_name}` : ""}
                                </p>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {rejectTarget ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <Card className="w-full max-w-md space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Reject {rejectTarget.company_name}?
                        </h3>
                        <Field label="Reason (required)">
                            <textarea
                                className={controlClass}
                                rows={4}
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                placeholder="Explain why this supplier request is rejected…"
                            />
                        </Field>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setRejectTarget(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                disabled={!rejectNotes.trim() || actionId === rejectTarget.id}
                                onClick={() => void handleReject()}
                            >
                                Confirm reject
                            </Button>
                        </div>
                    </Card>
                </div>
            ) : null}
        </div>
    );
}
