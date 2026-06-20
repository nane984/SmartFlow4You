import { useState } from "react";
import Button from "../ui/Button";
import { controlClass } from "../ui/inputStyles";
import { hrActionsForStatus, type HrStatusAction } from "../../modules/hr/applicationStatus";

type Props = {
    applicationId: number;
    currentStatus: string;
    disabled?: boolean;
    onApply: (applicationId: number, action: HrStatusAction) => Promise<void>;
};

export default function ApplicationStatusSelector({
    applicationId,
    currentStatus,
    disabled = false,
    onApply,
}: Props) {
    const options = hrActionsForStatus(currentStatus);
    const [selected, setSelected] = useState("");
    const [applying, setApplying] = useState(false);

    if (options.length === 0) {
        return <span className="text-xs text-slate-500">Final</span>;
    }

    const handleApply = async () => {
        if (!selected) return;
        setApplying(true);
        try {
            await onApply(applicationId, selected as HrStatusAction);
            setSelected("");
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="flex min-w-[220px] items-center gap-2">
            <select
                className={`${controlClass} flex-1 py-1.5 text-xs`}
                value={selected}
                disabled={disabled || applying}
                onChange={(e) => setSelected(e.target.value)}
            >
                <option value="">Choose action…</option>
                {options.map((opt) => (
                    <option key={opt.action} value={opt.action}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!selected || disabled || applying}
                onClick={() => void handleApply()}
            >
                {applying ? "…" : "Apply"}
            </Button>
        </div>
    );
}
