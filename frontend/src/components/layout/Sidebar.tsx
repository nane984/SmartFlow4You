import { NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { getEffectiveRole } from "../../auth/accessUtils";
import { cn } from "../ui/cn";
import { getNavSectionsForRole, isNavItemActive } from "./navigationConfig";
import Logo from "../ui/Logo";

type SidebarProps = {
    className?: string;
    onNavigate?: () => void;
};

function SidebarLink({
    to,
    label,
    end,
    onNavigate,
}: {
    to: string;
    label: string;
    end?: boolean;
    onNavigate?: () => void;
}) {
    const location = useLocation();
    const active = isNavItemActive(location.pathname, { to, label, end, roles: [] });

    return (
        <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                    ? "bg-brand-50 text-brand-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
        >
            {label}
        </NavLink>
    );
}

export default function Sidebar({ className, onNavigate }: SidebarProps) {
    const location = useLocation();
    const role = useMemo(() => getEffectiveRole(), [location.pathname, location.key]);
    const sections = useMemo(() => getNavSectionsForRole(role), [role]);

    return (
        <aside
            className={cn(
                "flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white",
                className
            )}
            aria-label="Application navigation"
        >
            <div className="flex h-14 items-center border-b border-slate-100 px-4">
                <Logo to="/dashboard" size="sm" />
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                {sections.map((section, idx) => (
                    <div key={section.id} className={cn(idx > 0 && "mt-6")}>
                        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {section.label}
                        </p>
                        <div className="space-y-0.5">
                            {section.items.map((item) => (
                                <SidebarLink
                                    key={`${section.id}-${item.to}-${item.label}`}
                                    to={item.to}
                                    label={item.label}
                                    end={item.end}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
