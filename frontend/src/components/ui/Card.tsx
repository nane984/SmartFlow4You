import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm shadow-slate-900/5",
                className
            )}
            {...props}
        />
    );
}
