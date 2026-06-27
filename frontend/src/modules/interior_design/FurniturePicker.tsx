import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../components/ui/cn";
import CatalogSymbolPreview from "./CatalogSymbolPreview";
import type { CatalogFurnitureItem, FurnitureCategoryGroup } from "./types";
import { formatDimensions } from "./types";

type Props = {
    categories: FurnitureCategoryGroup[];
    onPick: (item: CatalogFurnitureItem) => void;
};

export default function FurniturePicker({ categories, onPick }: Props) {
    const [query, setQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(
        categories[0]?.id ?? null
    );

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
                        cat.name.toLowerCase().includes(q)
                ),
            }))
            .filter((cat) => cat.items.length > 0);
    }, [categories, query]);

    return (
        <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">Catalog</h3>
                    <Link
                        to="/interior/catalog"
                        className="text-xs font-medium text-brand-700 hover:underline"
                    >
                        Manage
                    </Link>
                </div>
                <input
                    type="search"
                    placeholder="Search furniture…"
                    className="mt-2 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                    <p className="p-2 text-sm text-slate-500">
                        No furniture found.{" "}
                        <Link to="/interior/catalog" className="text-brand-700 underline">
                            Add items
                        </Link>
                    </p>
                ) : (
                    filtered.map((category) => {
                        const open = expandedId === category.id || Boolean(query);
                        return (
                            <div key={category.id} className="mb-2">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                                    onClick={() =>
                                        setExpandedId(open && !query ? null : category.id)
                                    }
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
                                                        "flex w-full gap-2 rounded-lg border border-slate-200 p-2 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/50"
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
                                                        <p className="text-xs text-slate-500">{item.identifier}</p>
                                                        <p className="text-xs text-slate-600">
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
            <p className="border-t border-slate-200 p-2 text-xs text-slate-500">
                Click a product to place it on the floor plan.
            </p>
        </div>
    );
}
