import api from "../../api/api";
import type {
    AiStatusResponse,
    AiSuggestResponse,
    ElectricalCategoryGroup,
    FurnitureCategoryGroup,
    StructureCategoryGroup,
    InteriorProject,
    LayoutData,
} from "./types";

export async function listInteriorProjects(): Promise<InteriorProject[]> {
    const res = await api.get<InteriorProject[]>("interior_design/projects/");
    return Array.isArray(res.data) ? res.data : [];
}

export async function getInteriorProject(id: number): Promise<InteriorProject> {
    const res = await api.get<InteriorProject>(`interior_design/projects/${id}/`);
    return res.data;
}

export async function createInteriorProject(payload: {
    client_name: string;
    description?: string;
    floorplan_file?: File;
    cad_file?: File;
}): Promise<InteriorProject> {
    const form = new FormData();
    form.append("client_name", payload.client_name);
    if (payload.description) form.append("description", payload.description);
    if (payload.floorplan_file) form.append("floorplan_file", payload.floorplan_file);
    if (payload.cad_file) form.append("cad_file", payload.cad_file);
    const res = await api.post<InteriorProject>("interior_design/projects/", form);
    return res.data;
}

export async function saveProjectLayout(
    id: number,
    layout_data: LayoutData,
    style_preference?: Record<string, string>
): Promise<InteriorProject> {
    const res = await api.post<InteriorProject>(`interior_design/projects/${id}/apply-layout/`, {
        layout_data,
        style_preference,
    });
    return res.data;
}

export async function requestAiSuggestions(id: number, prompt: string): Promise<AiSuggestResponse> {
    const res = await api.post<AiSuggestResponse>(`interior_design/projects/${id}/ai-suggest/`, {
        prompt,
    });
    return res.data;
}

export async function getAiStatus(): Promise<AiStatusResponse> {
    const res = await api.get<AiStatusResponse>("interior_design/projects/ai-status/");
    return res.data;
}

export async function getFurnitureCatalog(): Promise<FurnitureCategoryGroup[]> {
    const res = await api.get<FurnitureCategoryGroup[]>("interior_design/projects/furniture-catalog/");
    return Array.isArray(res.data) ? res.data : [];
}

export async function getElectricalCatalog(): Promise<ElectricalCategoryGroup[]> {
    const res = await api.get<ElectricalCategoryGroup[]>(
        "interior_design/projects/electrical-catalog/"
    );
    return Array.isArray(res.data) ? res.data : [];
}

export async function getStructureCatalog(): Promise<StructureCategoryGroup[]> {
    const res = await api.get<StructureCategoryGroup[]>(
        "interior_design/projects/structure-catalog/"
    );
    return Array.isArray(res.data) ? res.data : [];
}

export async function deleteInteriorProject(id: number): Promise<void> {
    await api.delete(`interior_design/projects/${id}/`);
}
