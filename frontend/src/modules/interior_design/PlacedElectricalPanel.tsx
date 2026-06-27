import Button from "../../components/ui/Button";
import Field from "../../components/ui/Field";
import { controlClass } from "../../components/ui/inputStyles";
import type { PlanPlacedItem } from "./types";
import {
    ELECTRICAL_PART_TYPES,
    formatDimensions,
    formatElectricalSpecs,
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

export default function PlacedElectricalPanel({ item, roomHeight, onChange, onRemove, onRotate }: Props) {
    if (!item) {
        return (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-sm text-amber-950/80">
                Select a placed electrical part on the canvas to edit specs, dimensions, and circuit.
            </div>
        );
    }

    const update = (patch: Partial<PlanPlacedItem>) => onChange({ ...item, ...patch });

    return (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-white p-4">
            <div>
                <h3 className="text-sm font-semibold text-amber-950">Selected part</h3>
                {item.identifier ? <p className="text-xs text-slate-500">{item.identifier}</p> : null}
                {item.partType ? (
                    <p className="text-xs text-amber-800">
                        {ELECTRICAL_PART_TYPES.find((p) => p.value === item.partType)?.label ??
                            item.partType}
                    </p>
                ) : null}
            </div>

            {item.imageUrl ? (
                <img
                    src={item.imageUrl}
                    alt=""
                    className="h-32 w-full rounded-lg border border-amber-200 object-contain bg-amber-50"
                />
            ) : null}

            <Field label="Label">
                <input
                    className={controlClass}
                    value={item.label}
                    onChange={(e) => update({ label: e.target.value })}
                />
            </Field>

            <div className="grid grid-cols-2 gap-2">
                <Field label="Voltage (V)">
                    <input
                        type="number"
                        step={1}
                        className={controlClass}
                        value={item.voltageV ?? ""}
                        onChange={(e) =>
                            update({
                                voltageV: e.target.value === "" ? null : Number(e.target.value),
                            })
                        }
                    />
                </Field>
                <Field label="Current (A)">
                    <input
                        type="number"
                        step={0.1}
                        className={controlClass}
                        value={item.amperageA ?? ""}
                        onChange={(e) =>
                            update({
                                amperageA: e.target.value === "" ? null : Number(e.target.value),
                            })
                        }
                    />
                </Field>
                <Field label="Wire (mm²)">
                    <input
                        type="number"
                        step={0.1}
                        className={controlClass}
                        value={item.wireGaugeMm2 ?? ""}
                        onChange={(e) =>
                            update({
                                wireGaugeMm2: e.target.value === "" ? null : Number(e.target.value),
                            })
                        }
                    />
                </Field>
                <Field label="Phases">
                    <select
                        className={controlClass}
                        value={item.phases ?? ""}
                        onChange={(e) =>
                            update({
                                phases: e.target.value === "" ? null : Number(e.target.value),
                            })
                        }
                    >
                        <option value="">—</option>
                        <option value="1">1-phase</option>
                        <option value="3">3-phase</option>
                    </select>
                </Field>
            </div>

            <Field label="Circuit ID">
                <input
                    className={controlClass}
                    value={item.circuitId ?? ""}
                    onChange={(e) => update({ circuitId: e.target.value })}
                    placeholder="e.g. C1"
                />
            </Field>

            <div className="grid grid-cols-3 gap-2">
                <Field label="Width (m)">
                    <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        className={controlClass}
                        value={item.width}
                        onChange={(e) => update({ width: Number(e.target.value) })}
                    />
                </Field>
                <Field label="Depth (m)">
                    <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        className={controlClass}
                        value={item.depth}
                        onChange={(e) => update({ depth: Number(e.target.value) })}
                    />
                </Field>
                <Field label="Height (m)">
                    <input
                        type="number"
                        min={0}
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
                <Field label="Bottom height from floor (m)" hint="e.g. 1.1 for switches, 0.3 for outlets">
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

            <Field label="Symbol color">
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

            <p className="text-xs text-slate-600">{formatElectricalSpecs(item)}</p>
            <p className="text-xs text-slate-500">
                Footprint: {formatDimensions(item.width, item.depth, item.height)}
            </p>
            <p className="text-xs text-amber-800">{formatMountLabel(item, roomHeight)}</p>

            {item.cadUrl ? (
                <a
                    href={item.cadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-medium text-amber-800 underline"
                >
                    View CAD symbol
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
