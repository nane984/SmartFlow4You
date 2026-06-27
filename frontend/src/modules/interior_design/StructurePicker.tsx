import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../components/ui/cn";
import CatalogSymbolPreview from "./CatalogSymbolPreview";
import type { CatalogStructureItem, StructureCategoryGroup } from "./types";
import { formatDimensions, STRUCTURE_PART_TYPES } from "./types";

type Props = {
    categories: StructureCategoryGroup[];
    onPick: (item: CatalogStructureItem) => void;
    selectedWallCatalogId?: number | null;
};

function partLabel(partType: string): string {
    return STRUCTURE_PART_TYPES.find((p) => p.value === partType)?.label ?? partType;
}

export default function StructurePicker({ categories, onPick, selectedWallCatalogId }: Props) {
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
        <div className="flex h-full flex-col rounded-xl border border-stone-300 bg-white">
            <div className="border-b border-stone-200 p-3">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-stone-900">Structure catalog</h3>
                    <Link
                        to="/interior/structure-catalog"
                        className="text-xs font-medium text-brand-700 hover:underline"
                    >
                        Manage
                    </Link>
                </div>
                <input
                    type="search"
                    placeholder="Search walls, windows, doors…"
                    className="mt-2 w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                    <p className="p-2 text-sm text-stone-500">
                        No items found.{" "}
                        <Link to="/interior/structure-catalog" className="text-brand-700 underline">
                            Add to catalog
                        </Link>
                    </p>
                ) : (
                    filtered.map((category) => {
                        const open = expandedId === category.id || Boolean(query);
                        return (
                            <div key={category.id} className="mb-2">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-medium text-stone-800 hover:bg-stone-50"
                                    onClick={() => setExpandedId(open && !query ? null : category.id)}
                                >
                                    <span>{category.name}</span>
                                    <span className="text-xs text-stone-500">{category.items.length}</span>
                                </button>
                                {open ? (
                                    <ul className="space-y-2 pb-2 pl-1">
                                        {category.items.map((item) => {
                                            const isWallSelected =
                                                item.part_type === "wall" &&
                                                selectedWallCatalogId === item.id;
                                            return (
                                                <li key={item.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => onPick(item)}
                                                        className={cn(
                                                            "flex w-full gap-2 rounded-lg border p-2 text-left transition-colors",
                                                            isWallSelected
                                                                ? "border-brand-500 bg-brand-50"
                                                                : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                                                        )}
                                                    >
                                                        <CatalogSymbolPreview
                                                            imageUrl={item.image_url}
                                                            cadUrl={item.cad_url}
                                                            fallbackColor={item.color}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium text-stone-900">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-xs text-stone-500">
                                                                {item.identifier} · {partLabel(item.part_type)}
                                                            </p>
                                                            {item.part_type !== "wall" ? (
                                                                <p className="text-xs text-stone-600">
                                                                    {formatDimensions(
                                                                        Number(item.width),
                                                                        Number(item.depth),
                                                                        Number(item.height)
                                                                    )}
                                                                </p>
                                                            ) : (
                                                                <p className="text-xs text-stone-600">
                                                                    Thickness {Number(item.depth).toFixed(2)} m
                                                                </p>
                                                            )}
                                                        </div>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : null}
                            </div>
                        );
                    })
                )}
            </div>
            <p className="border-t border-stone-200 p-2 text-xs text-stone-500">
                Walls: pick then click two points on plan. Windows & doors: click to place, drag to move.
            </p>
        </div>
    );
}
