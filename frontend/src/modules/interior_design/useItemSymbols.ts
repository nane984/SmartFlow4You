import { useEffect, useState } from "react";
import {
    loadItemSymbolSurface,
    pickItemSymbolUrl,
    type PlanBackgroundKind,
} from "./planBackground";
import type { PlanPlacedItem } from "./types";

export type ItemSymbolEntry = {
    surface: HTMLCanvasElement;
    kind: PlanBackgroundKind;
};

/** Load top-view symbols (photo / PDF / SVG) for placed catalog items. */
export function useItemSymbols(items: PlanPlacedItem[], pixelScale: number): Map<string, ItemSymbolEntry> {
    const [symbols, setSymbols] = useState<Map<string, ItemSymbolEntry>>(new Map());

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const urlCache = new Map<string, ItemSymbolEntry>();
            const next = new Map<string, ItemSymbolEntry>();

            for (const item of items) {
                const picked = pickItemSymbolUrl(item.imageUrl, item.cadUrl);
                if (!picked) continue;

                const pw = Math.max(16, Math.ceil(item.width * pixelScale));
                const ph = Math.max(16, Math.ceil(item.depth * pixelScale));
                const cacheKey = `${picked.url}@${pw}x${ph}`;

                let entry = urlCache.get(cacheKey);
                if (!entry) {
                    const surface = await loadItemSymbolSurface(
                        picked.url,
                        picked.kind,
                        pw,
                        ph
                    );
                    if (!surface) continue;
                    entry = { surface, kind: picked.kind };
                    urlCache.set(cacheKey, entry);
                }
                next.set(item.id, entry);
            }

            if (!cancelled) setSymbols(next);
        })();

        return () => {
            cancelled = true;
        };
    }, [items, pixelScale]);

    return symbols;
}
