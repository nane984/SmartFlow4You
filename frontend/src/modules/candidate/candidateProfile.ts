export type CandidateProfile = {
    firstName: string;
    lastName: string;
    email: string;
};

const STORAGE_KEY = "candidate_profile";

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
