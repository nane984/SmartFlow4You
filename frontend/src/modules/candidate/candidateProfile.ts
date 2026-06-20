import type { StoredUser } from "../../auth/accessUtils";
import type { CandidateRecord } from "../hr/candidate.api";

export type CandidateProfile = {
    firstName: string;
    lastName: string;
    email: string;
    hrCandidateId?: number;
};

const STORAGE_KEY = "candidate_profile";

export function profileFromStoredUser(user: StoredUser | null): CandidateProfile | null {
    if (!user?.email?.trim()) return null;
    return {
        firstName: user.first_name?.trim() ?? "",
        lastName: user.last_name?.trim() ?? "",
        email: user.email.trim(),
    };
}

export function profileFromHrRecord(record: CandidateRecord): CandidateProfile {
    return {
        firstName: record.first_name,
        lastName: record.last_name,
        email: record.email,
        hrCandidateId: record.id,
    };
}

export function getCandidateProfile(): CandidateProfile | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        const p = JSON.parse(raw) as CandidateProfile;
        if (!p.firstName?.trim() || !p.email?.trim()) return null;
        return {
            firstName: p.firstName.trim(),
            lastName: (p.lastName ?? "").trim(),
            email: p.email.trim(),
            hrCandidateId: p.hrCandidateId,
        };
    } catch {
        return null;
    }
}

export function saveCandidateProfile(profile: CandidateProfile): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function candidateDisplayName(profile: CandidateProfile | null): string {
    if (!profile) return "";
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ");
}

/** Best profile for job apply: logged-in user beats localStorage guest profile. */
export function resolveApplyProfile(
    storedUser: StoredUser | null,
    guestProfile: CandidateProfile | null
): CandidateProfile | null {
    return profileFromStoredUser(storedUser) ?? guestProfile;
}
