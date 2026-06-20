import { Link } from "react-router-dom";
import { cn } from "../ui/cn";

export type DashboardModuleCardProps = {
    to: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    accent?: string;
    className?: string;
};

export default function DashboardModuleCard({
    to,
    title,
    description,
    icon,
    accent = "from-brand-500/10 to-teal-500/5 ring-brand-200/50",
    className,
}: DashboardModuleCardProps) {
    return (
        <Link
            to={to}
            className={cn(
                "group block no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2",
                className
            )}
        >
            <article
                className={cn(
                    "relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm",
                    "transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5",
                    "animate-[fadeIn_0.6s_ease-out_both]"
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

                <h3 className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-brand-800">
                    {title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>

                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                    Open module
                    <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                    >
                        <path
                            fillRule="evenodd"
                            d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>

                <div className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-300 group-hover:w-full" />
            </article>
        </Link>
    );
}
