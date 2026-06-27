const API_ORIGIN =
    (import.meta.env.VITE_API_ORIGIN as string | undefined)?.replace(/\/$/, "") ??
    "http://localhost:8000";

/** Resolve Django media or API file paths to an absolute URL. */
export function mediaUrl(path: string | null | undefined): string {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith("/")) return `${API_ORIGIN}${path}`;
    return `${API_ORIGIN}/${path}`;
}

/** @deprecated alias — use mediaUrl */
export function resolveMediaUrl(path: string | null | undefined): string {
    return mediaUrl(path);
}

/** Extract a display filename from a media URL or path. */
export function documentFileName(path: string | null | undefined): string {
    if (!path) return "Document";
    const segment = path.split("/").pop()?.split("?")[0] ?? "";
    try {
        return decodeURIComponent(segment) || "Document";
    } catch {
        return segment || "Document";
    }
}
