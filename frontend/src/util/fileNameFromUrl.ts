/** Extract a display filename from a media or storage URL. */
export function fileNameFromUrl(url: string): string {
    const path = url.split("?")[0].split("/").filter(Boolean).pop() ?? "File";
    try {
        return decodeURIComponent(path);
    } catch {
        return path;
    }
}
