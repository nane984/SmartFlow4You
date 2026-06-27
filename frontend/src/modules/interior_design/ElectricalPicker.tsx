import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../components/ui/cn";
import CatalogSymbolPreview from "./CatalogSymbolPreview";
import type { CatalogElectricalItem, ElectricalCategoryGroup } from "./types";
import { ELECTRICAL_PART_TYPES, formatDimensions } from "./types";

type Props = {
    categories: ElectricalCategoryGroup[];
    onPick: (item: CatalogElectricalItem) => void;
};

function partLabel(partType: string): string {
    return ELECTRICAL_PART_TYPES.find((p) => p.value === partType)?.label ?? partType;
}

export default function ElectricalPicker({ categories, onPick }: Props) {
    const [query, setQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(categories[0]?.id ?? null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return categories;
        return categories
            .map((cat) => ({
                ...cat,
                items: cat.items.filter(
                    (item) =>
                        item.name.toLowerCase().includes(q) ||
                        item.identifier.toLowerCase().includes(q) ||
                        item.part_type.toLowerCase().includes(q) ||
                        cat.name.toLowerCase().includes(q)
                ),
            }))
            .filter((cat) => cat.items.length > 0);
    }, [categories, query]);

    return (
        <div className="flex h-full flex-col rounded-xl border border-amber-200 bg-amber-50/30">
            <div className="border-b border-amber-200 p-3">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-amber-950">Electrical catalog</h3>
                    <Link
                        to="/interior/electrical-catalog"
                        className="text-xs font-medium text-amber-800 hover:underline"
                    >
                        Manage
                    </Link>
                </div>
                <input
                    type="search"
                    placeholder="Search parts…"
                    className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                    <p className="p-2 text-sm text-slate-600">
                        No electrical parts.{" "}
                        <Link to="/interior/electrical-catalog" className="text-amber-800 underline">
                            Add parts
                        </Link>
                    </p>
                ) : (
                    filtered.map((category) => {
                        const open = expandedId === category.id || Boolean(query);
                        return (
                            <div key={category.id} className="mb-2">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-800 hover:bg-amber-100/60"
                                    onClick={() => setExpandedId(open && !query ? null : category.id)}
                                >
                                    <span>{category.name}</span>
                                    <span className="text-xs text-slate-500">{category.items.length}</span>
                                </button>
                                {open ? (
                                    <ul className="space-y-2 pb-2 pl-1">
                                        {category.items.map((item) => (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => onPick(item)}
                                                    className={cn(
                                                        "flex w-full gap-2 rounded-lg border border-amber-200 bg-white p-2 text-left transition-colors hover:border-amber-400 hover:bg-amber-50"
                                                    )}
                                                >
                                                    <CatalogSymbolPreview
                                                        imageUrl={item.image_url}
                                                        cadUrl={item.cad_url}
                                                        fallbackColor={item.color}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-slate-900">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {item.identifier} · {partLabel(item.part_type)}
                                                        </p>
                                                        <p className="text-xs text-slate-600">
                                                            {item.voltage_v != null ? `${item.voltage_v} V` : null}
                                                            {item.amperage_a != null
                                                                ? ` · ${item.amperage_a} A`
                                                                : null}
                                                            {item.wire_gauge_mm2 != null
                                                                ? ` · ${item.wire_gauge_mm2} mm²`
                                                                : null}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatDimensions(
                                                                Number(item.width),
                                                                Number(item.depth),
                                                                Number(item.height)
                                                            )}
                                                        </p>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        );
                    })
                )}
            </div>
            <p className="border-t border-amber-200 p-2 text-xs text-amber-900/80">
                Click a part to place it on the wire plan.
            </p>
        </div>
    );
}
