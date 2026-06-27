import api from "../../api/api";
import type {
    CatalogStructureItem,
    StructureCategoryGroup,
    FurnitureCategoryRecord,
} from "./types";

export async function listStructureCategories(): Promise<FurnitureCategoryRecord[]> {
    const res = await api.get<FurnitureCategoryRecord[]>("interior_design/structure-categories/");
    return Array.isArray(res.data) ? res.data : [];
}

export async function createStructureCategory(payload: {
    name: string;
    sort_order?: number;
}): Promise<FurnitureCategoryRecord> {
    const res = await api.post<FurnitureCategoryRecord>("interior_design/structure-categories/", payload);
    return res.data;
}

export async function updateStructureCategory(
    id: number,
    payload: Partial<{ name: string; sort_order: number }>
): Promise<FurnitureCategoryRecord> {
    const res = await api.patch<FurnitureCategoryRecord>(
        `interior_design/structure-categories/${id}/`,
        payload
    );
    return res.data;
}

export async function deleteStructureCategory(id: number): Promise<void> {
    await api.delete(`interior_design/structure-categories/${id}/`);
}

export async function listStructureItems(categoryId?: number): Promise<CatalogStructureItem[]> {
    const params = categoryId ? { category: categoryId } : undefined;
    const res = await api.get<CatalogStructureItem[]>("interior_design/structure-items/", { params });
    return Array.isArray(res.data) ? res.data : [];
}

export async function createStructureItem(payload: {
    category: number;
    identifier: string;
    name: string;
    description?: string;
    part_type: string;
    width?: number;
    depth?: number;
    height?: number;
    elevation?: number;
    color?: string;
    is_active?: boolean;
    image?: File | null;
    cad_file?: File | null;
}): Promise<CatalogStructureItem> {
    const form = new FormData();
    form.append("category", String(payload.category));
    form.append("identifier", payload.identifier);
    form.append("name", payload.name);
    form.append("part_type", payload.part_type);
    form.append("width", String(payload.width ?? 1));
    form.append("depth", String(payload.depth ?? 0.12));
    form.append("height", String(payload.height ?? 2.7));
    form.append("elevation", String(payload.elevation ?? 0));
    if (payload.description) form.append("description", payload.description);
    if (payload.color) form.append("color", payload.color);
    if (payload.is_active !== undefined) form.append("is_active", payload.is_active ? "true" : "false");
    if (payload.image) form.append("image", payload.image);
    if (payload.cad_file) form.append("cad_file", payload.cad_file);
    const res = await api.post<CatalogStructureItem>("interior_design/structure-items/", form);
    return res.data;
}

export async function updateStructureItem(
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
        elevation: number;
        color: string;
        is_active: boolean;
        image: File | null;
        cad_file: File | null;
    }>
): Promise<CatalogStructureItem> {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined) return;
        if (value === null && (key === "image" || key === "cad_file")) return;
        if (value instanceof File) form.append(key, value);
        else form.append(key, String(value));
    });
    const res = await api.patch<CatalogStructureItem>(`interior_design/structure-items/${id}/`, form);
    return res.data;
}

export async function deleteStructureItem(id: number): Promise<void> {
    await api.delete(`interior_design/structure-items/${id}/`);
}

export async function getGroupedStructureCatalog(): Promise<StructureCategoryGroup[]> {
    const res = await api.get<StructureCategoryGroup[]>(
        "interior_design/projects/structure-catalog/"
    );
    return Array.isArray(res.data) ? res.data : [];
}
