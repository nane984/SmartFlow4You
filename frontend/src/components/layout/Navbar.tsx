import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuthStorage, getUserRole} from "../../auth/authUtils";
import type { AppRole } from "../../auth/roles"
import Button from "../ui/Button";
import { cn } from "../ui/cn";

const navItems = [
    { to: "/", label: "Dashboard", end: true, roles: ["admin", "hr", "candidate", "interviewer"] as AppRole[] },
    { to: "/hr-dashboard", label: "HR Dashboard", roles: ["admin", "hr"] as AppRole[] },
    { to: "/hr/jobs", label: "Job Management", roles: ["admin", "hr"] as AppRole[] },
    { to: "/candidate-dashboard", label: "Candidate Dashboard", roles: ["admin", "candidate"] as AppRole[] },
    { to: "/interviewer-dashboard", label: "Interviewer Dashboard", roles: ["admin", "interviewer"] as AppRole[] },
    { to: "/admin-dashboard", label: "Admin Dashboard", roles: ["admin"] as AppRole[] },
    { to: "/tenders", label: "Tenders", roles: ["admin", "candidate"] as AppRole[] },
    { to: "/companies", label: "Companies", roles: ["admin", "candidate"] as AppRole[] },
    { to: "/offers", label: "Offers", roles: ["admin", "candidate"] as AppRole[] },
    { to: "/time-tracking", label: "Time", roles: ["admin"] as AppRole[] },
    { to: "/interior", label: "Interior", roles: ["admin"] as AppRole[] },
] as const;

function parseRoleFromUserObject(): AppRole | null {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as { role?: unknown };
        const value = typeof parsed.role === "string" ? parsed.role.toLowerCase() : "";
        if (value === "admin" || value === "hr" || value === "candidate" || value === "interviewer") {
            return value;
        }
    } catch {
        return null;
    }
    return null;
}

function resolveRole(): AppRole | null {
    return getUserRole() ?? parseRoleFromUserObject();
}

function navClass({ isActive }: { isActive: boolean }) {
    return cn(
        "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
            ? "bg-brand-50 text-brand-800 ring-1 ring-brand-100"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    );
}

export default function Navbar() {
    const navigate = useNavigate();
    const [role, setRole] = useState<AppRole | null>(() => resolveRole());

    useEffect(() => {
        const refreshRole = () => setRole(resolveRole());
        refreshRole();
        window.addEventListener("storage", refreshRole);
        window.addEventListener("focus", refreshRole);
        return () => {
            window.removeEventListener("storage", refreshRole);
            window.removeEventListener("focus", refreshRole);
        };
    }, []);

    const filteredNavItems = useMemo(() => {
        if (!role) return navItems.filter((item) => item.to === "/");
        return navItems.filter((item) => item.roles.includes(role));
    }, [role]);

    const logout = () => {
        clearAuthStorage();
        setRole(null);
        navigate("/login", { replace: true });
    };

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="shrink-0 text-lg font-semibold tracking-tight text-brand-900 no-underline"
                >
                    SmartFlow
                </Link>

                <nav
                    className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    aria-label="Main"
                >
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={"end" in item ? Boolean(item.end) : false}
                            className={navClass}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={logout}>
                    Log out
                </Button>
            </div>
        </header>
    );
}
