import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LinkButton from "../../components/ui/LinkButton";
import Field from "../../components/ui/Field";
import { controlClass } from "../../components/ui/inputStyles";
import { getCompanies } from "../../modules/companies/company.api";
import type { Company } from "../../modules/companies/company.type";
import { formatApiErrors } from "../../util/formatApiErrors";
import {
    CHECK_FREQUENCY_OPTIONS,
    SOURCE_TYPE_OPTIONS,
    checkFrequencyLabel,
    executionStatusLabel,
    type CheckFrequency,
    type SourceType,
    type TenderDefinition,
    type TenderDefinitionExecutionLog,
    type TenderDefinitionRunTestResult,
    type TenderNotification,
} from "../../modules/tenderDefinitions/tenderDefinition.types";
import {
    createTenderDefinition,
    deleteTenderDefinition,
    getTenderDefinitionLogs,
    getTenderDefinitions,
    getTenderNotifications,
    markAllTenderNotificationsRead,
    markTenderNotificationRead,
    runTenderDefinition,
    runTestTenderDefinition,
    toggleTenderDefinitionActive,
    updateTenderDefinition,
} from "../../modules/tenderDefinitions/tenderDefinition.api";

type Tab = "definitions" | "history" | "notifications";

type SourceDraft = {
    name: string;
    api_url: string;
    source_type: SourceType;
    enabled: boolean;
};

const EMPTY_SOURCE: SourceDraft = {
    name: "",
    api_url: "",
    source_type: "api",
    enabled: true,
};

type FormState = {
    name: string;
    description: string;
    default_investor: number | "";
    check_frequency: CheckFrequency;
    is_active: boolean;
    keywordsText: string;
    sources: SourceDraft[];
};

const EMPTY_FORM: FormState = {
    name: "",
    description: "",
    default_investor: "",
    check_frequency: "6h",
    is_active: true,
    keywordsText: "",
    sources: [{ ...EMPTY_SOURCE }],
};

function formatWhen(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function isInvestor(c: Company): boolean {
    return (c.company_type ?? "").toLowerCase() === "investor";
}

export default function TenderDefinitionManagement() {
    const [tab, setTab] = useState<Tab>("definitions");
    const [definitions, setDefinitions] = useState<TenderDefinition[]>([]);
    const [logs, setLogs] = useState<TenderDefinitionExecutionLog[]>([]);
    const [notifications, setNotifications] = useState<TenderNotification[]>([]);
    const [investors, setInvestors] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [runningId, setRunningId] = useState<number | null>(null);
    const [testingId, setTestingId] = useState<number | null>(null);
    const [testResult, setTestResult] = useState<TenderDefinitionRunTestResult | null>(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [defs, logRows, notes, companies] = await Promise.all([
                getTenderDefinitions(),
                getTenderDefinitionLogs(),
                getTenderNotifications(),
                getCompanies(),
            ]);
            setDefinitions(defs);
            setLogs(logRows);
            setNotifications(notes);
            setInvestors(companies.filter(isInvestor));
        } catch {
            setError("Could not load tender definition data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.is_read).length,
        [notifications],
    );

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const startEdit = (def: TenderDefinition) => {
        setEditingId(def.id);
        setForm({
            name: def.name,
            description: def.description ?? "",
            default_investor: def.default_investor,
            check_frequency: def.check_frequency,
            is_active: def.is_active,
            keywordsText: def.keywords.map((k) => k.keyword).join("\n"),
            sources:
                def.sources.length > 0
                    ? def.sources.map((s) => ({
                          name: s.name,
                          api_url: s.api_url,
                          source_type: s.source_type,
                          enabled: s.enabled,
                      }))
                    : [{ ...EMPTY_SOURCE }],
        });
        setTab("definitions");
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.name.trim()) {
            setError("Name is required.");
            return;
        }
        if (!form.default_investor) {
            setError("Select a default investor company.");
            return;
        }
        const keyword_list = form.keywordsText
            .split(/[\n,;]+/)
            .map((k) => k.trim())
            .filter(Boolean);
        const source_list = form.sources.filter((s) => s.name.trim() && s.api_url.trim());

        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                default_investor: form.default_investor,
                check_frequency: form.check_frequency,
                is_active: form.is_active,
                keyword_list,
                source_list,
            };
            if (editingId) {
                await updateTenderDefinition(editingId, payload);
            } else {
                await createTenderDefinition(payload);
            }
            resetForm();
            await loadAll();
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data) {
                setError(formatApiErrors(err.response.data));
            } else {
                setError("Could not save tender definition.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Delete definition "${name}"?`)) return;
        try {
            await deleteTenderDefinition(id);
            if (editingId === id) resetForm();
            await loadAll();
        } catch {
            setError("Delete failed.");
        }
    };

    const handleRun = async (id: number) => {
        setRunningId(id);
        setError(null);
        setTestResult(null);
        try {
            await runTenderDefinition(id);
            await loadAll();
        } catch {
            setError("Manual run failed.");
        } finally {
            setRunningId(null);
        }
    };

    const handleRunTest = async (id: number, name: string) => {
        setTestingId(id);
        setError(null);
        try {
            const result = await runTestTenderDefinition(id);
            setTestResult({ ...result, definition_name: result.definition_name || name });
        } catch {
            setError("Test run failed. Check source URL and that the backend is running.");
        } finally {
            setTestingId(null);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await toggleTenderDefinitionActive(id);
            await loadAll();
        } catch {
            setError("Could not update active status.");
        }
    };

    const updateSource = (index: number, patch: Partial<SourceDraft>) => {
        setForm((prev) => ({
            ...prev,
            sources: prev.sources.map((s, i) => (i === index ? { ...s, ...patch } : s)),
        }));
    };

    return (
        <>
            <PageHeader
                title="Tender Definition Management"
                description="Define automated rules to discover public procurements and import matching tenders."
                actions={
                    <LinkButton to="/tenders" variant="secondary" size="sm">
                        ← Tenders
                    </LinkButton>
                }
            />

            {testResult ? (
                <Card className="mb-4 border-indigo-200 bg-indigo-50/40">
                    <h3 className="text-sm font-semibold text-slate-900">
                        Test result — {testResult.definition_name}
                    </h3>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                            <dt className="text-slate-500">Received</dt>
                            <dd className="font-semibold text-slate-900">{testResult.received_count}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Keyword matches</dt>
                            <dd className="font-semibold text-slate-900">{testResult.matched_count}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Already imported</dt>
                            <dd className="font-semibold text-slate-900">{testResult.duplicate_count}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">New imports</dt>
                            <dd className="font-semibold text-emerald-700">{testResult.new_import_count}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Ignored</dt>
                            <dd className="font-semibold text-slate-900">{testResult.ignored_count}</dd>
                        </div>
                    </dl>
                    {testResult.errors.length > 0 ? (
                        <p className="mt-2 text-xs text-amber-800">
                            Warnings: {testResult.errors.join("; ")}
                        </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">
                        Dry run only — no tenders were created. Use &quot;Run now&quot; to import.
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => setTestResult(null)}
                    >
                        Dismiss
                    </Button>
                </Card>
            ) : null}

            {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            )}

            <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                {(
                    [
                        ["definitions", "Definitions"],
                        ["history", "Execution history"],
                        ["notifications", `Notifications${unreadCount ? ` (${unreadCount})` : ""}`],
                    ] as const
                ).map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTab(key)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            tab === key
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <Card>
                    <p className="text-sm text-slate-600">Loading…</p>
                </Card>
            ) : null}

            {!loading && tab === "definitions" ? (
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-base font-semibold text-slate-900">
                                {editingId ? "Edit definition" : "New definition"}
                            </h2>
                            {editingId ? (
                                <Button type="button" variant="secondary" size="sm" onClick={resetForm}>
                                    Cancel edit
                                </Button>
                            ) : null}
                        </div>
                        <form className="space-y-4" onSubmit={handleSave}>
                            <Field label="Name">
                                <input
                                    className={controlClass}
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Electrical installation tenders in Serbia"
                                    required
                                />
                            </Field>
                            <Field label="Description">
                                <textarea
                                    className={`${controlClass} min-h-[72px]`}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </Field>
                            <Field label="Default investor">
                                <select
                                    className={controlClass}
                                    value={form.default_investor === "" ? "" : String(form.default_investor)}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            default_investor:
                                                e.target.value === "" ? "" : Number(e.target.value),
                                        })
                                    }
                                    required
                                >
                                    <option value="">Select investor…</option>
                                    {investors.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Check frequency">
                                <select
                                    className={controlClass}
                                    value={form.check_frequency}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            check_frequency: e.target.value as CheckFrequency,
                                        })
                                    }
                                >
                                    {CHECK_FREQUENCY_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Keywords" hint="One per line or comma-separated. Leave empty to match all.">
                                <textarea
                                    className={`${controlClass} min-h-[88px] font-mono text-sm`}
                                    value={form.keywordsText}
                                    onChange={(e) => setForm({ ...form, keywordsText: e.target.value })}
                                    placeholder={"electrical\nHVAC\nconstruction"}
                                />
                            </Field>
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-slate-800">Procurement sources</p>
                                {form.sources.map((source, index) => (
                                    <div
                                        key={index}
                                        className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3"
                                    >
                                        <input
                                            className={controlClass}
                                            placeholder="Source name"
                                            value={source.name}
                                            onChange={(e) => updateSource(index, { name: e.target.value })}
                                        />
                                        <input
                                            className={controlClass}
                                            placeholder="http://127.0.0.1:8000/api/mock/procurements/"
                                            value={source.api_url}
                                            onChange={(e) => updateSource(index, { api_url: e.target.value })}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            <select
                                                className={controlClass}
                                                value={source.source_type}
                                                onChange={(e) =>
                                                    updateSource(index, {
                                                        source_type: e.target.value as SourceType,
                                                    })
                                                }
                                            >
                                                {SOURCE_TYPE_OPTIONS.map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={source.enabled}
                                                    onChange={(e) =>
                                                        updateSource(index, { enabled: e.target.checked })
                                                    }
                                                />
                                                Enabled
                                            </label>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                        setForm((prev) => ({
                                            ...prev,
                                            sources: [...prev.sources, { ...EMPTY_SOURCE }],
                                        }))
                                    }
                                >
                                    + Add source
                                </Button>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                />
                                Active (included in scheduled checks)
                            </label>
                            <Button type="submit" disabled={saving}>
                                {saving ? "Saving…" : editingId ? "Update definition" : "Create definition"}
                            </Button>
                        </form>
                    </Card>

                    <Card className="overflow-hidden p-0">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <h2 className="text-base font-semibold text-slate-900">Definitions</h2>
                        </div>
                        {definitions.length === 0 ? (
                            <p className="p-4 text-sm text-slate-600">No definitions yet.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {definitions.map((def) => (
                                    <li key={def.id} className="space-y-2 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="font-medium text-slate-900">{def.name}</p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {checkFrequencyLabel(def.check_frequency)} ·{" "}
                                                    {def.keywords.length} keyword(s) · {def.sources.length}{" "}
                                                    source(s)
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Last checked: {formatWhen(def.last_checked)}
                                                </p>
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    def.is_active
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {def.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => startEdit(def)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleToggle(def.id)}
                                            >
                                                {def.is_active ? "Deactivate" : "Activate"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                disabled={testingId === def.id}
                                                onClick={() => handleRunTest(def.id, def.name)}
                                            >
                                                {testingId === def.id ? "Testing…" : "Run test"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="sm"
                                                disabled={runningId === def.id}
                                                onClick={() => handleRun(def.id)}
                                            >
                                                {runningId === def.id ? "Running…" : "Run now"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(def.id, def.name)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            ) : null}

            {!loading && tab === "history" ? (
                <Card className="overflow-hidden p-0">
                    {logs.length === 0 ? (
                        <p className="p-4 text-sm text-slate-600">No execution history yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-left text-slate-600">
                                    <tr>
                                        <th className="px-4 py-2 font-medium">Definition</th>
                                        <th className="px-4 py-2 font-medium">Started</th>
                                        <th className="px-4 py-2 font-medium">Status</th>
                                        <th className="px-4 py-2 font-medium">Received</th>
                                        <th className="px-4 py-2 font-medium">Matched</th>
                                        <th className="px-4 py-2 font-medium">Imported</th>
                                        <th className="px-4 py-2 font-medium">Duplicates</th>
                                        <th className="px-4 py-2 font-medium">Ignored</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.map((log) => {
                                        const def = definitions.find((d) => d.id === log.tender_definition);
                                        return (
                                            <tr key={log.id}>
                                                <td className="px-4 py-2">
                                                    {def?.name ?? `#${log.tender_definition}`}
                                                </td>
                                                <td className="px-4 py-2">{formatWhen(log.started_at)}</td>
                                                <td className="px-4 py-2">
                                                    {executionStatusLabel(log.status)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {log.received_count ?? log.processed_count}
                                                </td>
                                                <td className="px-4 py-2">{log.matched_count ?? "—"}</td>
                                                <td className="px-4 py-2">{log.imported_count}</td>
                                                <td className="px-4 py-2">{log.duplicate_count ?? "—"}</td>
                                                <td className="px-4 py-2">{log.skipped_count}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            ) : null}

            {!loading && tab === "notifications" ? (
                <Card className="space-y-3">
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => void markAllTenderNotificationsRead().then(loadAll)}
                        >
                            Mark all read
                        </Button>
                    </div>
                    {notifications.length === 0 ? (
                        <p className="text-sm text-slate-600">No notifications.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                            {notifications.map((note) => (
                                <li
                                    key={note.id}
                                    className={`flex flex-wrap items-start justify-between gap-3 p-4 ${
                                        note.is_read ? "bg-white" : "bg-sky-50/50"
                                    }`}
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">{note.title}</p>
                                        <p className="mt-1 text-sm text-slate-600">{note.message}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {formatWhen(note.created_at)}
                                        </p>
                                        {note.link ? (
                                            <Link
                                                to={note.link}
                                                className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
                                            >
                                                {note.tender_id ? "View tender →" : "View tenders →"}
                                            </Link>
                                        ) : null}
                                    </div>
                                    {!note.is_read ? (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                void markTenderNotificationRead(note.id).then(loadAll)
                                            }
                                        >
                                            Mark read
                                        </Button>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            ) : null}
        </>
    );
}
