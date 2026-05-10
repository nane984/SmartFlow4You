import { useState } from "react";
import Button from "../ui/Button";
import Field from "../ui/Field";
import { controlClass } from "../ui/inputStyles";
import { createTenderItem } from "../../pages/tenders/tenderApi";
import type { TenderItem, TenderItemCreatePayload } from "../../pages/tenders/tenderTypes";

type ItemFormProps = {
    tenderId: number;
    onCreated: (item: TenderItem) => void;
};

export default function ItemForm({ tenderId, onCreated }: ItemFormProps) {
    const [form, setForm] = useState<TenderItemCreatePayload>({
        name: "",
        unit: "",
        quantity: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.name.trim()) {
            setError("Name is required.");
            return;
        }
        setSaving(true);
        try {
            const created = await createTenderItem(tenderId, form);
            onCreated(created);
            setForm({ name: "", unit: "", quantity: "" });
        } catch {
            setError("Could not add line item.");
        } finally {
            setSaving(false);
        }
    };

    const change =
        (field: keyof TenderItemCreatePayload) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
        };

    return (
        <form className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={handleSubmit}>
            <p className="text-sm font-medium text-slate-800">Add line item</p>
            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Name">
                    <input
                        className={controlClass}
                        value={form.name}
                        onChange={change("name")}
                        placeholder="Item description"
                        required
                    />
                </Field>
                <Field label="Quantity">
                    <input
                        className={controlClass}
                        type="text"
                        inputMode="decimal"
                        value={form.quantity}
                        onChange={change("quantity")}
                        placeholder="e.g. 100"
                        required
                    />
                </Field>
                <Field label="Unit">
                    <input
                        className={controlClass}
                        value={form.unit}
                        onChange={change("unit")}
                        placeholder="e.g. kg, m²"
                        required
                    />
                </Field>
            </div>
            <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Adding…" : "Add item"}
            </Button>
        </form>
    );
}
