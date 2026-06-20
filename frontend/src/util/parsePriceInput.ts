/**
 * Parse user-entered price text into a finite number.
 * Strips currency symbols, handles US/EU thousand separators.
 */
export function parsePriceInput(raw: string): number | null {
    let s = raw.trim();
    if (!s) return null;

    s = s.replace(/[€$£\s]/g, "").replace(/\b(EUR|USD|GBP|RSD|CHF)\b/gi, "");

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    if (hasComma && hasDot) {
        const lastComma = s.lastIndexOf(",");
        const lastDot = s.lastIndexOf(".");
        if (lastComma > lastDot) {
            s = s.replace(/\./g, "").replace(",", ".");
        } else {
            s = s.replace(/,/g, "");
        }
    } else if (hasComma) {
        const parts = s.split(",");
        if (parts.length === 2 && parts[1].length <= 2) {
            s = `${parts[0].replace(/\./g, "")}.${parts[1]}`;
        } else {
            s = s.replace(/,/g, "");
        }
    } else if (hasDot) {
        const parts = s.split(".");
        if (parts.length > 2) {
            s = parts.join("");
        }
    }

    s = s.replace(/[^\d.-]/g, "");
    if (!s || s === "-" || s === ".") return null;

    const n = Number.parseFloat(s);
    return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Format for API DecimalField (plain decimal string, no grouping). */
export function formatPriceForApi(value: number): string {
    return String(value);
}
