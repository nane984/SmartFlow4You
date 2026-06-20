/** Convert ISO datetime from API to `datetime-local` input value (local timezone). */
export function isoToDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert `datetime-local` input value to ISO string for API. */
export function datetimeLocalToIso(value: string): string {
    if (!value.trim()) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toISOString();
}
