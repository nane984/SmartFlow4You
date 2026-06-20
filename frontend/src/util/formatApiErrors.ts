/** Flatten DRF-style validation errors into a single human-readable string. */
export function formatApiErrors(data: unknown): string {
    if (data == null) return "Request failed.";
    if (typeof data === "string") return data;
    if (typeof data !== "object") return "Request failed.";

    const parts: string[] = [];
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        if (Array.isArray(value)) {
            const msgs = value.map((v) => (typeof v === "string" ? v : formatApiErrors(v)));
            parts.push(`${key}: ${msgs.join(", ")}`);
        } else if (typeof value === "object" && value !== null) {
            parts.push(`${key}: ${formatApiErrors(value)}`);
        } else {
            parts.push(`${key}: ${String(value)}`);
        }
    }
    return parts.length > 0 ? parts.join(" · ") : "Request failed.";
}
