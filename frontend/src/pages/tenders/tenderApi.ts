import api from "../../api/api";
import type { ApiPage } from "../../components/common/Pagenation.type";
import type { Tender, TenderCreatePayload, TenderItem, TenderItemCreatePayload } from "./tenderTypes";

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

export async function createTender(data: TenderCreatePayload): Promise<Tender> {
    const payload = {
        ...data,
        deadline: new Date(data.deadline).toISOString(),
    };
    const res = await api.post<Tender>("/tenders/", payload);
    return res.data;
}

export async function updateTender(id: number, data: TenderCreatePayload): Promise<Tender> {
    const payload = {
        ...data,
        deadline: new Date(data.deadline).toISOString(),
    };
    const res = await api.put<Tender>(`/tenders/${id}/`, payload);
    return res.data;
}

export async function deleteTender(id: number): Promise<void> {
    await api.delete(`/tenders/${id}/`);
}

/** POST /items/?tender=<id> — tender assigned server-side when query param is set. */
export async function createTenderItem(
    tenderId: number,
    data: TenderItemCreatePayload
): Promise<TenderItem> {
    const res = await api.post<TenderItem>(`/items/?tender=${tenderId}`, {
        name: data.name.trim(),
        unit: data.unit.trim(),
        quantity: data.quantity,
    });
    return res.data;
}
