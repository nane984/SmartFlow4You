import { useEffect, useRef, useState } from "react";
import {
    isRenderablePlanBackground,
    loadItemSymbolSurface,
    pickItemSymbolUrl,
    planBackgroundKind,
} from "./planBackground";

type Props = {
    imageUrl?: string | null;
    cadUrl?: string | null;
    fallbackColor?: string;
    className?: string;
    pixelSize?: number;
};

/** Renders catalog photo or uploaded PDF/SVG/image on a small canvas. */
export default function CatalogSymbolPreview({
    imageUrl,
    cadUrl,
    fallbackColor = "#a8a29e",
    className = "h-14 w-14",
    pixelSize = 112,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "cad" | "empty">("idle");

    useEffect(() => {
        let cancelled = false;
        const picked = pickItemSymbolUrl(imageUrl, cadUrl);

        if (!picked) {
            setStatus("empty");
            return;
        }

        if (!isRenderablePlanBackground(picked.kind)) {
            setStatus("cad");
            return;
        }

        setStatus("loading");
        void (async () => {
            const surface = await loadItemSymbolSurface(
                picked.url,
                picked.kind,
                pixelSize,
                pixelSize
            );
            if (cancelled) return;
            const canvas = canvasRef.current;
            if (surface && canvas) {
                canvas.width = pixelSize;
                canvas.height = pixelSize;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.fillStyle = "#f8fafc";
                    ctx.fillRect(0, 0, pixelSize, pixelSize);
                    ctx.drawImage(surface, 0, 0, pixelSize, pixelSize);
                }
                setStatus("ready");
            } else {
                setStatus("cad");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [imageUrl, cadUrl, pixelSize]);

    const cadKind = planBackgroundKind(cadUrl ?? imageUrl ?? "");
    const cadLabel =
        cadKind === "dwg" || cadKind === "dxf" ? cadKind.toUpperCase() : cadKind === "unknown" ? "CAD" : null;

    return (
        <div
            className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 ${className}`}
        >
            <canvas
                ref={canvasRef}
                className={status === "ready" ? "h-full w-full object-contain" : "hidden"}
            />
            {status === "loading" ? (
                <span className="text-[10px] text-slate-400">…</span>
            ) : null}
            {status === "empty" ? (
                <span className="h-8 w-8 rounded" style={{ backgroundColor: fallbackColor }} />
            ) : null}
            {status === "cad" && cadLabel ? (
                <span className="px-1 text-center text-[10px] font-semibold text-slate-600">{cadLabel}</span>
            ) : null}
            {status === "cad" && !cadLabel ? (
                <span className="h-8 w-8 rounded" style={{ backgroundColor: fallbackColor }} />
            ) : null}
        </div>
    );
}
