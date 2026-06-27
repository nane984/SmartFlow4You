export type RoomSpec = {
    width: number;
    depth: number;
    height: number;
};

export type StudioPlanMode = "furniture" | "electrical" | "structure";

export type StructurePartType = "wall" | "window" | "door";

export const STRUCTURE_PART_TYPES = [
    { value: "wall" as const, label: "Wall" },
    { value: "window" as const, label: "Window" },
    { value: "door" as const, label: "Door" },
];

/** Where the item sits vertically in the room (3D). */
export type VerticalMount = "floor" | "ceiling" | "custom";

export const VERTICAL_MOUNT_OPTIONS: { value: VerticalMount; label: string }[] = [
    { value: "floor", label: "On floor" },
    { value: "ceiling", label: "On ceiling" },
    { value: "custom", label: "Custom height" },
];

/** Minimum box height in 3D when catalog height is 0 (e.g. flat ceiling lights). */
export const MIN_3D_ITEM_HEIGHT = 0.08;

/** Shared spatial item on the floor plan (furniture or electrical). */
export type PlanPlacedItem = {
    id: string;
    type: string;
    label: string;
    x: number;
    y: number;
    rotation: number;
    width: number;
    depth: number;
    height: number;
    /** Vertical anchor — ceiling lights hang from the roof, not the floor. */
    mountFrom?: VerticalMount;
    /** Bottom edge height from floor (m), used when mountFrom is "custom". */
    elevation?: number;
    color: string;
    catalogItemId?: number;
    identifier?: string;
    imageUrl?: string | null;
    cadUrl?: string | null;
    /** Electrical-only fields */
    partType?: string;
    voltageV?: number | null;
    amperageA?: number | null;
    wireGaugeMm2?: number | null;
    circuitId?: string;
    phases?: number | null;
};

export type FurnitureItem = PlanPlacedItem;

export type ElectricalPlacedItem = PlanPlacedItem;

/** @deprecated Use PlanStructureItem — kept for layout migration. */
export type PlanWall = {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    thickness?: number;
    color?: string;
    height?: number;
    label?: string;
    catalogItemId?: number;
};

/** Wall (line), window, or door on the floor plan. */
export type PlanStructureItem = {
    id: string;
    partType: StructurePartType;
    label: string;
    color: string;
    catalogItemId?: number;
    identifier?: string;
    imageUrl?: string | null;
    cadUrl?: string | null;
    height: number;
    /** Wall/window/door thickness on plan (m). */
    depth: number;
    /** Sill height for windows; 0 for doors. */
    elevation: number;
    /** Wall line start/end (inner room coords, meters). */
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    /** Window/door box placement. */
    x?: number;
    y?: number;
    width?: number;
    rotation?: number;
};

export type LayoutData = {
    room: RoomSpec;
    furniture: PlanPlacedItem[];
    electrical?: PlanPlacedItem[];
    structure?: PlanStructureItem[];
    /** @deprecated migrated to structure */
    walls?: PlanWall[];
    planMode?: StudioPlanMode;
    style?: Record<string, string>;
};

export type InteriorProject = {
    id: number;
    client_name: string;
    description: string;
    floorplan_url?: string | null;
    cad_url?: string | null;
    style_preference: Record<string, string>;
    layout_data: LayoutData;
    ai_generated_images: string[];
    ai_suggestions: string[];
    created_by?: number | null;
    created_by_name?: string;
    created_at?: string;
    updated_at?: string;
};

export type FurnitureCategoryRecord = {
    id: number;
    name: string;
    sort_order: number;
    item_count?: number;
};

export type CatalogFurnitureItem = {
    id: number;
    category: number;
    category_name: string;
    identifier: string;
    name: string;
    description: string;
    width: number | string;
    depth: number | string;
    height: number | string;
    color: string;
    image_url?: string | null;
    cad_url?: string | null;
    is_active: boolean;
};

export type CatalogElectricalItem = CatalogFurnitureItem & {
    part_type: string;
    vertical_mount?: VerticalMount;
    mount_elevation?: number | string | null;
    voltage_v: number | string | null;
    amperage_a: number | string | null;
    wire_gauge_mm2: number | string | null;
    circuit_id: string;
    phases: number | null;
};

export type FurnitureCategoryGroup = {
    id: number;
    name: string;
    sort_order: number;
    items: CatalogFurnitureItem[];
};

export type ElectricalCategoryGroup = {
    id: number;
    name: string;
    sort_order: number;
    items: CatalogElectricalItem[];
};

export type CatalogStructureItem = CatalogFurnitureItem & {
    part_type: StructurePartType;
    elevation: number | string;
};

export type StructureCategoryGroup = {
    id: number;
    name: string;
    sort_order: number;
    items: CatalogStructureItem[];
};

export type FurnitureCatalogEntry = {
    label: string;
    width: number;
    depth: number;
    height: number;
    color: string;
};

export type AiSuggestResponse = {
    prompt: string;
    suggestions: string[];
    proposed_layout: LayoutData;
    catalog: Record<string, FurnitureCatalogEntry>;
    source?: "llm" | "rules";
    model?: string | null;
};

export type AiStatusResponse = {
    llm_configured: boolean;
    model: string | null;
};

export const ELECTRICAL_PART_TYPES = [
    { value: "outlet", label: "Outlet / socket" },
    { value: "switch", label: "Switch" },
    { value: "panel", label: "Distribution panel" },
    { value: "junction", label: "Junction box" },
    { value: "wire", label: "Wire / cable run" },
    { value: "light", label: "Light fixture" },
    { value: "breaker", label: "Circuit breaker" },
    { value: "other", label: "Other" },
] as const;

export const DEFAULT_LAYOUT: LayoutData = {
    room: { width: 8, depth: 6, height: 2.7 },
    furniture: [],
    electrical: [],
    structure: [],
    planMode: "furniture",
};

export function isStructureWall(item: PlanStructureItem): boolean {
    return item.partType === "wall" && item.x1 != null && item.x2 != null;
}

export function isStructureOpening(item: PlanStructureItem): boolean {
    return (item.partType === "window" || item.partType === "door") && item.x != null;
}

export function normalizeStructureItem(raw: PlanStructureItem): PlanStructureItem {
    return {
        ...raw,
        height: Number(raw.height),
        depth: Number(raw.depth ?? 0.12),
        elevation: Number(raw.elevation ?? 0),
        x1: raw.x1 != null ? Number(raw.x1) : undefined,
        y1: raw.y1 != null ? Number(raw.y1) : undefined,
        x2: raw.x2 != null ? Number(raw.x2) : undefined,
        y2: raw.y2 != null ? Number(raw.y2) : undefined,
        x: raw.x != null ? Number(raw.x) : undefined,
        y: raw.y != null ? Number(raw.y) : undefined,
        width: raw.width != null ? Number(raw.width) : undefined,
        rotation: raw.rotation != null ? Number(raw.rotation) : undefined,
    };
}

export function wallLengthM(w: Pick<PlanStructureItem, "x1" | "y1" | "x2" | "y2">): number {
    if (w.x1 == null || w.y1 == null || w.x2 == null || w.y2 == null) return 0;
    return Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
}

export function distanceToStructureWall(
    px: number,
    py: number,
    w: Pick<PlanStructureItem, "x1" | "y1" | "x2" | "y2">
): number {
    if (w.x1 == null || w.y1 == null || w.x2 == null || w.y2 == null) return Infinity;
    const dx = w.x2 - w.x1;
    const dy = w.y2 - w.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-8) return Math.hypot(px - w.x1, py - w.y1);
    let t = ((px - w.x1) * dx + (py - w.y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = w.x1 + t * dx;
    const cy = w.y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
}

function migrateLegacyWalls(walls: PlanWall[] | undefined): PlanStructureItem[] {
    if (!Array.isArray(walls)) return [];
    return walls.map((w) => ({
        id: w.id,
        partType: "wall" as const,
        label: w.label ?? "Wall",
        color: w.color ?? "#57534e",
        catalogItemId: w.catalogItemId,
        height: Number(w.height ?? 2.7),
        depth: Number(w.thickness ?? 0.12),
        elevation: 0,
        x1: Number(w.x1),
        y1: Number(w.y1),
        x2: Number(w.x2),
        y2: Number(w.y2),
    }));
}

export function defaultMountForPartType(partType?: string): {
    mountFrom: VerticalMount;
    elevation?: number;
} {
    switch (partType) {
        case "light":
            return { mountFrom: "ceiling" };
        case "switch":
            return { mountFrom: "custom", elevation: 1.1 };
        case "outlet":
            return { mountFrom: "custom", elevation: 0.3 };
        case "junction":
            return { mountFrom: "custom", elevation: 2.4 };
        default:
            return { mountFrom: "floor" };
    }
}

export function resolveMountFrom(item: PlanPlacedItem): VerticalMount {
    if (item.mountFrom) return item.mountFrom;
    return defaultMountForPartType(item.partType).mountFrom;
}

export function effectiveItemHeight(item: PlanPlacedItem): number {
    return Math.max(MIN_3D_ITEM_HEIGHT, Number(item.height) || 0);
}

/** Bottom edge of the item above the floor (meters). */
export function itemBottomElevation(item: PlanPlacedItem, roomHeight: number): number {
    const mount = resolveMountFrom(item);
    const h = effectiveItemHeight(item);
    if (mount === "ceiling") return Math.max(0, roomHeight - h);
    if (mount === "custom") {
        const fallback = defaultMountForPartType(item.partType).elevation ?? 0;
        const bottom = item.elevation ?? fallback;
        return Math.max(0, Math.min(roomHeight - h, bottom));
    }
    return 0;
}

/** Y center for Three.js meshes. */
export function itemCenterY(item: PlanPlacedItem, roomHeight: number): number {
    return itemBottomElevation(item, roomHeight) + effectiveItemHeight(item) / 2;
}

export function formatMountLabel(item: PlanPlacedItem, roomHeight: number): string {
    const mount = resolveMountFrom(item);
    if (mount === "floor") return "On floor";
    if (mount === "ceiling") return `Ceiling (${roomHeight.toFixed(2)} m)`;
    const bottom = itemBottomElevation(item, roomHeight);
    return `Height ${bottom.toFixed(2)} m from floor`;
}

function normalizePlacedItem(raw: PlanPlacedItem): PlanPlacedItem {
    const defaults = defaultMountForPartType(raw.partType);
    return {
        ...raw,
        width: Number(raw.width),
        depth: Number(raw.depth),
        height: Number(raw.height),
        mountFrom: raw.mountFrom ?? defaults.mountFrom,
        elevation:
            raw.elevation != null
                ? Number(raw.elevation)
                : defaults.elevation,
        voltageV: raw.voltageV != null ? Number(raw.voltageV) : raw.voltageV,
        amperageA: raw.amperageA != null ? Number(raw.amperageA) : raw.amperageA,
        wireGaugeMm2: raw.wireGaugeMm2 != null ? Number(raw.wireGaugeMm2) : raw.wireGaugeMm2,
        phases: raw.phases != null ? Number(raw.phases) : raw.phases,
    };
}

export function normalizeLayout(raw: unknown): LayoutData {
    if (!raw || typeof raw !== "object") return { ...DEFAULT_LAYOUT, furniture: [], electrical: [], structure: [] };
    const data = raw as LayoutData;
    const structure =
        Array.isArray(data.structure) && data.structure.length > 0
            ? data.structure.map(normalizeStructureItem)
            : migrateLegacyWalls(data.walls);
    const planMode =
        data.planMode === "electrical"
            ? "electrical"
            : data.planMode === "structure"
              ? "structure"
              : "furniture";
    return {
        room: {
            width: Number(data.room?.width) || DEFAULT_LAYOUT.room.width,
            depth: Number(data.room?.depth) || DEFAULT_LAYOUT.room.depth,
            height: Number(data.room?.height) || DEFAULT_LAYOUT.room.height,
        },
        furniture: Array.isArray(data.furniture) ? data.furniture.map(normalizePlacedItem) : [],
        electrical: Array.isArray(data.electrical) ? data.electrical.map(normalizePlacedItem) : [],
        structure,
        planMode,
        style: data.style,
    };
}

export function structureCatalogItemToPlacement(item: CatalogStructureItem): PlanStructureItem {
    const partType = item.part_type;
    const base = {
        id: crypto.randomUUID(),
        catalogItemId: item.id > 0 ? item.id : undefined,
        partType,
        identifier: item.identifier,
        label: item.name,
        color: item.color || "#78716c",
        height: Number(item.height),
        depth: Number(item.depth),
        elevation: Number(item.elevation ?? 0),
        imageUrl: item.image_url ?? null,
        cadUrl: item.cad_url ?? null,
    };
    if (partType === "wall") {
        return { ...base, x1: 0, y1: 0, x2: 0, y2: 0 };
    }
    return {
        ...base,
        x: 0.5,
        y: 0.5,
        width: Number(item.width),
        rotation: 0,
    };
}

export function enrichStructureFromCatalog(
    items: PlanStructureItem[],
    catalog: StructureCategoryGroup[]
): PlanStructureItem[] {
    const byId = new Map<number, CatalogStructureItem>();
    for (const group of catalog) {
        for (const entry of group.items) {
            byId.set(entry.id, entry);
        }
    }
    return items.map((item) => {
        if (!item.catalogItemId) return item;
        const cat = byId.get(item.catalogItemId);
        if (!cat) return item;
        return {
            ...item,
            label: item.label || cat.name,
            identifier: item.identifier || cat.identifier,
            imageUrl: item.imageUrl ?? cat.image_url ?? null,
            cadUrl: item.cadUrl ?? cat.cad_url ?? null,
            color: item.color || cat.color,
            height: item.height || Number(cat.height),
            depth: item.depth || Number(cat.depth),
            elevation: item.elevation ?? Number(cat.elevation ?? 0),
        };
    });
}

export function catalogItemToPlacement(item: CatalogFurnitureItem): PlanPlacedItem {
    return {
        id: crypto.randomUUID(),
        catalogItemId: item.id > 0 ? item.id : undefined,
        type: item.identifier.toLowerCase(),
        identifier: item.identifier,
        label: item.name,
        x: 0.5,
        y: 0.5,
        rotation: 0,
        width: Number(item.width),
        depth: Number(item.depth),
        height: Number(item.height),
        color: item.color || "#64748b",
        imageUrl: item.image_url ?? null,
        cadUrl: item.cad_url ?? null,
    };
}

export function electricalCatalogItemToPlacement(item: CatalogElectricalItem): PlanPlacedItem {
    const mountDefaults = item.vertical_mount
        ? {
              mountFrom: item.vertical_mount,
              elevation:
                  item.mount_elevation != null ? Number(item.mount_elevation) : undefined,
          }
        : defaultMountForPartType(item.part_type);
    return {
        ...catalogItemToPlacement(item),
        color: item.color || "#eab308",
        partType: item.part_type,
        mountFrom: mountDefaults.mountFrom,
        elevation: mountDefaults.elevation,
        voltageV: item.voltage_v != null ? Number(item.voltage_v) : null,
        amperageA: item.amperage_a != null ? Number(item.amperage_a) : null,
        wireGaugeMm2: item.wire_gauge_mm2 != null ? Number(item.wire_gauge_mm2) : null,
        circuitId: item.circuit_id || "",
        phases: item.phases != null ? Number(item.phases) : null,
    };
}

export function formatDimensions(w: number, d: number, h: number): string {
    return `${w.toFixed(2)} × ${d.toFixed(2)} × ${h.toFixed(2)} m`;
}

export function formatElectricalSpecs(item: PlanPlacedItem): string {
    const parts: string[] = [];
    if (item.voltageV != null) parts.push(`${item.voltageV} V`);
    if (item.amperageA != null) parts.push(`${item.amperageA} A`);
    if (item.wireGaugeMm2 != null) parts.push(`${item.wireGaugeMm2} mm²`);
    if (item.phases != null) parts.push(`${item.phases}-phase`);
    if (item.circuitId) parts.push(`circuit ${item.circuitId}`);
    return parts.join(" · ") || "—";
}

export function enrichFurnitureFromCatalog(
    items: PlanPlacedItem[],
    catalog: FurnitureCategoryGroup[]
): PlanPlacedItem[] {
    const byId = new Map<number, CatalogFurnitureItem>();
    for (const group of catalog) {
        for (const entry of group.items) {
            byId.set(entry.id, entry);
        }
    }
    return items.map((item) => {
        if (!item.catalogItemId) return item;
        const cat = byId.get(item.catalogItemId);
        if (!cat) return item;
        return {
            ...item,
            label: item.label || cat.name,
            identifier: item.identifier || cat.identifier,
            imageUrl: item.imageUrl ?? cat.image_url ?? null,
            cadUrl: item.cadUrl ?? cat.cad_url ?? null,
            color: item.color || cat.color,
        };
    });
}

export function enrichElectricalFromCatalog(
    items: PlanPlacedItem[],
    catalog: ElectricalCategoryGroup[]
): PlanPlacedItem[] {
    const byId = new Map<number, CatalogElectricalItem>();
    for (const group of catalog) {
        for (const entry of group.items) {
            byId.set(entry.id, entry);
        }
    }
    return items.map((item) => {
        if (!item.catalogItemId) return item;
        const cat = byId.get(item.catalogItemId);
        if (!cat) return item;
        return {
            ...item,
            label: item.label || cat.name,
            identifier: item.identifier || cat.identifier,
            imageUrl: item.imageUrl ?? cat.image_url ?? null,
            cadUrl: item.cadUrl ?? cat.cad_url ?? null,
            color: item.color || cat.color,
            partType: item.partType || cat.part_type,
            mountFrom: item.mountFrom ?? cat.vertical_mount ?? defaultMountForPartType(cat.part_type).mountFrom,
            elevation:
                item.elevation ??
                (cat.mount_elevation != null
                    ? Number(cat.mount_elevation)
                    : defaultMountForPartType(cat.part_type).elevation),
            voltageV: item.voltageV ?? (cat.voltage_v != null ? Number(cat.voltage_v) : null),
            amperageA: item.amperageA ?? (cat.amperage_a != null ? Number(cat.amperage_a) : null),
            wireGaugeMm2:
                item.wireGaugeMm2 ?? (cat.wire_gauge_mm2 != null ? Number(cat.wire_gauge_mm2) : null),
            circuitId: item.circuitId || cat.circuit_id || "",
            phases: item.phases ?? (cat.phases != null ? Number(cat.phases) : null),
        };
    });
}
