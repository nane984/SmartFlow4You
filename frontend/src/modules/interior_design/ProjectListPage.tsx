import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";
import { formatApiErrors } from "../../util/formatApiErrors";
import {
    createInteriorProject,
    deleteInteriorProject,
    listInteriorProjects,
} from "./projects.api";
import type { InteriorProject } from "./types";

function formatDate(value: string | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

export default function ProjectListPage() {
    const [projects, setProjects] = useState<InteriorProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [clientName, setClientName] = useState("");
    const [description, setDescription] = useState("");
    const [floorplan, setFloorplan] = useState<File | null>(null);
    const [cadFile, setCadFile] = useState<File | null>(null);
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setProjects(await listInteriorProjects());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load projects.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName.trim()) return;
        setCreating(true);
        try {
            const project = await createInteriorProject({
                client_name: clientName.trim(),
                description: description.trim(),
                floorplan_file: floorplan ?? undefined,
                cad_file: cadFile ?? undefined,
            });
            setShowCreate(false);
            setClientName("");
            setDescription("");
            setFloorplan(null);
            setCadFile(null);
            await load();
            window.location.assign(`/interior/studio/${project.id}`);
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(
                ax.response?.data ? formatApiErrors(ax.response.data) : "Failed to create project."
            );
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this project?")) return;
        try {
            await deleteInteriorProject(id);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Delete failed.");
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Interior design studio"
                description="Upload CAD floor plans, arrange furniture, walk through spaces in 3D, and get AI layout suggestions."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <LinkButton to="/interior/catalog" variant="secondary" size="sm">
                            Furniture catalog
                        </LinkButton>
                        <LinkButton to="/interior/electrical-catalog" variant="secondary" size="sm">
                            Electrical catalog
                        </LinkButton>
                        <LinkButton to="/interior/structure-catalog" variant="secondary" size="sm">
                            Structure catalog
                        </LinkButton>
                        <Button type="button" size="sm" onClick={() => setShowCreate((v) => !v)}>
                            {showCreate ? "Cancel" : "New project"}
                        </Button>
                    </div>
                }
            />

            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
                    {error}
                </div>
            ) : null}

            {showCreate ? (
                <Card className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Create project</h2>
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => void handleCreate(e)}>
                        <Field label="Project / client name">
                            <input
                                className={controlClass}
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                required
                            />
                        </Field>
                        <Field label="Description">
                            <input
                                className={controlClass}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Field>
                        <Field label="Floor plan (PDF / image)">
                            <input
                                type="file"
                                className={controlClass}
                                accept=".pdf,.png,.jpg,.jpeg,.webp"
                                onChange={(e) => setFloorplan(e.target.files?.[0] ?? null)}
                            />
                        </Field>
                        <Field label="CAD file (optional)">
                            <input
                                type="file"
                                className={controlClass}
                                accept=".dwg,.dxf,.pdf,.svg"
                                onChange={(e) => setCadFile(e.target.files?.[0] ?? null)}
                            />
                        </Field>
                        <div className="md:col-span-2">
                            <Button type="submit" disabled={creating}>
                                {creating ? "Creating…" : "Create & open studio"}
                            </Button>
                        </div>
                    </form>
                </Card>
            ) : null}

            <Card className="overflow-hidden p-0">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">Your projects</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50/80">
                            <tr className="text-left text-slate-600">
                                <th className="px-6 py-3 font-medium">Project</th>
                                <th className="px-6 py-3 font-medium">Updated</th>
                                <th className="px-6 py-3 font-medium">Files</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-5 text-slate-500">
                                        Loading…
                                    </td>
                                </tr>
                            ) : projects.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-5 text-slate-500">
                                        No projects yet. Create one to start designing.
                                    </td>
                                </tr>
                            ) : (
                                projects.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/80">
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/interior/studio/${p.id}`}
                                                className="font-semibold text-brand-800 hover:underline"
                                            >
                                                {p.client_name}
                                            </Link>
                                            {p.description ? (
                                                <p className="mt-0.5 text-xs text-slate-500">{p.description}</p>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {formatDate(p.updated_at)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {[p.floorplan_url && "Floor plan", p.cad_url && "CAD"]
                                                .filter(Boolean)
                                                .join(", ") || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <LinkButton
                                                    to={`/interior/studio/${p.id}`}
                                                    variant="primary"
                                                    size="sm"
                                                >
                                                    Open studio
                                                </LinkButton>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => void handleDelete(p.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
