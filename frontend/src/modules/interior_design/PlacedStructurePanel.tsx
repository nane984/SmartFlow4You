import Button from "../../components/ui/Button";
import Field from "../../components/ui/Field";
import { controlClass } from "../../components/ui/inputStyles";
import CatalogSymbolPreview from "./CatalogSymbolPreview";
import type { PlanStructureItem } from "./types";
import {
    formatDimensions,
    isStructureOpening,
    isStructureWall,
    STRUCTURE_PART_TYPES,
    wallLengthM,
} from "./types";

type Props = {
    item: PlanStructureItem | null;
    roomHeight: number;
    onChange: (item: PlanStructureItem) => void;
    onRemove: () => void;
    onRotate?: () => void;
};

export default function PlacedStructurePanel({
    item,
    roomHeight,
    onChange,
    onRemove,
    onRotate,
}: Props) {
    if (!item) {
        return (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
                Pick a wall, window, or door from the catalog. Select a placed item to change its color and
                dimensions.
            </div>
        );
    }

    const update = (patch: Partial<PlanStructureItem>) => onChange({ ...item, ...patch });
    const partLabel =
        STRUCTURE_PART_TYPES.find((p) => p.value === item.partType)?.label ?? item.partType;

    return (
        <div className="space-y-4 rounded-xl border border-stone-300 bg-white p-4">
            <div>
                <h3 className="text-sm font-semibold text-stone-900">Selected {partLabel.toLowerCase()}</h3>
                {item.identifier ? <p className="text-xs text-stone-500">{item.identifier}</p> : null}
            </div>

            <CatalogSymbolPreview
                imageUrl={item.imageUrl}
                cadUrl={item.cadUrl}
                fallbackColor={item.color}
                className="h-36 w-full"
                pixelSize={256}
            />

            <Field label="Label">
                <input
                    className={controlClass}
                    value={item.label}
                    onChange={(e) => update({ label: e.target.value })}
                />
            </Field>

            <Field label="Color">
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={item.color}
                        onChange={(e) => update({ color: e.target.value })}
                        className="h-9 w-12 cursor-pointer rounded border border-stone-300"
                    />
                    <input
                        className={controlClass}
                        value={item.color}
                        onChange={(e) => update({ color: e.target.value })}
                    />
                </div>
            </Field>

            <div className="grid grid-cols-2 gap-2">
                <Field label="Height (m)">
                    <input
                        type="number"
                        min={0.1}
                        step={0.05}
                        className={controlClass}
                        value={item.height}
                        onChange={(e) => update({ height: Number(e.target.value) })}
                    />
                </Field>
                <Field label="Thickness (m)">
                    <input
                        type="number"
                        min={0.04}
                        step={0.01}
                        className={controlClass}
                        value={item.depth}
                        onChange={(e) => update({ depth: Number(e.target.value) })}
                    />
                </Field>
            </div>

            {isStructureOpening(item) ? (
                <>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Width (m)">
                            <input
                                type="number"
                                min={0.2}
                                step={0.05}
                                className={controlClass}
                                value={item.width ?? 1}
                                onChange={(e) => update({ width: Number(e.target.value) })}
                            />
                        </Field>
                        <Field label="Sill height (m)">
                            <input
                                type="number"
                                min={0}
                                max={roomHeight}
                                step={0.05}
                                className={controlClass}
                                value={item.elevation}
                                onChange={(e) => update({ elevation: Number(e.target.value) })}
                            />
                        </Field>
                    </div>
                    {onRotate ? (
                        <Button type="button" variant="secondary" size="sm" onClick={onRotate}>
                            Rotate 90°
                        </Button>
                    ) : null}
                </>
            ) : null}

            {isStructureWall(item) ? (
                <p className="text-xs text-stone-600">
                    Length: {wallLengthM(item).toFixed(2)} m · height {item.height.toFixed(2)} m
                </p>
            ) : isStructureOpening(item) ? (
                <p className="text-xs text-stone-600">
                    {formatDimensions(item.width ?? 1, item.depth, item.height)}
                </p>
            ) : null}

            <Button type="button" variant="secondary" size="sm" onClick={onRemove}>
                Remove from plan
            </Button>
        </div>
    );
}
