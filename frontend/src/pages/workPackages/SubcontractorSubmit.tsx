import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Company } from "../../modules/companies/company.type";
import { getCompanies } from "../../modules/companies/company.api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";
import { createSubmission, getWorkPackages as fetchWorkPackages } from "../../modules/workPackages/workPackage.api";
import type { WorkPackage } from "../../modules/workPackages/workPackage.types";
import { parsePriceInput } from "../../util/parsePriceInput";
import { resolveMediaUrl } from "../../util/mediaUrl";
import { fileNameFromUrl } from "../../util/fileNameFromUrl";
import BidTypeGuide from "../../components/procurement/BidTypeGuide";

const EXCEL_ACCEPT =
    ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function isSubcontractor(c: Company): boolean {
    const t = (c.company_type ?? "").toLowerCase().trim();
    return t === "contractor" || t === "supplier";
}

function formatSubmitError(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const d = err.response?.data;
        if (typeof d === "string") return d;
        if (d && typeof d === "object") {
            const parts: string[] = [];
            for (const [k, v] of Object.entries(d)) {
                parts.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
            }
            if (parts.length) return parts.join(" ");
        }
    }
    return "Could not submit work package bid.";
}

export default function SubcontractorSubmit() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedWp = searchParams.get("work_package");
    const preselectedTender = searchParams.get("tender");

    const [companies, setCompanies] = useState<Company[]>([]);
    const [allPackages, setAllPackages] = useState<WorkPackage[]>([]);
    const [loading, setLoading] = useState(true);

    const [subcontractorId, setSubcontractorId] = useState<number | "">("");
    const [workPackageId, setWorkPackageId] = useState<number | "">(
        preselectedWp ? Number(preselectedWp) : ""
    );
    const [price, setPrice] = useState("");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const subcontractors = useMemo(() => companies.filter(isSubcontractor), [companies]);

    const selectedPackage = useMemo(
        () => allPackages.find((p) => p.id === workPackageId),
        [allPackages, workPackageId]
    );

    const packagesForSelect = useMemo(() => {
        if (!preselectedTender) return allPackages;
        const tid = Number(preselectedTender);
        if (!Number.isFinite(tid)) return allPackages;
        return allPackages.filter((p) => p.tender === tid);
    }, [allPackages, preselectedTender]);

    const packagesByTender = useMemo(() => {
        const map = new Map<number, WorkPackage[]>();
        for (const p of packagesForSelect) {
            const list = map.get(p.tender) ?? [];
            list.push(p);
            map.set(p.tender, list);
        }
        return map;
    }, [packagesForSelect]);

    const loadPackages = useCallback(async () => {
        setLoading(true);
        try {
            const list = await fetchWorkPackages();
            setAllPackages(list);
        } catch {
            setAllPackages([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void getCompanies().then(setCompanies);
        void loadPackages();
    }, [loadPackages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!subcontractorId) {
            setError("Select your company (contractor or supplier).");
            return;
        }
        if (!workPackageId) {
            setError("Select a work package.");
            return;
        }
        if (!uploadedFile) {
            setError("Upload your completed Excel file.");
            return;
        }
        const parsedPrice = parsePriceInput(price);
        if (price.trim() && parsedPrice === null) {
            setError("Enter a valid price (numbers only, e.g. 125000 or 125000.50).");
            return;
        }
        setSaving(true);
        try {
            await createSubmission(
                {
                    subcontractor: subcontractorId,
                    work_package: workPackageId,
                    price: parsedPrice ?? undefined,
                },
                uploadedFile
            );
            setSuccess("Work package bid submitted successfully.");
            setUploadedFile(null);
            setPrice("");
            window.setTimeout(() => {
                if (selectedPackage) {
                    navigate(`/tenders/${selectedPackage.tender}/work-packages/${workPackageId}`);
                } else {
                    navigate("/tenders");
                }
            }, 1800);
        } catch (err) {
            setError(formatSubmitError(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Submit work package bid"
                description="For contractors: select a work package, download the Excel template, upload your completed file, and optional total price."
                actions={
                    <>
                        <LinkButton to="/submissions" variant="secondary" size="sm">
                            All submissions
                        </LinkButton>
                        <LinkButton to="/work-packages" variant="secondary" size="sm">
                            Work packages
                        </LinkButton>
                        <LinkButton to="/tenders" variant="secondary" size="sm">
                            Tenders
                        </LinkButton>
                    </>
                }
            />

            <BidTypeGuide variant="work-package" className="mb-4 max-w-2xl" />

            <Card className="max-w-2xl">
                {success && (
                    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p className="text-sm text-slate-600">Loading work packages…</p>
                ) : packagesForSelect.length === 0 ? (
                    <p className="text-sm text-slate-600">
                        {preselectedTender
                            ? "No work packages for this tender yet. An admin must create packages on the tender first."
                            : "No work packages available yet. An admin must create work packages on a tender first."}
                    </p>
                ) : (
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <Field label="Your company">
                            <select
                                className={controlClass}
                                value={subcontractorId === "" ? "" : String(subcontractorId)}
                                onChange={(e) =>
                                    setSubcontractorId(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                required
                            >
                                <option value="">Select contractor or supplier…</option>
                                {subcontractors.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                        {c.company_type ? ` (${c.company_type})` : ""}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Work package">
                            <select
                                className={controlClass}
                                value={workPackageId === "" ? "" : String(workPackageId)}
                                onChange={(e) =>
                                    setWorkPackageId(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                required
                            >
                                <option value="">Select work package…</option>
                                {Array.from(packagesByTender.entries()).map(([tid, pkgs]) => (
                                    <optgroup key={tid} label={`Tender #${tid}`}>
                                        {pkgs.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </Field>

                        {selectedPackage?.template_file ? (
                            <div className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-3 text-sm">
                                <p className="font-medium text-slate-800">Excel template</p>
                                <p className="mt-1 text-slate-600">
                                    Download the template, complete it, then upload below.
                                </p>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() =>
                                        window.open(
                                            resolveMediaUrl(selectedPackage.template_file!),
                                            "_blank",
                                            "noopener"
                                        )
                                    }
                                >
                                    Download {fileNameFromUrl(selectedPackage.template_file)}
                                </Button>
                            </div>
                        ) : selectedPackage ? (
                            <p className="text-sm text-amber-800">
                                This work package has no template file yet. Contact the tender administrator.
                            </p>
                        ) : null}

                        <Field label="Completed Excel file" hint="Upload your filled-in template.">
                            <input
                                className={`${controlClass} cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm`}
                                type="file"
                                accept={EXCEL_ACCEPT}
                                onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
                                required
                            />
                            {uploadedFile && (
                                <p className="mt-2 text-sm text-slate-600">
                                    Selected: <span className="font-medium">{uploadedFile.name}</span>
                                </p>
                            )}
                        </Field>

                        <Field label="Price (optional)" hint="Numbers only; commas and currency symbols are stripped on submit.">
                            <input
                                className={controlClass}
                                type="number"
                                min={0}
                                step="0.01"
                                inputMode="decimal"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g. 125000"
                            />
                        </Field>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <Button type="submit" disabled={saving}>
                                {saving ? "Submitting…" : "Submit work package bid"}
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}
            </Card>
        </>
    );
}
