import { getEffectiveRole, getStoredUser } from "../../auth/accessUtils";
import { roleLabel } from "../../auth/roles";
import { cn } from "../ui/cn";

function greetingName(): string {
    const user = getStoredUser();
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    if (user?.email) return user.email.split("@")[0] ?? "there";
    return "there";
}

export default function DashboardHero({
    description,
}: {
    description?: string;
}) {
    const role = getEffectiveRole();
    const user = getStoredUser();
    const company = user?.company_name;
    const defaultDescription =
        "Your SmartFlow workspace — manage tenders, HR, and operations from one place.";

    return (
        <section
            className={cn(
                "relative overflow-hidden rounded-2xl",
                "bg-gradient-to-br from-slate-900 via-brand-900 to-slate-800",
                "px-6 py-10 shadow-lg shadow-slate-900/10 sm:px-8 sm:py-12"
            )}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 15% 20%, rgba(20, 184, 166, 0.4) 0%, transparent 45%),
                        radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.3) 0%, transparent 40%)
                    `,
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative animate-[fadeIn_0.6s_ease-out]">
                <p className="text-sm font-medium text-teal-200/90">Welcome back</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Hello, {greetingName()}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    {description ?? defaultDescription}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                    {role ? (
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-teal-100 backdrop-blur-sm">
                            {roleLabel(role)}
                        </span>
                    ) : null}
                    {company ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                            {company}
                        </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        System online
                    </span>
                </div>
            </div>
        </section>
    );
}
