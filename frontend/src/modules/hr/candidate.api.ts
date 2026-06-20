import api from "../../api/api";

export type CandidateRecord = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
};

export type RegisterCandidatePayload = {
    first_name: string;
    last_name: string;
    email: string;
};

export async function registerCandidate(data: RegisterCandidatePayload): Promise<CandidateRecord> {
    const res = await api.post<CandidateRecord>("candidates/", {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim().toLowerCase(),
    });
    return res.data;
}
