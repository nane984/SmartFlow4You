import api from "../../api/api";

export type ApplicationStatusHistoryEntry = {
    id: number;
    application_id: number;
    candidate_name: string;
    job_title: string;
    from_status: string;
    from_status_label: string;
    to_status: string;
    to_status_label: string;
    changed_at: string;
    changed_by: number | null;
    changed_by_name: string;
    note: string;
};

export async function listApplicationStatusHistory(params?: {
    application?: number;
    job_post?: number;
}): Promise<ApplicationStatusHistoryEntry[]> {
    const { data } = await api.get<ApplicationStatusHistoryEntry[]>(
        "hr/application-status-history/",
        { params }
    );
    return Array.isArray(data) ? data : [];
}

export async function getApplicationStatusHistory(
    applicationId: number
): Promise<ApplicationStatusHistoryEntry[]> {
    const { data } = await api.get<ApplicationStatusHistoryEntry[]>(
        `applications/${applicationId}/status-history/`
    );
    return Array.isArray(data) ? data : [];
}
