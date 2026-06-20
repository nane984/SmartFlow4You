import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Field from "../ui/Field";
import { controlClass } from "../ui/inputStyles";
import type { Company } from "../../modules/companies/company.type";
import { getCompanies } from "../../modules/companies/company.api";
import {
    OBJECT_TYPE_LABELS,
    OBJECT_TYPES,
    WORK_CATEGORIES,
    WORK_CATEGORY_LABELS,
} from "../../modules/procurement/constants";
import axios from "axios";
import { createWorkPackage } from "../../modules/workPackages/workPackage.api";
import type { WorkPackage } from "../../modules/workPackages/workPackage.types";
import { formatApiErrors } from "../../util/formatApiErrors";

const EXCEL_ACCEPT =
    ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type WorkPackageFormProps = {
    tenderId: number;
    onCreated: (wp: WorkPackage) => void;
};

export default function WorkPackageForm({ tenderId, onCreated }: WorkPackageFormProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [workCategory, setWorkCategory] = useState("");
    const [objectType, setObjectType] = useState("");
    const [contractorIds, setContractorIds] = useState<number[]>([]);
    const [contractors, setContractors] = useState<Company[]>([]);
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void getCompanies().then((list) =>
            setContractors(list.filter((c) => c.company_type === "contractor"))
        );
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!name.trim()) {
            setError("Name is required.");
            return;
        }
        setSaving(true);
        try {
            const created = await createWorkPackage(
                {
                    tender: tenderId,
                    name: name.trim(),
                    description: description.trim(),
                    work_category: workCategory || undefined,
                    object_type: objectType || undefined,
                    contractor_ids: contractorIds.length ? contractorIds : undefined,
                },
                templateFile
            );
            onCreated(created);
            setName("");
            setDescription("");
            setWorkCategory("");
            setObjectType("");
            setContractorIds([]);
            setTemplateFile(null);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data) {
                setError(formatApiErrors(err.response.data));
            } else {
                setError("Could not create work package.");
            }
        } finally {
            setSaving(false);
        }
    };

    const toggleContractor = (id: number) => {
        setContractorIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    return (
        <form
            className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4"
            onSubmit={handleSubmit}
        >
            <p className="text-sm font-medium text-slate-800">Add work package</p>
            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                    <input
                        className={controlClass}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. SCADA Implementation"
                        required
                    />
                </Field>
                <Field label="Work category">
                    <select
                        className={controlClass}
                        value={workCategory}
                        onChange={(e) => setWorkCategory(e.target.value)}
                    >
                        <option value="">Select category…</option>
                        {WORK_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                                {WORK_CATEGORY_LABELS[c]}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Object type">
                    <select
                        className={controlClass}
                        value={objectType}
                        onChange={(e) => setObjectType(e.target.value)}
                    >
                        <option value="">Select object type…</option>
                        {OBJECT_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {OBJECT_TYPE_LABELS[t]}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Excel template" hint="Optional — subcontractors download and complete this file.">
                    <input
                        className={`${controlClass} cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm`}
                        type="file"
                        accept={EXCEL_ACCEPT}
                        onChange={(e) => setTemplateFile(e.target.files?.[0] ?? null)}
                    />
                    {templateFile && (
                        <p className="mt-1 text-xs text-slate-600">Selected: {templateFile.name}</p>
                    )}
                </Field>
            </div>
            {contractors.length > 0 && (
                <Field label="Assigned contractors" hint="Optional — multiple contractors per package.">
                    <div className="flex flex-wrap gap-2">
                        {contractors.map((c) => (
                            <label
                                key={c.id}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={contractorIds.includes(c.id)}
                                    onChange={() => toggleContractor(c.id)}
                                />
                                {c.name}
                            </label>
                        ))}
                    </div>
                </Field>
            )}
            <Field label="Description">
                <textarea
                    className={`${controlClass} min-h-[80px] resize-y`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Scope and requirements for this package"
                    rows={3}
                />
            </Field>
            <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Creating…" : "Create work package"}
            </Button>
        </form>
    );
}
