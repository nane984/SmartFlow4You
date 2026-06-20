export type ApplicationStatus =
    | "submitted"
    | "reviewed"
    | "interview"
    | "accepted"
    | "rejected";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    submitted: "Application received",
    reviewed: "CV reviewed",
    interview: "Interview stage",
    accepted: "Selected for position",
    rejected: "Not selected",
};

export const APPLICATION_STATUS_CANDIDATE_HINTS: Record<ApplicationStatus, string> = {
    submitted: "Your application was received. HR will review your CV soon.",
    reviewed: "HR has reviewed your CV and will decide on the next step.",
    interview: "You moved to the interview stage. HR may contact you with details.",
    accepted: "Congratulations — you were selected for this position.",
    rejected: "Thank you for applying. HR selected another candidate for this role.",
};

export function applicationStatusLabel(status: string): string {
    return APPLICATION_STATUS_LABELS[status as ApplicationStatus] ?? status.replace(/_/g, " ");
}

export function applicationStatusBadgeClass(status: string): string {
    switch (status) {
        case "submitted":
            return "rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800";
        case "reviewed":
            return "rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800";
        case "interview":
            return "rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800";
        case "accepted":
            return "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800";
        case "rejected":
            return "rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-800";
        default:
            return "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";
    }
}

export type HrStatusAction = "mark_reviewed" | "move_next" | "reject";

export function hrActionsForStatus(status: string): { action: HrStatusAction; label: string; variant: "primary" | "secondary" | "danger" }[] {
    switch (status) {
        case "submitted":
            return [
                { action: "mark_reviewed", label: "Mark reviewed", variant: "secondary" },
                { action: "move_next", label: "Move to interview", variant: "primary" },
                { action: "reject", label: "Not selected", variant: "danger" },
            ];
        case "reviewed":
            return [
                { action: "move_next", label: "Move to interview", variant: "primary" },
                { action: "reject", label: "Not selected", variant: "danger" },
            ];
        case "interview":
            return [
                { action: "move_next", label: "Select candidate", variant: "primary" },
                { action: "reject", label: "Not selected", variant: "danger" },
            ];
        default:
            return [];
    }
}
