import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthStorage } from "../../auth/authUtils";
import { clearMockSession, getEffectiveRole, isAppAuthenticated } from "../../auth/accessUtils";
import { ROLE_LABELS } from "../../auth/roles";
import Button from "../ui/Button";
import { cn } from "../ui/cn";
import { getNavSectionsForRole } from "./navigationConfig";
import NavMobileMenu from "./NavMobileMenu";
import NavSectionMenu from "./NavSectionMenu";

const authLinkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-slate-900";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const role = useMemo(() => getEffectiveRole(), [location.pathname, location.key]);
    const authenticated = useMemo(() => isAppAuthenticated(), [location.pathname, location.key, role]);
    const sections = useMemo(() => getNavSectionsForRole(role), [role]);

    const logout = () => {
        clearAuthStorage();
        clearMockSession();
        setMobileOpen(false);
        navigate("/", { replace: true });
    };

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="shrink-0 text-lg font-semibold tracking-tight text-brand-900 no-underline"
                >
                    SmartFlow
                </Link>

                <nav
                    className="hidden min-w-0 flex-1 items-center gap-1 md:flex"
                    aria-label="Main"
                >
                    {sections.map((section) => (
                        <NavSectionMenu key={section.id} section={section} />
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    {role ? (
                        <span
                            className={cn(
                                "hidden rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 sm:inline"
                            )}
                        >
                            {ROLE_LABELS[role]}
                        </span>
                    ) : null}

                    <button
                        type="button"
                        className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                        aria-label="Open menu"
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen(true)}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                    </button>

                    {authenticated ? (
                        <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={logout}>
                            Log out
                        </Button>
                    ) : (
                        <>
                            <Link to="/login" className={cn(authLinkClass, "hidden sm:inline-flex")}>
                                Sign in
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white no-underline shadow-sm transition-colors hover:bg-brand-700"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <NavMobileMenu
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                role={role}
                sections={sections}
                authenticated={authenticated}
                onLogout={logout}
            />
        </header>
    );
}
