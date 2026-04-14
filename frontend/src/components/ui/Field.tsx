import type { ReactNode } from "react";
import { cn } from "./cn";

type FieldProps = {
    label: string;
    children: ReactNode;
    hint?: string;
    error?: string;
    className?: string;
};

export default function Field({ label, children, hint, error, className }: FieldProps) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <span className="block text-sm font-medium text-slate-700">{label}</span>
            {children}
            {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
            {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>
    );
}
