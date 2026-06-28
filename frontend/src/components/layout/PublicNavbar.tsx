import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LinkButton from "../ui/LinkButton";
import { cn } from "../ui/cn";
import Logo from "../ui/Logo";
import { isAppAuthenticated } from "../../auth/accessUtils";
import { PUBLIC_NAV_HEIGHT_CLASS } from "./layoutConstants";

const ANCHOR_LINKS = [
    { label: "About", href: "/#how-it-works" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
] as const;

const ROUTE_LINKS = [{ label: "Careers", to: "/candidate/jobs" }] as const;

const linkBase =
    "text-sm font-medium no-underline transition-colors";

export default function PublicNavbar() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const isHome = location.pathname === "/";
    const authed = isAppAuthenticated();

    const onDarkHero = isHome;

    return (
        <>
            <header
                className={cn(
                    "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-colors",
                    onDarkHero
                        ? "border-white/10 bg-slate-950/30"
                        : "border-slate-200/60 bg-white/80 shadow-sm shadow-slate-900/5"
                )}
            >
                <div className={cn("mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8", PUBLIC_NAV_HEIGHT_CLASS)}>
                    <Logo to="/" theme={onDarkHero ? "dark" : "light"} />

                    <nav
                        className="hidden flex-1 items-center justify-center gap-8 md:flex"
                        aria-label="Marketing"
                    >
                        {ANCHOR_LINKS.map(({ label, href }) => (
                            <a
                                key={label}
                                href={href}
                                className={cn(
                                    linkBase,
                                    onDarkHero
                                        ? "text-slate-200 hover:text-white"
                                        : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                {label}
                            </a>
                        ))}
                        {ROUTE_LINKS.map(({ label, to }) => (
                            <Link
                                key={label}
                                to={to}
                                className={cn(
                                    linkBase,
                                    onDarkHero
                                        ? "text-slate-200 hover:text-white"
                                        : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            className={cn(
                                "inline-flex rounded-lg p-2 md:hidden",
                                onDarkHero
                                    ? "text-white hover:bg-white/10"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                            aria-label="Open menu"
                            aria-expanded={mobileOpen}
                            onClick={() => setMobileOpen(true)}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                            </svg>
                        </button>

                        <div className="hidden items-center gap-2 sm:flex">
                            {authed ? (
                                <LinkButton
                                    to="/dashboard"
                                    variant={onDarkHero ? "secondary" : "primary"}
                                    size="sm"
                                    className={
                                        onDarkHero
                                            ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                                            : undefined
                                    }
                                >
                                    Dashboard
                                </LinkButton>
                            ) : (
                                <>
                                    <LinkButton
                                        to="/login"
                                        variant="ghost"
                                        size="sm"
                                        className={
                                            onDarkHero
                                                ? "font-semibold text-white hover:bg-white/15 hover:text-white"
                                                : "font-semibold text-brand-800 hover:bg-brand-50 hover:text-brand-900"
                                        }
                                    >
                                        Login
                                    </LinkButton>
                                    <LinkButton
                                        to="/register"
                                        variant={onDarkHero ? "secondary" : "primary"}
                                        size="sm"
                                        className={
                                            onDarkHero
                                                ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                                                : undefined
                                        }
                                    >
                                        Register
                                    </LinkButton>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {mobileOpen ? (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-50 bg-slate-900/50 md:hidden"
                        aria-label="Close menu"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="fixed inset-x-4 top-20 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:hidden">
                        <nav className="flex flex-col gap-1" aria-label="Marketing mobile">
                            {ANCHOR_LINKS.map(({ label, href }) => (
                                <a
                                    key={label}
                                    href={href}
                                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {label}
                                </a>
                            ))}
                            {ROUTE_LINKS.map(({ label, to }) => (
                                <Link
                                    key={label}
                                    to={to}
                                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {label}
                                </Link>
                            ))}
                        </nav>
                        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
                            {authed ? (
                                <LinkButton
                                    to="/dashboard"
                                    variant="primary"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Dashboard
                                </LinkButton>
                            ) : (
                                <>
                                    <LinkButton
                                        to="/login"
                                        variant="secondary"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Login
                                    </LinkButton>
                                    <LinkButton
                                        to="/register"
                                        variant="primary"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Register
                                    </LinkButton>
                                </>
                            )}
                        </div>
                    </div>
                </>
            ) : null}
        </>
    );
}
