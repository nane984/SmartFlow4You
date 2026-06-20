import api from "../../api/api";
import type { ApiPage } from "../../components/common/Pagenation.type";
import { datetimeLocalToIso } from "../../util/datetimeLocal";
import type { Tender, TenderCreatePayload, TenderItem, TenderItemCreatePayload } from "./tenderTypes";

function buildTenderFormData(data: TenderCreatePayload, document: File | null): FormData {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("description", data.description);
    fd.append("status", data.status);
    fd.append("investor", String(data.investor));
    fd.append("company", String(data.investor));
    fd.append("deadline", datetimeLocalToIso(data.deadline));
    fd.append("source", data.source);
    fd.append("external_id", data.external_id);
    fd.append("source_url", data.source_url);
    fd.append("tender_type", data.tender_type);
    if (data.visibility) fd.append("visibility", data.visibility);
    if (data.analysis_notes) fd.append("analysis_notes", data.analysis_notes);
    if (document) {
        fd.append("document", document);
    }
    return fd;
}

function unwrapList<T>(data: ApiPage<T> | T[]): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
}

export async function getTenders(): Promise<Tender[]> {
    const res = await api.get<ApiPage<Tender> | Tender[]>("/tenders/");
    return unwrapList(res.data);
}

export async function getTenderById(id: number): Promise<Tender> {
    const res = await api.get<Tender>(`/tenders/${id}/`);
    return res.data;
}

/** POST multipart/form-data — required for optional file upload on create. */
export async function createTender(data: TenderCreatePayload, document: File | null = null): Promise<Tender> {
    const fd = buildTenderFormData(data, document);
    const res = await api.post<Tender>("/tenders/", fd);
    return res.data;
}

export async function updateTender(
    id: number,
    data: TenderCreatePayload,
    document: File | null = null
): Promise<Tender> {
    const fd = buildTenderFormData(data, document);
    const res = await api.put<Tender>(`/tenders/${id}/`, fd);
    return res.data;
}

export async function deleteTender(id: number): Promise<void> {
    await api.delete(`/tenders/${id}/`);
}

export async function createTenderItem(
    tenderId: number,
    data: TenderItemCreatePayload
): Promise<TenderItem> {
    const res = await api.post<TenderItem>("/items/", {
        tender: tenderId,
        name: data.name.trim(),
        unit: data.unit.trim(),
        quantity: data.quantity,
    });
    return res.data;
}
