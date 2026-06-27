import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";
import { cn } from "../../components/ui/cn";
import AiPlanPanel from "./AiPlanPanel";
import ElectricalPicker from "./ElectricalPicker";
import FloorPlanEditor, { type PlanEditorTool } from "./FloorPlanEditor";
import FurniturePicker from "./FurniturePicker";
import PlacedElectricalPanel from "./PlacedElectricalPanel";
import PlacedFurniturePanel from "./PlacedFurniturePanel";
import PlacedStructurePanel from "./PlacedStructurePanel";
import StructurePicker from "./StructurePicker";
import Home3DViewer from "./Home3DViewer";
import { pickPlanBackgroundUrl } from "./planBackground";
import {
    getElectricalCatalog,
    getFurnitureCatalog,
    getStructureCatalog,
    getInteriorProject,
    requestAiSuggestions,
    saveProjectLayout,
} from "./projects.api";
import type {
    CatalogElectricalItem,
    CatalogFurnitureItem,
    CatalogStructureItem,
    ElectricalCategoryGroup,
    FurnitureCategoryGroup,
    LayoutData,
    PlanPlacedItem,
    PlanStructureItem,
    StructureCategoryGroup,
    StudioPlanMode,
} from "./types";
import {
    DEFAULT_LAYOUT,
    catalogItemToPlacement,
    electricalCatalogItemToPlacement,
    enrichElectricalFromCatalog,
    enrichFurnitureFromCatalog,
    enrichStructureFromCatalog,
    normalizeLayout,
    structureCatalogItemToPlacement,
} from "./types";

type StudioTab = "plan" | "view3d" | "ai";

export default function DesignStudioPage() {
    const { id } = useParams<{ id: string }>();
    const projectId = id ? Number.parseInt(id, 10) : NaN;

    const [clientName, setClientName] = useState("");
    const [description, setDescription] = useState("");
    const [floorplanUrl, setFloorplanUrl] = useState<string | null>(null);
    const [cadUrl, setCadUrl] = useState<string | null>(null);
    const [layout, setLayout] = useState<LayoutData>(DEFAULT_LAYOUT);
    const [furnitureCatalog, setFurnitureCatalog] = useState<FurnitureCategoryGroup[]>([]);
    const [electricalCatalog, setElectricalCatalog] = useState<ElectricalCategoryGroup[]>([]);
    const [structureCatalog, setStructureCatalog] = useState<StructureCategoryGroup[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
    const [wallTemplate, setWallTemplate] = useState<PlanStructureItem | null>(null);
    const [editorTool, setEditorTool] = useState<PlanEditorTool>("select");
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [tab, setTab] = useState<StudioTab>("plan");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [planExpanded, setPlanExpanded] = useState(false);
    const [planToolsOpen, setPlanToolsOpen] = useState(true);

    const planMode: StudioPlanMode = layout.planMode ?? "furniture";

    const placedItems = useMemo(() => {
        if (planMode === "electrical") return layout.electrical ?? [];
        if (planMode === "structure") return [];
        return layout.furniture;
    }, [planMode, layout.electrical, layout.furniture]);

    const selectedStructure = useMemo(
        () => (layout.structure ?? []).find((s) => s.id === selectedStructureId) ?? null,
        [layout.structure, selectedStructureId]
    );

    const selectedItem = useMemo(
        () => placedItems.find((f) => f.id === selectedId) ?? null,
        [placedItems, selectedId]
    );

    const load = useCallback(async () => {
        if (!Number.isFinite(projectId) || projectId < 1) return;
        setLoading(true);
        setError(null);
        try {
            const [project, furniture, electrical, structure] = await Promise.all([
                getInteriorProject(projectId),
                getFurnitureCatalog(),
                getElectricalCatalog(),
                getStructureCatalog(),
            ]);
            setClientName(project.client_name);
            setDescription(project.description);
            setFloorplanUrl(project.floorplan_url ?? null);
            setCadUrl(project.cad_url ?? null);
            const normalized = normalizeLayout(project.layout_data);
            setLayout({
                ...normalized,
                furniture: enrichFurnitureFromCatalog(normalized.furniture, furniture),
                electrical: enrichElectricalFromCatalog(normalized.electrical ?? [], electrical),
                structure: enrichStructureFromCatalog(normalized.structure ?? [], structure),
            });
            setAiSuggestions(project.ai_suggestions ?? []);
            setFurnitureCatalog(furniture);
            setElectricalCatalog(electrical);
            setStructureCatalog(structure);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load project.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!planExpanded) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setPlanExpanded(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [planExpanded]);

    useEffect(() => {
        document.body.style.overflow = planExpanded ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [planExpanded]);

    const handleSave = async () => {
        if (!Number.isFinite(projectId)) return;
        setSaving(true);
        setMessage(null);
        try {
            await saveProjectLayout(projectId, layout, layout.style);
            setMessage("Layout saved.");
        } catch (e) {
            setMessage(e instanceof Error ? e.message : "Save failed.");
        } finally {
            setSaving(false);
        }
    };

    const handleAiSuggest = async (prompt: string) => {
        const res = await requestAiSuggestions(projectId, prompt);
        setAiSuggestions(res.suggestions);
        return res;
    };

    const updateRoomSize = (field: "width" | "depth" | "height", value: number) => {
        setLayout((prev) => ({
            ...prev,
            room: { ...prev.room, [field]: value },
        }));
    };

    const setPlanMode = (mode: StudioPlanMode) => {
        setSelectedId(null);
        setSelectedStructureId(null);
        setWallTemplate(null);
        setEditorTool("select");
        setPlanToolsOpen(true);
        setLayout((prev) => ({ ...prev, planMode: mode }));
    };

    const setPlacedItems = (items: PlanPlacedItem[]) => {
        setLayout((prev) =>
            planMode === "electrical"
                ? { ...prev, electrical: items }
                : { ...prev, furniture: items }
        );
    };

    const setStructure = (items: PlanStructureItem[]) => {
        setLayout((prev) => ({ ...prev, structure: items }));
    };

    const handleSelectItem = (id: string | null) => {
        setSelectedId(id);
        if (id) setSelectedStructureId(null);
    };

    const handleSelectStructure = (id: string | null) => {
        setSelectedStructureId(id);
        if (id) setSelectedId(null);
    };

    const handlePickFurniture = (item: CatalogFurnitureItem) => {
        const placement = catalogItemToPlacement(item);
        setLayout((prev) => ({
            ...prev,
            furniture: [...prev.furniture, placement],
        }));
        setSelectedId(placement.id);
        setPlanToolsOpen(true);
        setMessage(`Placed ${item.name} — drag to position, then save.`);
    };

    const handlePickElectrical = (item: CatalogElectricalItem) => {
        const placement = electricalCatalogItemToPlacement(item);
        setLayout((prev) => ({
            ...prev,
            electrical: [...(prev.electrical ?? []), placement],
        }));
        setSelectedId(placement.id);
        setPlanToolsOpen(true);
        setMessage(`Placed ${item.name} — drag to position, then save.`);
    };

    const handlePickStructure = (item: CatalogStructureItem) => {
        const placement = structureCatalogItemToPlacement(item);
        setPlanToolsOpen(true);
        if (item.part_type === "wall") {
            setWallTemplate(placement);
            setEditorTool("wall");
            setMessage(`Draw ${item.name} — click two points on the plan. Color: ${item.color}`);
            return;
        }
        setLayout((prev) => ({
            ...prev,
            structure: [...(prev.structure ?? []), placement],
        }));
        setSelectedStructureId(placement.id);
        setEditorTool("select");
        setMessage(`Placed ${item.name} — drag to position, change color in panel.`);
    };

    const updateSelectedStructure = (item: PlanStructureItem) => {
        setStructure((layout.structure ?? []).map((s) => (s.id === item.id ? item : s)));
    };

    const removeSelectedStructure = () => {
        if (!selectedStructureId) return;
        setStructure((layout.structure ?? []).filter((s) => s.id !== selectedStructureId));
        setSelectedStructureId(null);
    };

    const rotateSelectedStructure = () => {
        if (!selectedStructureId) return;
        setStructure(
            (layout.structure ?? []).map((s) =>
                s.id === selectedStructureId ? { ...s, rotation: ((s.rotation ?? 0) + 90) % 360 } : s
            )
        );
    };

    const updateSelectedItem = (item: PlanPlacedItem) => {
        setPlacedItems(
            placedItems.map((f) => (f.id === item.id ? item : f))
        );
    };

    const removeSelectedItem = () => {
        if (!selectedId) return;
        setPlacedItems(placedItems.filter((f) => f.id !== selectedId));
        setSelectedId(null);
    };

    const rotateSelectedItem = () => {
        if (!selectedId) return;
        setPlacedItems(
            placedItems.map((f) =>
                f.id === selectedId ? { ...f, rotation: (f.rotation + 90) % 360 } : f
            )
        );
    };

    if (loading) {
        return (
            <Card>
                <p className="text-sm text-slate-600">Loading design studio…</p>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="space-y-3">
                <p className="text-sm text-rose-700">{error}</p>
                <LinkButton to="/interior" variant="secondary" size="sm">
                    Back to projects
                </LinkButton>
            </Card>
        );
    }

    const tabs: { id: StudioTab; label: string }[] = [
        { id: "plan", label: "2D plan" },
        { id: "view3d", label: "3D view" },
        { id: "ai", label: "AI planner" },
    ];

    const planBackground = pickPlanBackgroundUrl(floorplanUrl, cadUrl);

    const floorPlanEditor = (
        <FloorPlanEditor
            room={layout.room}
            placedItems={placedItems}
            structure={layout.structure ?? []}
            structureEditable={planMode === "structure"}
            planMode={planMode}
            selectedId={selectedId}
            selectedStructureId={selectedStructureId}
            editorTool={editorTool}
            wallTemplate={wallTemplate}
            onEditorToolChange={setEditorTool}
            onSelect={handleSelectItem}
            onSelectStructure={handleSelectStructure}
            onPlacedItemsChange={setPlacedItems}
            onStructureChange={setStructure}
            backgroundUrl={planBackground?.url ?? null}
            backgroundKind={planBackground?.kind ?? "unknown"}
            backgroundDownloadUrl={cadUrl ?? floorplanUrl}
            expanded={planExpanded}
            onToggleExpanded={() => setPlanExpanded((v) => !v)}
        />
    );

    const catalogAndProperties = (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="max-h-[320px] min-h-[200px]">
                {planMode === "furniture" ? (
                    <FurniturePicker categories={furnitureCatalog} onPick={handlePickFurniture} />
                ) : planMode === "electrical" ? (
                    <ElectricalPicker categories={electricalCatalog} onPick={handlePickElectrical} />
                ) : (
                    <StructurePicker
                        categories={structureCatalog}
                        onPick={handlePickStructure}
                        selectedWallCatalogId={wallTemplate?.catalogItemId ?? null}
                    />
                )}
            </div>
            <div className="max-h-[320px] overflow-y-auto">
                {planMode === "structure" ? (
                    <PlacedStructurePanel
                        item={selectedStructure}
                        roomHeight={layout.room.height}
                        onChange={updateSelectedStructure}
                        onRemove={removeSelectedStructure}
                        onRotate={rotateSelectedStructure}
                    />
                ) : planMode === "furniture" ? (
                    <PlacedFurniturePanel
                        item={selectedItem}
                        roomHeight={layout.room.height}
                        onChange={updateSelectedItem}
                        onRemove={removeSelectedItem}
                        onRotate={rotateSelectedItem}
                    />
                ) : (
                    <PlacedElectricalPanel
                        item={selectedItem}
                        roomHeight={layout.room.height}
                        onChange={updateSelectedItem}
                        onRemove={removeSelectedItem}
                        onRotate={rotateSelectedItem}
                    />
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title={clientName || "Design studio"}
                description={
                    description ||
                    "Switch between furniture layout and electrical wire plan on the same floor drawing."
                }
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={saving}
                            onClick={() => void handleSave()}
                        >
                            {saving ? "Saving…" : "Save layout"}
                        </Button>
                        <LinkButton to="/interior/catalog" variant="secondary" size="sm">
                            Furniture catalog
                        </LinkButton>
                        <LinkButton to="/interior/electrical-catalog" variant="secondary" size="sm">
                            Electrical catalog
                        </LinkButton>
                        <LinkButton to="/interior/structure-catalog" variant="secondary" size="sm">
                            Structure catalog
                        </LinkButton>
                        <LinkButton to="/interior" variant="secondary" size="sm">
                            ← Projects
                        </LinkButton>
                    </div>
                }
            />

            {message ? (
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-900">
                    {message}
                </div>
            ) : null}

            <Card className="flex flex-wrap items-end gap-4">
                <div className="w-full sm:w-auto">
                    <span className="text-xs font-medium text-slate-600">Plan mode</span>
                    <div className="mt-1 flex gap-1 rounded-lg bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => setPlanMode("furniture")}
                            className={cn(
                                "rounded-md px-4 py-2 text-sm font-medium",
                                planMode === "furniture"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            Furniture
                        </button>
                        <button
                            type="button"
                            onClick={() => setPlanMode("electrical")}
                            className={cn(
                                "rounded-md px-4 py-2 text-sm font-medium",
                                planMode === "electrical"
                                    ? "bg-amber-100 text-amber-950 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            Electrical
                        </button>
                        <button
                            type="button"
                            onClick={() => setPlanMode("structure")}
                            className={cn(
                                "rounded-md px-4 py-2 text-sm font-medium",
                                planMode === "structure"
                                    ? "bg-stone-200 text-stone-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            Walls & openings
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600">Room width (m)</label>
                    <input
                        type="number"
                        min={2}
                        step={0.5}
                        className={`${controlClass} mt-1 w-24`}
                        value={layout.room.width}
                        onChange={(e) => updateRoomSize("width", Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600">Room depth (m)</label>
                    <input
                        type="number"
                        min={2}
                        step={0.5}
                        className={`${controlClass} mt-1 w-24`}
                        value={layout.room.depth}
                        onChange={(e) => updateRoomSize("depth", Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600">Ceiling height (m)</label>
                    <input
                        type="number"
                        min={2}
                        step={0.1}
                        className={`${controlClass} mt-1 w-24`}
                        value={layout.room.height}
                        onChange={(e) => updateRoomSize("height", Number(e.target.value))}
                    />
                </div>
            </Card>

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={cn(
                            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                            tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "plan" ? (
                planExpanded ? (
                    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-100 p-3 pt-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {clientName} — floor plan
                                </p>
                                <p className="text-xs text-slate-500">
                                    {planMode === "electrical"
                                        ? "Electrical"
                                        : planMode === "structure"
                                          ? "Structure"
                                          : "Furniture"}{" "}
                                    mode · Esc to exit
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="primary"
                                    disabled={saving}
                                    onClick={() => void handleSave()}
                                >
                                    {saving ? "Saving…" : "Save"}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPlanExpanded(false)}
                                >
                                    Exit full screen
                                </Button>
                            </div>
                        </div>
                        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
                            {floorPlanEditor}
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Card className="p-3">{floorPlanEditor}</Card>

                        <div className="rounded-xl border border-slate-200 bg-white">
                            <button
                                type="button"
                                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                                onClick={() => setPlanToolsOpen((o) => !o)}
                            >
                                <span>
                                    Catalog &amp; properties
                                    {planMode === "electrical"
                                        ? " (electrical)"
                                        : planMode === "structure"
                                          ? " (walls & openings)"
                                          : " (furniture)"}
                                </span>
                                <span className="text-slate-500">{planToolsOpen ? "▲ Hide" : "▼ Show"}</span>
                            </button>
                            {planToolsOpen ? (
                                <div className="border-t border-slate-200 p-4">{catalogAndProperties}</div>
                            ) : null}
                        </div>
                    </div>
                )
            ) : null}

            {tab === "view3d" ? (
                <Card>
                    <Home3DViewer layout={layout} showElectrical={planMode === "electrical"} />
                </Card>
            ) : null}

            {tab === "ai" ? (
                <Card>
                    <AiPlanPanel
                        onSuggest={handleAiSuggest}
                        onApplyLayout={(proposed) => {
                            setLayout(normalizeLayout(proposed));
                            setPlanMode("furniture");
                            setTab("plan");
                            setMessage("AI layout applied — review and save when ready.");
                        }}
                        lastSuggestions={aiSuggestions}
                    />
                </Card>
            ) : null}
        </div>
    );
}
