import { DOMAIN_ROLES, type AccessDomain, ACCESS_DOMAINS } from "./accessConfig";
import type { AppRole } from "./roles";
import { ROLES } from "./roles";
import { getUserRole, isAccessTokenValid } from "./authUtils";

const ALL_ROLES: AppRole[] = Object.values(ROLES);

function parseRoleFromUserObject(): AppRole | null {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as { role?: unknown };
        const value = typeof parsed.role === "string" ? parsed.role.toLowerCase() : "";
        return ALL_ROLES.includes(value as AppRole) ? (value as AppRole) : null;
    } catch {
        return null;
    }
}

/** Effective role from storage (JWT login or placeholder mock session). */
export function getEffectiveRole(): AppRole | null {
    const mock = localStorage.getItem("mock_role")?.toLowerCase();
    if (mock && ALL_ROLES.includes(mock as AppRole)) {
        return mock as AppRole;
    }
    return getUserRole() ?? parseRoleFromUserObject();
}

export function hasAccessToDomain(domain: AccessDomain): boolean {
    if (domain === ACCESS_DOMAINS.CANDIDATE_PUBLIC) {
        return true;
    }
    const role = getEffectiveRole();
    if (!role) return false;
    return DOMAIN_ROLES[domain].includes(role);
}

export function roleHomePath(role: AppRole | null): string {
    switch (role) {
        case ROLES.ADMIN:
            return "/admin-dashboard";
        case ROLES.INVESTOR:
            return "/tenders";
        case ROLES.HR:
            return "/hr/jobs";
        case ROLES.INTERVIEWER:
            return "/interviewer-dashboard";
        case ROLES.CANDIDATE:
            return "/candidate";
        default:
            return "/dashboard";
    }
}

/** Placeholder session for demos (no JWT). Cleared on real login. */
export function setMockSession(role: AppRole): void {
    localStorage.setItem("mock_session", "true");
    localStorage.setItem("mock_role", role);
    localStorage.setItem("role", role);
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
