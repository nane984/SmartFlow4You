import api from "../../api/api";
import type { StoredUser } from "../../auth/accessUtils";

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

export type CandidateProfileResponse = {
    account: StoredUser & { role_label?: string; is_authenticated?: boolean };
    hr_profile: CandidateRecord | null;
    linked: boolean;
};

/** Guest / public — create HR candidate profile (no platform login). */
export async function registerCandidate(data: RegisterCandidatePayload): Promise<CandidateRecord> {
    const res = await api.post<CandidateRecord>("hr/candidates/", {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim().toLowerCase(),
    });
    return res.data;
}

/** Logged-in candidate — fetch account + linked HR profile. */
export async function getCandidateProfileMe(): Promise<CandidateProfileResponse> {
    const { data } = await api.get<CandidateProfileResponse>("me/candidate-profile/");
    return data;
}

/** Logged-in candidate — ensure HR profile exists (linked by account email). */
export async function syncCandidateProfileMe(): Promise<{
    hr_profile: CandidateRecord;
    linked: boolean;
    created: boolean;
}> {
    const { data } = await api.post<{
        hr_profile: CandidateRecord;
        linked: boolean;
        created: boolean;
    }>("me/candidate-profile/");
    return data;
}
