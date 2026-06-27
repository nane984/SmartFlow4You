import api from "../../api/api";
import type {
    CatalogElectricalItem,
    ElectricalCategoryGroup,
    FurnitureCategoryRecord,
} from "./types";

export async function listElectricalCategories(): Promise<FurnitureCategoryRecord[]> {
    const res = await api.get<FurnitureCategoryRecord[]>("interior_design/electrical-categories/");
    return Array.isArray(res.data) ? res.data : [];
}

export async function createElectricalCategory(payload: {
    name: string;
    sort_order?: number;
}): Promise<FurnitureCategoryRecord> {
    const res = await api.post<FurnitureCategoryRecord>(
        "interior_design/electrical-categories/",
        payload
    );
    return res.data;
}

export async function updateElectricalCategory(
    id: number,
    payload: Partial<{ name: string; sort_order: number }>
): Promise<FurnitureCategoryRecord> {
    const res = await api.patch<FurnitureCategoryRecord>(
        `interior_design/electrical-categories/${id}/`,
        payload
    );
    return res.data;
}

export async function deleteElectricalCategory(id: number): Promise<void> {
    await api.delete(`interior_design/electrical-categories/${id}/`);
}

export async function listElectricalItems(categoryId?: number): Promise<CatalogElectricalItem[]> {
    const params = categoryId ? { category: categoryId } : undefined;
    const res = await api.get<CatalogElectricalItem[]>("interior_design/electrical-items/", { params });
    return Array.isArray(res.data) ? res.data : [];
}

export async function createElectricalItem(payload: {
    category: number;
    identifier: string;
    name: string;
    description?: string;
    part_type: string;
    width: number;
    depth: number;
    height?: number;
    vertical_mount?: string;
    mount_elevation?: number | null;
    color?: string;
    voltage_v?: number | null;
    amperage_a?: number | null;
    wire_gauge_mm2?: number | null;
    circuit_id?: string;
    phases?: number | null;
    is_active?: boolean;
    image?: File | null;
    cad_file?: File | null;
}): Promise<CatalogElectricalItem> {
    const form = new FormData();
    form.append("category", String(payload.category));
    form.append("identifier", payload.identifier);
    form.append("name", payload.name);
    form.append("part_type", payload.part_type);
    form.append("width", String(payload.width));
    form.append("depth", String(payload.depth));
    form.append("height", String(payload.height ?? 0));
    if (payload.vertical_mount) form.append("vertical_mount", payload.vertical_mount);
    if (payload.mount_elevation != null) form.append("mount_elevation", String(payload.mount_elevation));
    if (payload.description) form.append("description", payload.description);
    if (payload.color) form.append("color", payload.color);
    if (payload.voltage_v != null) form.append("voltage_v", String(payload.voltage_v));
    if (payload.amperage_a != null) form.append("amperage_a", String(payload.amperage_a));
    if (payload.wire_gauge_mm2 != null) form.append("wire_gauge_mm2", String(payload.wire_gauge_mm2));
    if (payload.circuit_id) form.append("circuit_id", payload.circuit_id);
    if (payload.phases != null) form.append("phases", String(payload.phases));
    if (payload.is_active !== undefined) form.append("is_active", payload.is_active ? "true" : "false");
    if (payload.image) form.append("image", payload.image);
    if (payload.cad_file) form.append("cad_file", payload.cad_file);
    const res = await api.post<CatalogElectricalItem>("interior_design/electrical-items/", form);
    return res.data;
}

export async function updateElectricalItem(
    id: number,
    payload: Partial<{
        category: number;
        identifier: string;
        name: string;
        description: string;
        part_type: string;
        width: number;
        depth: number;
        height: number;
        vertical_mount: string;
        mount_elevation: number | null;
        color: string;
        voltage_v: number | null;
        amperage_a: number | null;
        wire_gauge_mm2: number | null;
        circuit_id: string;
        phases: number | null;
        is_active: boolean;
        image: File | null;
        cad_file: File | null;
    }>
): Promise<CatalogElectricalItem> {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined) return;
        if (value === null && (key === "image" || key === "cad_file")) return;
        if (value instanceof File) form.append(key, value);
        else form.append(key, String(value));
    });
    const res = await api.patch<CatalogElectricalItem>(`interior_design/electrical-items/${id}/`, form);
    return res.data;
}

export async function deleteElectricalItem(id: number): Promise<void> {
    await api.delete(`interior_design/electrical-items/${id}/`);
}

export async function getGroupedElectricalCatalog(): Promise<ElectricalCategoryGroup[]> {
    const res = await api.get<ElectricalCategoryGroup[]>(
        "interior_design/projects/electrical-catalog/"
    );
    return Array.isArray(res.data) ? res.data : [];
}
