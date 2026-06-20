import api from "../../api/api";

export type SupplierRequestStatus = "pending" | "approved" | "rejected";

export type SupplierRegistrationRequest = {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    company_name: string;
    company_city: string;
    company_phone: string;
    contact_person: string;
    status: SupplierRequestStatus;
    submitted_at: string;
    reviewed_at: string | null;
    reviewed_by: number | null;
    reviewed_by_name: string | null;
    review_notes: string;
    created_user: number | null;
};

export type SupplierRegistrationPayload = {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    company_name: string;
    company_city: string;
    company_phone?: string;
    contact_person?: string;
};

export async function submitSupplierRegistration(
    payload: SupplierRegistrationPayload
): Promise<{ detail: string; id: number; status: string }> {
    const { data } = await api.post("core/supplier-registration-requests/", payload);
    return data;
}

export async function listSupplierRegistrationRequests(
    status?: SupplierRequestStatus
): Promise<SupplierRegistrationRequest[]> {
    const params = status ? { status } : undefined;
    const { data } = await api.get<SupplierRegistrationRequest[]>(
        "core/supplier-registration-requests/",
        { params }
    );
    return data;
}

export async function approveSupplierRequest(
    id: number,
    review_notes?: string
): Promise<SupplierRegistrationRequest> {
    const { data } = await api.post<SupplierRegistrationRequest>(
        `core/supplier-registration-requests/${id}/approve/`,
        { review_notes: review_notes ?? "" }
    );
    return data;
}

export async function rejectSupplierRequest(
    id: number,
    review_notes: string
): Promise<SupplierRegistrationRequest> {
    const { data } = await api.post<SupplierRegistrationRequest>(
        `core/supplier-registration-requests/${id}/reject/`,
        { review_notes }
    );
    return data;
}
