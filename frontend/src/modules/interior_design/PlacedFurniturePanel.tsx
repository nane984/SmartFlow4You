import Button from "../../components/ui/Button";
import Field from "../../components/ui/Field";
import { controlClass } from "../../components/ui/inputStyles";
import CatalogSymbolPreview from "./CatalogSymbolPreview";
import type { PlanPlacedItem } from "./types";
import {
    formatDimensions,
    formatMountLabel,
    VERTICAL_MOUNT_OPTIONS,
    type VerticalMount,
} from "./types";

type Props = {
    item: PlanPlacedItem | null;
    roomHeight: number;
    onChange: (item: PlanPlacedItem) => void;
    onRemove: () => void;
    onRotate: () => void;
};

export default function PlacedFurniturePanel({ item, roomHeight, onChange, onRemove, onRotate }: Props) {
    if (!item) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Select a placed item on the canvas to edit its label, dimensions, and color.
            </div>
        );
    }

    const update = (patch: Partial<PlanPlacedItem>) => onChange({ ...item, ...patch });

    return (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            <div>
                <h3 className="text-sm font-semibold text-slate-900">Selected item</h3>
                {item.identifier ? (
                    <p className="text-xs text-slate-500">{item.identifier}</p>
                ) : null}
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

            <div className="grid grid-cols-3 gap-2">
                <Field label="Width (m)">
                    <input
                        type="number"
                        min={0.1}
                        step={0.05}
                        className={controlClass}
                        value={item.width}
                        onChange={(e) => update({ width: Number(e.target.value) })}
                    />
                </Field>
                <Field label="Depth (m)">
                    <input
                        type="number"
                        min={0.1}
                        step={0.05}
                        className={controlClass}
                        value={item.depth}
                        onChange={(e) => update({ depth: Number(e.target.value) })}
                    />
                </Field>
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
            </div>

            <Field label="Vertical placement">
                <select
                    className={controlClass}
                    value={item.mountFrom ?? "floor"}
                    onChange={(e) => update({ mountFrom: e.target.value as VerticalMount })}
                >
                    {VERTICAL_MOUNT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </Field>

            {item.mountFrom === "custom" ? (
                <Field label="Bottom height from floor (m)">
                    <input
                        type="number"
                        min={0}
                        max={roomHeight}
                        step={0.05}
                        className={controlClass}
                        value={item.elevation ?? 0}
                        onChange={(e) => update({ elevation: Number(e.target.value) })}
                    />
                </Field>
            ) : null}

            <Field label="Color">
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={item.color}
                        onChange={(e) => update({ color: e.target.value })}
                        className="h-9 w-12 cursor-pointer rounded border border-slate-300"
                    />
                    <input
                        className={controlClass}
                        value={item.color}
                        onChange={(e) => update({ color: e.target.value })}
                    />
                </div>
            </Field>

            <p className="text-xs text-slate-500">
                Footprint: {formatDimensions(item.width, item.depth, item.height)}
            </p>
            <p className="text-xs text-slate-600">{formatMountLabel(item, roomHeight)}</p>

            {item.cadUrl ? (
                <a
                    href={item.cadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-medium text-brand-700 underline"
                >
                    View CAD file
                </a>
            ) : null}

            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={onRotate}>
                    Rotate 90°
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={onRemove}>
                    Remove from plan
                </Button>
            </div>
        </div>
    );
}
