import { cn } from "./cn";
import {
    normalizeSubmissionStatus,
    SUBMISSION_STATUS_BADGE_CLASS,
    SUBMISSION_STATUS_LABELS,
} from "../../modules/workPackages/submissionStatus";

type SubmissionStatusBadgeProps = {
    status: string;
    className?: string;
};

export default function SubmissionStatusBadge({ status, className }: SubmissionStatusBadgeProps) {
    const normalized = normalizeSubmissionStatus(status);
    if (!normalized) {
        return (
            <span
                className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1",
                    "bg-slate-100 text-slate-700 ring-slate-200",
                    className
                )}
            >
                {status || "—"}
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1",
                SUBMISSION_STATUS_BADGE_CLASS[normalized],
                className
            )}
        >
            {SUBMISSION_STATUS_LABELS[normalized]}
        </span>
    );
}
