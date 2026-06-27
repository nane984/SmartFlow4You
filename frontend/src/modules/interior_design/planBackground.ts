export type PlanBackgroundKind = "pdf" | "image" | "svg" | "dwg" | "dxf" | "unknown";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp)($|\?)/i;
const PDF_EXT = /\.pdf($|\?)/i;
const SVG_EXT = /\.svg($|\?)/i;
const DWG_EXT = /\.dwg($|\?)/i;
const DXF_EXT = /\.dxf($|\?)/i;

export function planBackgroundKind(url: string | null | undefined): PlanBackgroundKind {
    if (!url) return "unknown";
    if (PDF_EXT.test(url)) return "pdf";
    if (SVG_EXT.test(url)) return "svg";
    if (IMAGE_EXT.test(url)) return "image";
    if (DWG_EXT.test(url)) return "dwg";
    if (DXF_EXT.test(url)) return "dxf";
    return "unknown";
}

export function isRenderablePlanBackground(kind: PlanBackgroundKind): boolean {
    return kind === "pdf" || kind === "image" || kind === "svg";
}

/** Prefer floor plan file; fall back to CAD when it is a renderable format (PDF/image/SVG). */
export function pickPlanBackgroundUrl(
    floorplanUrl: string | null | undefined,
    cadUrl: string | null | undefined
): { url: string; kind: PlanBackgroundKind } | null {
    if (floorplanUrl) {
        const kind = planBackgroundKind(floorplanUrl);
        if (isRenderablePlanBackground(kind)) return { url: floorplanUrl, kind };
    }
    if (cadUrl) {
        const kind = planBackgroundKind(cadUrl);
        if (isRenderablePlanBackground(kind)) return { url: cadUrl, kind };
    }
    if (floorplanUrl) return { url: floorplanUrl, kind: planBackgroundKind(floorplanUrl) };
    if (cadUrl) return { url: cadUrl, kind: planBackgroundKind(cadUrl) };
    return null;
}

/** Best symbol for a catalog item: any renderable photo or CAD (PDF/SVG/image). */
export function pickItemSymbolUrl(
    imageUrl: string | null | undefined,
    cadUrl: string | null | undefined
): { url: string; kind: PlanBackgroundKind } | null {
    const candidates: { url: string; kind: PlanBackgroundKind }[] = [];
    if (imageUrl) candidates.push({ url: imageUrl, kind: planBackgroundKind(imageUrl) });
    if (cadUrl) candidates.push({ url: cadUrl, kind: planBackgroundKind(cadUrl) });

    for (const c of candidates) {
        if (isRenderablePlanBackground(c.kind)) return c;
    }
    if (imageUrl) return { url: imageUrl, kind: planBackgroundKind(imageUrl) };
    if (cadUrl) return { url: cadUrl, kind: planBackgroundKind(cadUrl) };
    return null;
}

export async function loadItemSymbolSurface(
    url: string,
    kind: PlanBackgroundKind,
    pixelWidth: number,
    pixelHeight: number
): Promise<HTMLCanvasElement | null> {
    if (!isRenderablePlanBackground(kind)) return null;
    try {
        return await loadPlanBackgroundSurface(url, kind, pixelWidth, pixelHeight);
    } catch {
        return null;
    }
}

export async function fetchPlanFileBlob(url: string): Promise<Blob> {
    const token = localStorage.getItem("access");
    const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
        throw new Error(`Could not load plan file (${response.status})`);
    }
    return response.blob();
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
    const objectUrl = URL.createObjectURL(blob);
    try {
        const img = new Image();
        img.decoding = "async";
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Could not decode image"));
            img.src = objectUrl;
        });
        return img;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function renderPdfFirstPage(blob: Blob, maxWidth: number, maxHeight: number): Promise<HTMLCanvasElement> {
    const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
    const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    GlobalWorkerOptions.workerSrc = workerSrc;

    const data = await blob.arrayBuffer();
    const pdf = await getDocument({ data }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(maxWidth / viewport.width, maxHeight / viewport.height, 3);
    const scaled = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(scaled.width);
    canvas.height = Math.ceil(scaled.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    await page.render({ canvasContext: ctx, viewport: scaled }).promise;
    return canvas;
}

export async function loadPlanBackgroundSurface(
    url: string,
    kind: PlanBackgroundKind,
    roomPixelWidth: number,
    roomPixelHeight: number
): Promise<HTMLCanvasElement> {
    const blob = await fetchPlanFileBlob(url);
    const target = document.createElement("canvas");
    target.width = Math.max(1, Math.ceil(roomPixelWidth));
    target.height = Math.max(1, Math.ceil(roomPixelHeight));
    const ctx = target.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    if (kind === "pdf") {
        const page = await renderPdfFirstPage(blob, target.width * 2, target.height * 2);
        ctx.drawImage(page, 0, 0, target.width, target.height);
        return target;
    }

    if (kind === "svg") {
        const objectUrl = URL.createObjectURL(blob);
        try {
            const img = await loadImageFromUrl(objectUrl);
            ctx.drawImage(img, 0, 0, target.width, target.height);
            return target;
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    }

    const img = await blobToImage(blob);
    ctx.drawImage(img, 0, 0, target.width, target.height);
    return target;
}

async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not decode image"));
        img.src = url;
    });
    return img;
}
