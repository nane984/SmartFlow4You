import { useCallback, useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";
import { cn } from "../../components/ui/cn";
import { formatApiErrors } from "../../util/formatApiErrors";
import {
    createStructureCategory,
    createStructureItem,
    deleteStructureCategory,
    deleteStructureItem,
    listStructureCategories,
    listStructureItems,
    updateStructureCategory,
    updateStructureItem,
} from "./structure.api";
import type { CatalogStructureItem, FurnitureCategoryRecord, StructurePartType } from "./types";
import { formatDimensions, STRUCTURE_PART_TYPES } from "./types";

const emptyItemForm = {
    identifier: "",
    name: "",
    description: "",
    part_type: "wall" as StructurePartType,
    width: "1.20",
    depth: "0.12",
    height: "2.70",
    elevation: "0",
    color: "#78716c",
    is_active: true,
};

export default function StructureCatalogPage() {
    const [categories, setCategories] = useState<FurnitureCategoryRecord[]>([]);
    const [items, setItems] = useState<CatalogStructureItem[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [editCategoryName, setEditCategoryName] = useState("");

    const [showItemForm, setShowItemForm] = useState(false);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [itemForm, setItemForm] = useState(emptyItemForm);
    const [itemImage, setItemImage] = useState<File | null>(null);
    const [itemCad, setItemCad] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const loadCategories = useCallback(async () => {
        const data = await listStructureCategories();
        setCategories(data);
        setSelectedCategoryId((prev) => prev ?? data[0]?.id ?? null);
        return data;
    }, []);

    const loadItems = useCallback(async (categoryId: number | null) => {
        if (!categoryId) {
            setItems([]);
            return;
        }
        setItems(await listStructureItems(categoryId));
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const cats = await loadCategories();
            const catId = cats[0]?.id ?? null;
            if (catId) await loadItems(catId);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load catalog.");
        } finally {
            setLoading(false);
        }
    }, [loadCategories, loadItems]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (selectedCategoryId) void loadItems(selectedCategoryId);
    }, [selectedCategoryId, loadItems]);

    const resetItemForm = () => {
        setItemForm(emptyItemForm);
        setItemImage(null);
        setItemCad(null);
        setEditingItemId(null);
        setShowItemForm(false);
    };

    const startEditItem = (item: CatalogStructureItem) => {
        setEditingItemId(item.id);
        setShowItemForm(true);
        setItemForm({
            identifier: item.identifier,
            name: item.name,
            description: item.description || "",
            part_type: item.part_type,
            width: String(item.width),
            depth: String(item.depth),
            height: String(item.height),
            elevation: String(item.elevation ?? 0),
            color: item.color,
            is_active: item.is_active,
        });
        setItemImage(null);
        setItemCad(null);
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        setSaving(true);
        setMessage(null);
        try {
            const created = await createStructureCategory({
                name: newCategoryName.trim(),
                sort_order: categories.length + 1,
            });
            setNewCategoryName("");
            await loadCategories();
            setSelectedCategoryId(created.id);
            setMessage(`Category "${created.name}" created.`);
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(ax.response?.data ? formatApiErrors(ax.response.data) : "Could not create category.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCategory = async (id: number) => {
        if (!editCategoryName.trim()) return;
        setSaving(true);
        try {
            await updateStructureCategory(id, { name: editCategoryName.trim() });
            setEditingCategoryId(null);
            await loadCategories();
            setMessage("Category updated.");
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(ax.response?.data ? formatApiErrors(ax.response.data) : "Could not update category.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm("Delete this category and all its structure items?")) return;
        try {
            await deleteStructureCategory(id);
            if (selectedCategoryId === id) setSelectedCategoryId(null);
            await load();
            setMessage("Category deleted.");
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(ax.response?.data ? formatApiErrors(ax.response.data) : "Could not delete category.");
        }
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryId) return;
        if (!itemForm.identifier.trim() || !itemForm.name.trim()) return;

        setSaving(true);
        setMessage(null);
        try {
            const payload = {
                category: selectedCategoryId,
                identifier: itemForm.identifier.trim().toUpperCase(),
                name: itemForm.name.trim(),
                description: itemForm.description.trim(),
                part_type: itemForm.part_type,
                width: Number(itemForm.width),
                depth: Number(itemForm.depth),
                height: Number(itemForm.height),
                elevation: Number(itemForm.elevation),
                color: itemForm.color,
                is_active: itemForm.is_active,
                image: itemImage,
                cad_file: itemCad,
            };

            if (editingItemId) {
                await updateStructureItem(editingItemId, payload);
                setMessage("Structure item updated.");
            } else {
                await createStructureItem(payload);
                setMessage("Structure item added.");
            }
            resetItemForm();
            await loadItems(selectedCategoryId);
            await loadCategories();
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(ax.response?.data ? formatApiErrors(ax.response.data) : "Could not save item.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!window.confirm("Delete this structure item?")) return;
        try {
            await deleteStructureItem(id);
            if (selectedCategoryId) await loadItems(selectedCategoryId);
            await loadCategories();
            setMessage("Item deleted.");
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(ax.response?.data ? formatApiErrors(ax.response.data) : "Could not delete item.");
        }
    };

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Structure catalog"
                description="Manage walls, windows, and doors — dimensions, default colors, and plan symbols."
                actions={
                    <LinkButton to="/interior" variant="secondary" size="sm">
                        ← Projects
                    </LinkButton>
                }
            />

            {message ? (
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-900">
                    {message}
                </div>
            ) : null}
            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <Card>
                    <p className="text-sm text-slate-600">Loading catalog…</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                    <Card className="space-y-3">
                        <h2 className="text-sm font-semibold text-slate-900">Categories</h2>
                        <ul className="space-y-1">
                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    {editingCategoryId === cat.id ? (
                                        <div className="flex gap-1">
                                            <input
                                                className={`${controlClass} text-sm`}
                                                value={editCategoryName}
                                                onChange={(e) => setEditCategoryName(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={saving}
                                                onClick={() => void handleSaveCategory(cat.id)}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCategoryId(cat.id)}
                                                className={cn(
                                                    "flex-1 rounded-lg px-2 py-2 text-left text-sm",
                                                    selectedCategoryId === cat.id
                                                        ? "bg-amber-100 font-medium text-amber-950"
                                                        : "hover:bg-slate-50 text-slate-800"
                                                )}
                                            >
                                                {cat.name}
                                                <span className="ml-1 text-xs text-slate-500">
                                                    ({cat.item_count ?? 0})
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded px-1 text-xs text-slate-500 hover:text-slate-800"
                                                onClick={() => {
                                                    setEditingCategoryId(cat.id);
                                                    setEditCategoryName(cat.name);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded px-1 text-xs text-rose-600 hover:text-rose-800"
                                                onClick={() => void handleDeleteCategory(cat.id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <form className="space-y-2 border-t border-slate-200 pt-3" onSubmit={(e) => void handleCreateCategory(e)}>
                            <input
                                className={controlClass}
                                placeholder="New category name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                            <Button type="submit" size="sm" disabled={saving || !newCategoryName.trim()}>
                                Add category
                            </Button>
                        </form>
                    </Card>

                    <div className="space-y-4">
                        <Card className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {selectedCategory?.name ?? "Select a category"}
                                </h2>
                                <p className="text-sm text-slate-600">
                                    {items.length} product{items.length === 1 ? "" : "s"}
                                </p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                disabled={!selectedCategoryId}
                                onClick={() => {
                                    resetItemForm();
                                    setShowItemForm(true);
                                }}
                            >
                                + Add part
                            </Button>
                        </Card>

                        {showItemForm && selectedCategoryId ? (
                            <Card>
                                <form className="space-y-4" onSubmit={(e) => void handleSaveItem(e)}>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        {editingItemId ? "Edit structure item" : "New structure item"}
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Part ID" hint="e.g. WALL-001">
                                            <input
                                                className={controlClass}
                                                value={itemForm.identifier}
                                                onChange={(e) =>
                                                    setItemForm((f) => ({ ...f, identifier: e.target.value }))
                                                }
                                                required
                                            />
                                        </Field>
                                        <Field label="Name">
                                            <input
                                                className={controlClass}
                                                value={itemForm.name}
                                                onChange={(e) =>
                                                    setItemForm((f) => ({ ...f, name: e.target.value }))
                                                }
                                                required
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Type">
                                        <select
                                            className={controlClass}
                                            value={itemForm.part_type}
                                            onChange={(e) =>
                                                setItemForm((f) => ({
                                                    ...f,
                                                    part_type: e.target.value as StructurePartType,
                                                }))
                                            }
                                        >
                                            {STRUCTURE_PART_TYPES.map((p) => (
                                                <option key={p.value} value={p.value}>
                                                    {p.label}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Description">
                                        <textarea
                                            className={`${controlClass} min-h-[60px]`}
                                            value={itemForm.description}
                                            onChange={(e) =>
                                                setItemForm((f) => ({ ...f, description: e.target.value }))
                                            }
                                        />
                                    </Field>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <Field label="Width (m)" hint="Opening width; 0 for walls">
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                className={controlClass}
                                                value={itemForm.width}
                                                onChange={(e) =>
                                                    setItemForm((f) => ({ ...f, width: e.target.value }))
                                                }
                                            />
                                        </Field>
                                        <Field label="Thickness (m)">
                                            <input
                                                type="number"
                                                min={0.04}
                                                step={0.01}
                                                className={controlClass}
                                                value={itemForm.depth}
                                                onChange={(e) =>
                                                    setItemForm((f) => ({ ...f, depth: e.target.value }))
                                                }
                                                required
                                            />
                                        </Field>
                                        <Field label="Height (m)">
                                            <input
                                                type="number"
                                                min={0.1}
                                                step={0.05}
                                                className={controlClass}
                                                value={itemForm.height}
                                                onChange={(e) =>
                                                    setItemForm((f) => ({ ...f, height: e.target.value }))
                                                }
                                            />
                                        </Field>
                                        <Field label="Sill height (m)" hint="Windows only">
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.05}
                                                className={controlClass}
                                                value={itemForm.elevation}
                                                onChange={(e) =>
                                                    setItemForm((f) => ({ ...f, elevation: e.target.value }))
                                                }
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Default color">
                                        <input
                                            type="color"
                                            value={itemForm.color}
                                            onChange={(e) =>
                                                setItemForm((f) => ({ ...f, color: e.target.value }))
                                            }
                                            className="h-10 w-16 cursor-pointer rounded border border-slate-300"
                                        />
                                    </Field>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Symbol photo" hint="PNG, JPG, SVG">
                                            <input
                                                type="file"
                                                accept=".png,.jpg,.jpeg,.webp,.svg,image/*"
                                                onChange={(e) => setItemImage(e.target.files?.[0] ?? null)}
                                            />
                                        </Field>
                                        <Field label="CAD file" hint="DWG, DXF, PDF, SVG">
                                            <input
                                                type="file"
                                                accept=".dwg,.dxf,.pdf,.svg"
                                                onChange={(e) => setItemCad(e.target.files?.[0] ?? null)}
                                            />
                                        </Field>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={itemForm.is_active}
                                            onChange={(e) =>
                                                setItemForm((f) => ({ ...f, is_active: e.target.checked }))
                                            }
                                        />
                                        Active in catalog
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="submit" disabled={saving}>
                                            {saving ? "Saving…" : editingItemId ? "Update item" : "Add item"}
                                        </Button>
                                        <Button type="button" variant="secondary" onClick={resetItemForm}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        ) : null}

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {items.map((item) => (
                                <Card key={item.id} className="flex flex-col gap-3">
                                    <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt=""
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <div
                                                className="h-16 w-24 rounded-lg shadow-inner"
                                                style={{ backgroundColor: item.color }}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                            {item.identifier}
                                        </p>
                                        <h3 className="font-semibold text-slate-900">{item.name}</h3>
                                        <p className="text-xs text-stone-700">
                                            {STRUCTURE_PART_TYPES.find((p) => p.value === item.part_type)?.label}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {formatDimensions(
                                                Number(item.width),
                                                Number(item.depth),
                                                Number(item.height)
                                            )}
                                            {item.part_type === "window" && item.elevation != null
                                                ? ` · sill ${Number(item.elevation).toFixed(2)} m`
                                                : ""}
                                        </p>
                                        {!item.is_active ? (
                                            <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                                                Inactive
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-auto flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => startEditItem(item)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => void handleDeleteItem(item.id)}
                                        >
                                            Delete
                                        </Button>
                                        {item.cad_url ? (
                                            <a
                                                href={item.cad_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-brand-700 underline"
                                            >
                                                CAD
                                            </a>
                                        ) : null}
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {selectedCategoryId && items.length === 0 && !showItemForm ? (
                            <Card>
                                <p className="text-sm text-slate-600">
                                    No parts in this category yet. Click &quot;Add part&quot; to create your first
                                    plan symbol (PNG, PDF, SVG).
                                </p>
                            </Card>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
