import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/ui/Button";
import {
    isRenderablePlanBackground,
    type PlanBackgroundKind,
} from "./planBackground";
import {
    contentOffsetPx,
    drawDimensionRulers,
    drawStructureLayer,
    drawSweetHomeItem,
    drawSweetHomeRoom,
    snapToGrid,
    totalCanvasSizePx,
    WALL_THICKNESS_M,
} from "./planDrawing";
import { usePlanBackground } from "./usePlanBackground";
import { useItemSymbols } from "./useItemSymbols";
import type { PlanPlacedItem, PlanStructureItem, RoomSpec, StudioPlanMode } from "./types";
import {
    distanceToStructureWall,
    isStructureOpening,
    isStructureWall,
    wallLengthM,
} from "./types";

export const PLAN_SCALE = 80;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 5;
const DEFAULT_ZOOM = 1.45;
const SNAP_STEP = 0.1;
const MIN_WALL_LENGTH = 0.2;
const WALL_HIT_THRESHOLD = 0.18;

export type PlanEditorTool = "select" | "wall";

type Props = {
    room: RoomSpec;
    placedItems: PlanPlacedItem[];
    structure: PlanStructureItem[];
    structureEditable?: boolean;
    planMode: StudioPlanMode;
    selectedId: string | null;
    selectedStructureId: string | null;
    editorTool: PlanEditorTool;
    wallTemplate: PlanStructureItem | null;
    onEditorToolChange: (tool: PlanEditorTool) => void;
    onSelect: (id: string | null) => void;
    onSelectStructure: (id: string | null) => void;
    onPlacedItemsChange: (items: PlanPlacedItem[]) => void;
    onStructureChange: (items: PlanStructureItem[]) => void;
    backgroundUrl?: string | null;
    backgroundKind?: PlanBackgroundKind;
    backgroundDownloadUrl?: string | null;
    expanded?: boolean;
    onToggleExpanded?: () => void;
};

function clampZoom(value: number): number {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function openingsAsPlacedItems(items: PlanStructureItem[]): PlanPlacedItem[] {
    return items
        .filter(isStructureOpening)
        .map((o) => ({
            id: o.id,
            type: o.partType,
            label: o.label,
            x: o.x ?? 0,
            y: o.y ?? 0,
            rotation: o.rotation ?? 0,
            width: o.width ?? 1,
            depth: o.depth,
            height: o.height,
            color: o.color,
            imageUrl: o.imageUrl,
            cadUrl: o.cadUrl,
        }));
}

export default function FloorPlanEditor({
    room,
    placedItems,
    structure,
    structureEditable = false,
    planMode,
    selectedId,
    selectedStructureId,
    editorTool,
    wallTemplate,
    onEditorToolChange,
    onSelect,
    onSelectStructure,
    onPlacedItemsChange,
    onStructureChange,
    backgroundUrl,
    backgroundKind = "unknown",
    backgroundDownloadUrl,
    expanded = false,
    onToggleExpanded,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ id: string; offsetX: number; offsetY: number; kind: "item" | "opening" } | null>(
        null
    );
    const [showBackground, setShowBackground] = useState(true);
    const [backgroundOpacity, setBackgroundOpacity] = useState(0.88);
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [wallDraft, setWallDraft] = useState<{
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    } | null>(null);

    const innerW = Math.max(0.1, room.width - WALL_THICKNESS_M * 2);
    const innerD = Math.max(0.1, room.depth - WALL_THICKNESS_M * 2);
    const contentW = room.width * PLAN_SCALE;
    const contentH = room.depth * PLAN_SCALE;
    const canvasSize = totalCanvasSizePx(room, PLAN_SCALE);
    const wallPx = WALL_THICKNESS_M * PLAN_SCALE;
    const { ox, oy } = contentOffsetPx();
    const isElectrical = planMode === "electrical";

    const openingSymbols = useItemSymbols(openingsAsPlacedItems(structure), PLAN_SCALE);

    const fitZoomToContainer = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const pad = expanded ? 24 : 32;
        const availW = Math.max(200, el.clientWidth - pad);
        const availH = Math.max(200, el.clientHeight - pad);
        const fit = Math.min(availW / canvasSize.w, availH / canvasSize.h, MAX_ZOOM);
        setZoom(clampZoom(fit));
    }, [canvasSize.w, canvasSize.h, expanded]);

    useEffect(() => {
        if (!expanded) return;
        const t = window.setTimeout(() => fitZoomToContainer(), 50);
        return () => window.clearTimeout(t);
    }, [expanded, fitZoomToContainer, room.width, room.depth]);

    useEffect(() => {
        if (!expanded || !scrollRef.current) return;
        const ro = new ResizeObserver(() => fitZoomToContainer());
        ro.observe(scrollRef.current);
        return () => ro.disconnect();
    }, [expanded, fitZoomToContainer]);

    useEffect(() => {
        if (editorTool !== "wall") setWallDraft(null);
    }, [editorTool]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && wallDraft) setWallDraft(null);
            if (e.key === "Escape" && editorTool === "wall") {
                onEditorToolChange("select");
                setWallDraft(null);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [wallDraft, editorTool, onEditorToolChange]);

    const { surface: backgroundSurface, loading: backgroundLoading, error: backgroundError } =
        usePlanBackground(backgroundUrl, backgroundKind, contentW, contentH);

    const itemSymbols = useItemSymbols(placedItems, PLAN_SCALE);

    const openingSymbolSurfaces = useMemo(() => {
        const map = new Map<string, HTMLCanvasElement>();
        for (const [id, entry] of openingSymbols) {
            map.set(id, entry.surface);
        }
        return map;
    }, [openingSymbols]);

    const hasRenderableBackground =
        Boolean(backgroundUrl) && isRenderablePlanBackground(backgroundKind);

    const pointerToRoomMeters = useCallback(
        (clientX: number, clientY: number) => {
            const canvas = canvasRef.current;
            if (!canvas) return { mx: 0, my: 0 };
            const rect = canvas.getBoundingClientRect();
            const px = ((clientX - rect.left) / rect.width) * canvasSize.w;
            const py = ((clientY - rect.top) / rect.height) * canvasSize.h;
            let mx = (px - ox - wallPx) / PLAN_SCALE;
            let my = (py - oy - wallPx) / PLAN_SCALE;
            if (snapEnabled) {
                mx = snapToGrid(mx, SNAP_STEP);
                my = snapToGrid(my, SNAP_STEP);
            }
            mx = Math.max(0, Math.min(innerW, mx));
            my = Math.max(0, Math.min(innerD, my));
            return { mx, my };
        },
        [canvasSize.w, canvasSize.h, ox, oy, wallPx, snapEnabled, innerW, innerD]
    );

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = canvasSize.w;
        canvas.height = canvasSize.h;

        ctx.fillStyle = "#e8e4dc";
        ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

        ctx.save();
        ctx.translate(ox, oy);

        drawSweetHomeRoom(ctx, {
            scale: PLAN_SCALE,
            room,
            isElectrical,
            backgroundSurface,
            showBackground,
            backgroundOpacity,
        });

        drawStructureLayer(ctx, {
            scale: PLAN_SCALE,
            items: structure,
            selectedId: structureEditable ? selectedStructureId : null,
            wallInsetM: WALL_THICKNESS_M,
            draft:
                structureEditable && wallDraft
                    ? {
                          ...wallDraft,
                          color: wallTemplate?.color,
                          depth: wallTemplate?.depth,
                      }
                    : null,
            openingSymbols: openingSymbolSurfaces,
        });

        for (const item of placedItems) {
            drawSweetHomeItem(ctx, {
                scale: PLAN_SCALE,
                item: {
                    ...item,
                    x: item.x + WALL_THICKNESS_M,
                    y: item.y + WALL_THICKNESS_M,
                },
                isSelected: item.id === selectedId,
                isElectrical,
                symbol: itemSymbols.get(item.id)?.surface ?? null,
            });
        }

        ctx.restore();

        drawDimensionRulers(ctx, room, PLAN_SCALE, ox, oy);
    }, [
        placedItems,
        structure,
        selectedId,
        selectedStructureId,
        structureEditable,
        wallDraft,
        wallTemplate,
        room,
        canvasSize.w,
        canvasSize.h,
        ox,
        oy,
        backgroundSurface,
        showBackground,
        backgroundOpacity,
        isElectrical,
        itemSymbols,
        openingSymbolSurfaces,
    ]);

    useEffect(() => {
        draw();
    }, [draw]);

    const hitTestItem = (mx: number, my: number): PlanPlacedItem | null => {
        for (let i = placedItems.length - 1; i >= 0; i--) {
            const item = placedItems[i];
            if (mx >= item.x && mx <= item.x + item.width && my >= item.y && my <= item.y + item.depth) {
                return item;
            }
        }
        return null;
    };

    const hitTestOpening = (mx: number, my: number): PlanStructureItem | null => {
        for (let i = structure.length - 1; i >= 0; i--) {
            const o = structure[i];
            if (!isStructureOpening(o)) continue;
            const w = o.width ?? 1;
            if (mx >= (o.x ?? 0) && mx <= (o.x ?? 0) + w && my >= (o.y ?? 0) && my <= (o.y ?? 0) + o.depth) {
                return o;
            }
        }
        return null;
    };

    const hitTestWall = (mx: number, my: number): PlanStructureItem | null => {
        let best: PlanStructureItem | null = null;
        let bestDist = WALL_HIT_THRESHOLD;
        for (const wall of structure) {
            if (!isStructureWall(wall)) continue;
            const d = distanceToStructureWall(mx, my, wall);
            if (d < bestDist) {
                bestDist = d;
                best = wall;
            }
        }
        return best;
    };

    const finalizeWall = (x1: number, y1: number, x2: number, y2: number) => {
        if (wallLengthM({ x1, y1, x2, y2 }) < MIN_WALL_LENGTH) return;
        const wall: PlanStructureItem = {
            id: crypto.randomUUID(),
            partType: "wall",
            label: wallTemplate?.label ?? "Wall",
            color: wallTemplate?.color ?? "#57534e",
            catalogItemId: wallTemplate?.catalogItemId,
            identifier: wallTemplate?.identifier,
            imageUrl: wallTemplate?.imageUrl ?? null,
            cadUrl: wallTemplate?.cadUrl ?? null,
            height: wallTemplate?.height ?? room.height,
            depth: wallTemplate?.depth ?? WALL_THICKNESS_M,
            elevation: 0,
            x1,
            y1,
            x2,
            y2,
        };
        onStructureChange([...structure, wall]);
        onSelectStructure(wall.id);
        setWallDraft(null);
    };

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const { mx, my } = pointerToRoomMeters(e.clientX, e.clientY);

        if (structureEditable && editorTool === "wall" && wallTemplate) {
            if (!wallDraft) {
                setWallDraft({ x1: mx, y1: my, x2: mx, y2: my });
            } else {
                finalizeWall(wallDraft.x1, wallDraft.y1, mx, my);
            }
            canvasRef.current?.setPointerCapture(e.pointerId);
            return;
        }

        if (structureEditable) {
            const opening = hitTestOpening(mx, my);
            if (opening) {
                onSelect(null);
                onSelectStructure(opening.id);
                dragRef.current = {
                    id: opening.id,
                    offsetX: mx - (opening.x ?? 0),
                    offsetY: my - (opening.y ?? 0),
                    kind: "opening",
                };
                canvasRef.current?.setPointerCapture(e.pointerId);
                return;
            }
            const wallHit = hitTestWall(mx, my);
            if (wallHit) {
                onSelect(null);
                onSelectStructure(wallHit.id);
                return;
            }
        }

        const hit = hitTestItem(mx, my);
        if (hit) {
            onSelectStructure(null);
            onSelect(hit.id);
            dragRef.current = { id: hit.id, offsetX: mx - hit.x, offsetY: my - hit.y, kind: "item" };
            canvasRef.current?.setPointerCapture(e.pointerId);
            return;
        }

        onSelect(null);
        if (structureEditable) onSelectStructure(null);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const { mx, my } = pointerToRoomMeters(e.clientX, e.clientY);

        if (structureEditable && editorTool === "wall" && wallDraft) {
            setWallDraft({ ...wallDraft, x2: mx, y2: my });
            return;
        }

        if (!dragRef.current) return;

        if (dragRef.current.kind === "opening") {
            const item = structure.find((s) => s.id === dragRef.current!.id);
            const w = item?.width ?? 1;
            const maxX = innerW - w;
            const maxY = innerD - (item?.depth ?? 0.12);
            let newX = Math.max(0, Math.min(maxX, mx - dragRef.current.offsetX));
            let newY = Math.max(0, Math.min(maxY, my - dragRef.current.offsetY));
            if (snapEnabled) {
                newX = snapToGrid(newX, SNAP_STEP);
                newY = snapToGrid(newY, SNAP_STEP);
            }
            onStructureChange(
                structure.map((s) => (s.id === dragRef.current!.id ? { ...s, x: newX, y: newY } : s))
            );
            return;
        }

        const item = placedItems.find((f) => f.id === dragRef.current!.id);
        const maxX = item ? innerW - item.width : innerW;
        const maxY = item ? innerD - item.depth : innerD;
        let newX = Math.max(0, Math.min(maxX, mx - dragRef.current.offsetX));
        let newY = Math.max(0, Math.min(maxY, my - dragRef.current.offsetY));
        if (snapEnabled) {
            newX = snapToGrid(newX, SNAP_STEP);
            newY = snapToGrid(newY, SNAP_STEP);
        }
        onPlacedItemsChange(
            placedItems.map((f) => (f.id === dragRef.current!.id ? { ...f, x: newX, y: newY } : f))
        );
    };

    const onPointerUp = () => {
        dragRef.current = null;
    };

    const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        setZoom((z) => clampZoom(z + (e.deltaY < 0 ? 0.12 : -0.12)));
    };

    const cadOnly =
        backgroundKind === "dwg" || backgroundKind === "dxf" || backgroundKind === "unknown";

    const cursorClass =
        structureEditable && editorTool === "wall" && wallTemplate
            ? "cursor-crosshair"
            : "cursor-grab active:cursor-grabbing";

    return (
        <div className={expanded ? "flex h-full min-h-0 flex-col gap-2" : "space-y-3"}>
            {!expanded ? (
                <div className="rounded-lg border border-[#cfc7ba] bg-[#faf6ef] px-3 py-2 text-sm text-stone-700">
                    {structureEditable && editorTool === "wall" ? (
                        <span>
                            Draw wall — click two points using{" "}
                            <strong>{wallTemplate?.label ?? "catalog wall"}</strong> ({wallTemplate?.color}).
                        </span>
                    ) : structureEditable ? (
                        <span>
                            Structure mode — pick walls, windows, or doors from catalog. Change colors in the
                            properties panel.
                        </span>
                    ) : isElectrical ? (
                        <span>Electrical plan — structure layer shown in background.</span>
                    ) : (
                        <span>2D plan — furniture and structure layers.</span>
                    )}
                </div>
            ) : null}

            {backgroundUrl && !expanded ? (
                <div className="rounded-lg border border-[#cfc7ba] bg-[#faf6ef] px-3 py-2 text-sm text-stone-700">
                    {hasRenderableBackground ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <span>Imported floor plan</span>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={showBackground}
                                    onChange={(e) => setShowBackground(e.target.checked)}
                                />
                                Show
                            </label>
                            <input
                                type="range"
                                min={0.2}
                                max={1}
                                step={0.05}
                                value={backgroundOpacity}
                                disabled={!showBackground}
                                onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                                className="w-24"
                            />
                            {backgroundLoading ? (
                                <span className="text-xs text-stone-500">Loading…</span>
                            ) : null}
                            {backgroundError ? (
                                <span className="text-xs text-rose-700">{backgroundError}</span>
                            ) : null}
                        </div>
                    ) : cadOnly ? (
                        <p>
                            CAD preview unavailable — use PDF/PNG.{" "}
                            {backgroundDownloadUrl ? (
                                <a href={backgroundDownloadUrl} className="text-brand-700 underline">
                                    Download
                                </a>
                            ) : null}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
                {onToggleExpanded ? (
                    <Button type="button" size="sm" variant="primary" onClick={onToggleExpanded}>
                        {expanded ? "Exit full screen" : "Full screen plan"}
                    </Button>
                ) : null}
                {structureEditable ? (
                    <>
                        <Button
                            type="button"
                            size="sm"
                            variant={editorTool === "select" ? "primary" : "secondary"}
                            onClick={() => onEditorToolChange("select")}
                        >
                            Select
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={editorTool === "wall" && wallTemplate ? "primary" : "secondary"}
                            disabled={!wallTemplate}
                            onClick={() => {
                                onEditorToolChange(editorTool === "wall" ? "select" : "wall");
                                setWallDraft(null);
                            }}
                        >
                            {editorTool === "wall" ? "Cancel wall" : "Draw wall"}
                        </Button>
                    </>
                ) : null}
                <Button type="button" size="sm" variant="secondary" onClick={() => setZoom((z) => clampZoom(z - 0.2))}>
                    −
                </Button>
                <span className="min-w-[4rem] text-center text-sm font-medium text-stone-700">
                    {Math.round(zoom * 100)}%
                </span>
                <Button type="button" size="sm" variant="secondary" onClick={() => setZoom((z) => clampZoom(z + 0.2))}>
                    +
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => (expanded ? fitZoomToContainer() : setZoom(DEFAULT_ZOOM))}
                >
                    Fit
                </Button>
                <label className="flex items-center gap-1.5 text-xs text-stone-600">
                    <input
                        type="checkbox"
                        checked={snapEnabled}
                        onChange={(e) => setSnapEnabled(e.target.checked)}
                    />
                    Snap 10 cm
                </label>
            </div>

            <div
                ref={scrollRef}
                className={
                    expanded
                        ? "min-h-0 flex-1 overflow-auto rounded-xl border-2 border-[#cfc7ba] bg-[#e8e4dc] p-2 shadow-inner"
                        : "min-h-[min(72vh,calc(100vh-22rem))] overflow-auto rounded-xl border-2 border-[#cfc7ba] bg-[#e8e4dc] p-3 shadow-inner"
                }
                onWheel={onWheel}
            >
                <div style={{ width: canvasSize.w * zoom, height: canvasSize.h * zoom, minWidth: "100%" }}>
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.w}
                        height={canvasSize.h}
                        style={{ width: canvasSize.w * zoom, height: canvasSize.h * zoom, display: "block" }}
                        className={`touch-none bg-[#faf6ef] shadow-md ${cursorClass}`}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                    />
                </div>
            </div>
        </div>
    );
}
