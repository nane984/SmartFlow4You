import api from "../../api/api";
import type { ApiPage } from "../../components/common/Pagenation.type";
import type {
    TenderDefinition,
    TenderDefinitionExecutionLog,
    TenderDefinitionPayload,
    TenderDefinitionRunTestResult,
    TenderNotification,
} from "./tenderDefinition.types";

function unwrapList<T>(data: ApiPage<T> | T[]): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
}

export async function getTenderDefinitions(): Promise<TenderDefinition[]> {
    const res = await api.get<ApiPage<TenderDefinition> | TenderDefinition[]>("/tender-definitions/");
    return unwrapList(res.data);
}

export async function getTenderDefinitionById(id: number): Promise<TenderDefinition> {
    const res = await api.get<TenderDefinition>(`/tender-definitions/${id}/`);
    return res.data;
}

export async function createTenderDefinition(data: TenderDefinitionPayload): Promise<TenderDefinition> {
    const res = await api.post<TenderDefinition>("/tender-definitions/", data);
    return res.data;
}

export async function updateTenderDefinition(
    id: number,
    data: Partial<TenderDefinitionPayload>,
): Promise<TenderDefinition> {
    const res = await api.patch<TenderDefinition>(`/tender-definitions/${id}/`, data);
    return res.data;
}

export async function deleteTenderDefinition(id: number): Promise<void> {
    await api.delete(`/tender-definitions/${id}/`);
}

export async function runTenderDefinition(id: number): Promise<TenderDefinitionExecutionLog> {
    const res = await api.post<TenderDefinitionExecutionLog>(`/tender-definitions/${id}/run/`);
    return res.data;
}

export async function runTestTenderDefinition(id: number): Promise<TenderDefinitionRunTestResult> {
    const res = await api.post<TenderDefinitionRunTestResult>(`/tender-definitions/${id}/run_test/`);
    return res.data;
}

export async function toggleTenderDefinitionActive(id: number): Promise<TenderDefinition> {
    const res = await api.post<TenderDefinition>(`/tender-definitions/${id}/toggle_active/`);
    return res.data;
}

export async function getTenderDefinitionLogs(
    definitionId?: number,
): Promise<TenderDefinitionExecutionLog[]> {
    const url = definitionId
        ? `/tender-definition-logs/?tender_definition=${definitionId}`
        : "/tender-definition-logs/";
    const res = await api.get<ApiPage<TenderDefinitionExecutionLog> | TenderDefinitionExecutionLog[]>(url);
    return unwrapList(res.data);
}

export async function getTenderNotifications(unreadOnly = false): Promise<TenderNotification[]> {
    const url = unreadOnly ? "/tender-notifications/?unread=1" : "/tender-notifications/";
    const res = await api.get<ApiPage<TenderNotification> | TenderNotification[]>(url);
    return unwrapList(res.data);
}

export async function getTenderNotificationUnreadCount(): Promise<number> {
    const res = await api.get<{ count: number }>("/tender-notifications/unread_count/");
    return res.data.count;
}

export async function markTenderNotificationRead(id: number): Promise<TenderNotification> {
    const res = await api.patch<TenderNotification>(`/tender-notifications/${id}/`, { is_read: true });
    return res.data;
}

export async function markAllTenderNotificationsRead(): Promise<void> {
    await api.post("/tender-notifications/mark_all_read/");
}
