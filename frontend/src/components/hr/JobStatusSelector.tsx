import { useState } from "react";
import { controlClass } from "../ui/inputStyles";

export type JobPostingStatus = "published" | "closed" | "draft";

export const JOB_STATUS_OPTIONS: { value: JobPostingStatus; label: string }[] = [
    { value: "published", label: "Active" },
    { value: "closed", label: "Inactive" },
    { value: "draft", label: "Draft" },
];

export function jobPostingStatusLabel(status: string | undefined): string {
    return JOB_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status ?? "—";
}

export function jobPostingStatusBadgeClass(status: string | undefined): string {
    switch (status) {
        case "published":
            return "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800";
        case "closed":
            return "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";
        case "draft":
            return "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800";
        default:
            return "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";
    }
}

type Props = {
    jobId: number;
    status: string;
    disabled?: boolean;
    onChange: (jobId: number, status: JobPostingStatus) => Promise<void>;
};

export default function JobStatusSelector({ jobId, status, disabled = false, onChange }: Props) {
    const [busy, setBusy] = useState(false);
    const [value, setValue] = useState(status);

    const handleChange = async (next: string) => {
        setValue(next);
        setBusy(true);
        try {
            await onChange(jobId, next as JobPostingStatus);
        } catch {
            setValue(status);
        } finally {
            setBusy(false);
        }
    };

    return (
        <select
            className={`${controlClass} min-w-[120px] py-1.5 text-xs`}
            value={value}
            disabled={disabled || busy}
            onChange={(e) => void handleChange(e.target.value)}
        >
            {JOB_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
