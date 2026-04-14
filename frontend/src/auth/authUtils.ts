/** Clears tokens stored by the login flow. */
export function clearAuthStorage(): void {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
}

function decodeJwtPayload(token: string): { exp?: number } | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const segment = parts[1];
    try {
        const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const json = atob(padded);
        return JSON.parse(json) as { exp?: number };
    } catch {
        return null;
    }
}

/**
 * Returns true only for a non-empty JWT whose `exp` is in the future (with small skew).
 */
export function isAccessTokenValid(token: string | null | undefined): boolean {
    if (!token || typeof token !== "string" || !token.trim()) return false;
    const payload = decodeJwtPayload(token.trim());
    if (!payload || typeof payload.exp !== "number") return false;
    const skewMs = 30_000;
    return payload.exp * 1000 > Date.now() - skewMs;
}
