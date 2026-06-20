import api from "../api/api";

/** Extract a display file name from a media URL path. */
export function documentFileName(url: string): string {
    const path = url.split("?")[0].split("/").filter(Boolean).pop() ?? "Document";
    try {
        return decodeURIComponent(path);
    } catch {
        return path;
    }
}

/** Resolve API FileField URLs (relative `/media/...` or absolute) for links and downloads. */
export function resolveMediaUrl(url: string | null | undefined): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = api.defaults.baseURL ?? "";
    try {
        const u = new URL(base);
        const origin = `${u.protocol}//${u.host}`;
        const path = url.startsWith("/") ? url : `/${url}`;
        return `${origin}${path}`;
    } catch {
        return url;
    }
}
