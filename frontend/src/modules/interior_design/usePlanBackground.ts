import { useEffect, useState } from "react";
import {
    isRenderablePlanBackground,
    loadPlanBackgroundSurface,
    type PlanBackgroundKind,
} from "./planBackground";

type PlanBackgroundState = {
    surface: HTMLCanvasElement | null;
    loading: boolean;
    error: string | null;
    kind: PlanBackgroundKind;
};

export function usePlanBackground(
    url: string | null | undefined,
    kind: PlanBackgroundKind,
    roomPixelWidth: number,
    roomPixelHeight: number
): PlanBackgroundState {
    const [surface, setSurface] = useState<HTMLCanvasElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url || !isRenderablePlanBackground(kind)) {
            setSurface(null);
            setLoading(false);
            setError(null);
            return;
        }

        if (roomPixelWidth < 1 || roomPixelHeight < 1) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        void loadPlanBackgroundSurface(url, kind, roomPixelWidth, roomPixelHeight)
            .then((canvas) => {
                if (!cancelled) setSurface(canvas);
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setSurface(null);
                    setError(err instanceof Error ? err.message : "Could not load floor plan.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [url, kind, roomPixelWidth, roomPixelHeight]);

    return { surface, loading, error, kind };
}
