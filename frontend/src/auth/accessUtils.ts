import { DOMAIN_ROLES, type AccessDomain, ACCESS_DOMAINS } from "./accessConfig";
import type { AppRole } from "./roles";
import { normalizeRole, roleInList, ROLES } from "./roles";
import { getUserRole, isAccessTokenValid } from "./authUtils";

export type StoredUser = {
    id?: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    role_raw?: string;
    role_label?: string;
    company_id?: number | null;
    company_name?: string | null;
};

function parseRoleFromUserObject(): AppRole | null {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as StoredUser;
        return normalizeRole(parsed.role);
    } catch {
        return null;
    }
}

/** Effective role from storage (JWT login or placeholder mock session). */
export function getEffectiveRole(): AppRole | null {
    const mock = localStorage.getItem("mock_role");
    const mockRole = normalizeRole(mock);
    if (mockRole) return mockRole;
    return getUserRole() ?? parseRoleFromUserObject();
}

export function getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as StoredUser;
    } catch {
        return null;
    }
}

export function setStoredUser(user: StoredUser): void {
    localStorage.setItem("user", JSON.stringify(user));
}

export function getStoredCompanyId(): number | null {
    const user = getStoredUser();
    if (user?.company_id != null) return user.company_id;
    return null;
}

export function hasAccessToDomain(domain: AccessDomain): boolean {
    if (domain === ACCESS_DOMAINS.CANDIDATE_PUBLIC) {
        return true;
    }
    const role = getEffectiveRole();
    if (!role) return false;
    return roleInList(role, DOMAIN_ROLES[domain]);
}

export function roleHomePath(role: AppRole | null): string {
    const normalized = normalizeRole(role);
    switch (normalized) {
        case ROLES.ADMIN:
            return "/dashboard";
        case ROLES.TENDER:
        case ROLES.TENDER_USER:
            return "/tenders";
        case ROLES.SUPPLIER:
            return "/offers";
        case ROLES.HR_ADMIN:
            return "/dashboard";
        case ROLES.INTERVIEWER:
            return "/interviewer-dashboard";
        case ROLES.CANDIDATE:
            return "/candidate";
        case ROLES.DESIGNER:
            return "/interior";
        default:
            return "/dashboard";
    }
}

/** Placeholder session for demos (no JWT). Cleared on real login. */
export function setMockSession(role: AppRole): void {
    const normalized = normalizeRole(role) ?? role;
    localStorage.setItem("mock_session", "true");
    localStorage.setItem("mock_role", normalized);
    localStorage.setItem("role", normalized);
}

export function clearMockSession(): void {
    localStorage.removeItem("mock_session");
    localStorage.removeItem("mock_role");
}

export function hasMockSession(): boolean {
    return localStorage.getItem("mock_session") === "true" && !!getEffectiveRole();
}

/** JWT login or placeholder mock session. */
export function isAppAuthenticated(): boolean {
    return hasMockSession() || isAccessTokenValid(localStorage.getItem("access"));
}
