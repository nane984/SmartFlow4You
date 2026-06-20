import type { ReactNode } from "react";
import { cn } from "../ui/cn";

export type FeatureCardProps = {
    title: string;
    description: string;
    icon: ReactNode;
    accent?: string;
    className?: string;
};

export default function FeatureCard({
    title,
    description,
    icon,
    accent = "from-brand-500/10 to-teal-500/5 ring-brand-200/50",
    className,
}: FeatureCardProps) {
    return (
        <article
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm",
                "transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5",
                "animate-[fadeIn_0.6s_ease-out_both]",
                className
            )}
        >
            <div
                className={cn(
                    "mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset",
                    "text-brand-700 transition-transform duration-300 group-hover:scale-105",
                    accent
                )}
            >
                {icon}
            </div>

            <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>

            <div className="mt-6 h-0.5 w-0 rounded-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-300 group-hover:w-full" />
        </article>
    );
}
