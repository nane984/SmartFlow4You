import { Link } from "react-router-dom";
import LinkButton from "../ui/LinkButton";
import Logo, { LogoMark } from "../ui/Logo";
import { cn } from "../ui/cn";
import { isAppAuthenticated } from "../../auth/accessUtils";

type HeroSectionProps = {
    onExploreDemo?: () => void;
};

export default function HeroSection({ onExploreDemo }: HeroSectionProps) {
    const authed = isAppAuthenticated();

    return (
        <section
            className={cn(
                "relative overflow-hidden",
                "left-1/2 right-1/2 -mx-[50vw] w-screen max-w-none"
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-brand-900 to-slate-800" />
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 20% 20%, rgba(20, 184, 166, 0.35) 0%, transparent 45%),
                        radial-gradient(circle at 80% 10%, rgba(56, 189, 248, 0.25) 0%, transparent 40%),
                        radial-gradient(circle at 60% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 45%)
                    `,
                }}
            />
            <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                }}
            />

            <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8 lg:pb-32 lg:pt-36">
                <div className="mx-auto max-w-3xl text-center animate-[fadeIn_0.7s_ease-out]">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-200 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        AI-powered enterprise platform
                    </p>

                    <div className="mx-auto flex flex-col items-center">
                        <LogoMark className="mx-auto h-16 w-16 drop-shadow-lg" />
                        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                            Smart
                            <span className="text-teal-300">Flow</span>
                        </h1>
                    </div>

                    <p className="mt-5 text-lg leading-relaxed text-slate-200 sm:text-xl">
                        AI-powered ERP system for tenders, HR and project management
                    </p>

                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                        Streamline procurement, recruitment, and operations in one modern workspace —
                        built for teams who need clarity, speed, and intelligent automation.
                    </p>

                    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={onExploreDemo}
                            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-base font-semibold text-brand-900 shadow-lg shadow-black/20 transition-colors hover:bg-brand-50"
                        >
                            Explore demo
                        </button>
                        {authed ? (
                            <LinkButton
                                to="/dashboard"
                                variant="secondary"
                                size="lg"
                                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
                            >
                                Go to dashboard
                            </LinkButton>
                        ) : (
                            <LinkButton
                                to="/register"
                                variant="secondary"
                                size="lg"
                                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
                            >
                                Get started free
                            </LinkButton>
                        )}
                    </div>

                    {!authed ? (
                        <p className="mt-6 text-xs text-slate-400">
                            Already have an account?{" "}
                            <Link to="/login" className="font-medium text-teal-300 hover:text-teal-200">
                                Sign in
                            </Link>
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-100 to-transparent" />
        </section>
    );
}
