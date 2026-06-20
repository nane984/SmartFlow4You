import api from "../../api/api";

export type ManagedUser = {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    role_label: string;
    last_login: string | null;
    is_active: boolean;
};

export type CreateUserPayload = {
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    password: string;
    is_active?: boolean;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
    password?: string;
};

export async function listManagedUsers(): Promise<ManagedUser[]> {
    const { data } = await api.get<ManagedUser[]>("core/users/");
    return data;
}

export async function createManagedUser(payload: CreateUserPayload): Promise<ManagedUser> {
    const { data } = await api.post<ManagedUser>("core/users/", payload);
    return data;
}

export async function updateManagedUser(id: number, payload: UpdateUserPayload): Promise<ManagedUser> {
    const { data } = await api.patch<ManagedUser>(`core/users/${id}/`, payload);
    return data;
}

export async function deleteManagedUser(id: number): Promise<void> {
    await api.delete(`core/users/${id}/`);
}
