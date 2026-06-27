import api from "../../api/api";
import type { CatalogFurnitureItem, FurnitureCategoryGroup, FurnitureCategoryRecord } from "./types";

export async function listFurnitureCategories(): Promise<FurnitureCategoryRecord[]> {
    const res = await api.get<FurnitureCategoryRecord[]>("interior_design/furniture-categories/");
    return Array.isArray(res.data) ? res.data : [];
}

export async function createFurnitureCategory(payload: {
    name: string;
    sort_order?: number;
}): Promise<FurnitureCategoryRecord> {
    const res = await api.post<FurnitureCategoryRecord>("interior_design/furniture-categories/", payload);
    return res.data;
}

export async function updateFurnitureCategory(
    id: number,
    payload: Partial<{ name: string; sort_order: number }>
): Promise<FurnitureCategoryRecord> {
    const res = await api.patch<FurnitureCategoryRecord>(
        `interior_design/furniture-categories/${id}/`,
        payload
    );
    return res.data;
}

export async function deleteFurnitureCategory(id: number): Promise<void> {
    await api.delete(`interior_design/furniture-categories/${id}/`);
}

export async function listFurnitureItems(categoryId?: number): Promise<CatalogFurnitureItem[]> {
    const params = categoryId ? { category: categoryId } : undefined;
    const res = await api.get<CatalogFurnitureItem[]>("interior_design/furniture-items/", { params });
    return Array.isArray(res.data) ? res.data : [];
}

export async function createFurnitureItem(payload: {
    category: number;
    identifier: string;
    name: string;
    description?: string;
    width: number;
    depth: number;
    height: number;
    color?: string;
    is_active?: boolean;
    image?: File | null;
    cad_file?: File | null;
}): Promise<CatalogFurnitureItem> {
    const form = new FormData();
    form.append("category", String(payload.category));
    form.append("identifier", payload.identifier);
    form.append("name", payload.name);
    form.append("width", String(payload.width));
    form.append("depth", String(payload.depth));
    form.append("height", String(payload.height));
    if (payload.description) form.append("description", payload.description);
    if (payload.color) form.append("color", payload.color);
    if (payload.is_active !== undefined) form.append("is_active", payload.is_active ? "true" : "false");
    if (payload.image) form.append("image", payload.image);
    if (payload.cad_file) form.append("cad_file", payload.cad_file);
    const res = await api.post<CatalogFurnitureItem>("interior_design/furniture-items/", form);
    return res.data;
}

export async function updateFurnitureItem(
    id: number,
    payload: Partial<{
        category: number;
        identifier: string;
        name: string;
        description: string;
        width: number;
        depth: number;
        height: number;
        color: string;
        is_active: boolean;
        image: File | null;
        cad_file: File | null;
    }>
): Promise<CatalogFurnitureItem> {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined) return;
        if (value === null && (key === "image" || key === "cad_file")) return;
        if (value instanceof File) {
            form.append(key, value);
        } else {
            form.append(key, String(value));
        }
    });
    const res = await api.patch<CatalogFurnitureItem>(`interior_design/furniture-items/${id}/`, form);
    return res.data;
}

export async function deleteFurnitureItem(id: number): Promise<void> {
    await api.delete(`interior_design/furniture-items/${id}/`);
}

export async function getGroupedFurnitureCatalog(): Promise<FurnitureCategoryGroup[]> {
    const res = await api.get<FurnitureCategoryGroup[]>("interior_design/projects/furniture-catalog/");
    return Array.isArray(res.data) ? res.data : [];
}
