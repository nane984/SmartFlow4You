import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Button from "../ui/Button";
import { cn } from "../ui/cn";
import { isNavItemActive, type NavSection } from "./navigationConfig";
import type { AppRole } from "../../auth/roles";
import { ROLE_LABELS } from "../../auth/roles";

type NavMobileMenuProps = {
    open: boolean;
    onClose: () => void;
    role: AppRole | null;
    sections: NavSection[];
    authenticated: boolean;
    onLogout: () => void;
};

function MobileLink({
    item,
    onNavigate,
}: {
    item: NavSection["items"][number];
    onNavigate: () => void;
}) {
    const location = useLocation();
    const active = isNavItemActive(location.pathname, item);
    return (
        <NavLink
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium",
                active ? "bg-brand-50 text-brand-800" : "text-slate-700 hover:bg-slate-50"
            )}
        >
            {item.label}
        </NavLink>
    );
}

export default function NavMobileMenu({
    open,
    onClose,
    role,
    sections,
    authenticated,
    onLogout,
}: NavMobileMenuProps) {
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    if (!open) return null;

    return (
        <>
            <button
                type="button"
                className="fixed inset-0 z-40 bg-slate-900/40"
                aria-label="Close menu"
                onClick={onClose}
            />
            <aside
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col border-l border-slate-200 bg-white shadow-xl"
                aria-label="Mobile navigation"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Menu</p>
                        {role ? (
                            <p className="text-xs text-slate-500">{ROLE_LABELS[role]}</p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    {sections.map((section, idx) => (
                        <div key={section.id} className={cn(idx > 0 && "mt-6")}>
                            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                {section.label}
                            </p>
                            <div className="space-y-0.5">
                                {section.items.map((item) => (
                                    <MobileLink key={item.to} item={item} onNavigate={onClose} />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
                <div className="border-t border-slate-100 p-4">
                    {authenticated ? (
                        <Button type="button" variant="secondary" size="sm" className="w-full" onClick={onLogout}>
                            Log out
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Link
                                to="/login"
                                onClick={onClose}
                                className="block rounded-lg border border-slate-200 px-3 py-2.5 text-center text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/register"
                                onClick={onClose}
                                className="block rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-medium text-white no-underline hover:bg-brand-700"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
