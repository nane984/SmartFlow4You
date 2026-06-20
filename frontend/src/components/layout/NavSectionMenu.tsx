import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../ui/cn";
import { isNavItemActive, isSectionActive, type NavSection } from "./navigationConfig";

type NavSectionMenuProps = {
    section: NavSection;
};

function linkClass(isActive: boolean) {
    return cn(
        "block rounded-md px-3 py-2 text-sm transition-colors",
        isActive
            ? "bg-brand-50 font-medium text-brand-800"
            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
    );
}

export default function NavSectionMenu({ section }: NavSectionMenuProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const location = useLocation();
    const sectionActive = isSectionActive(location.pathname, section);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    return (
        <div ref={rootRef} className="relative shrink-0">
            <button
                type="button"
                className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    sectionActive || open
                        ? "bg-brand-50 text-brand-800 ring-1 ring-brand-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                aria-expanded={open}
                aria-haspopup="true"
                aria-controls={menuId}
                onClick={() => setOpen((v) => !v)}
            >
                {section.label}
                <svg
                    className={cn("h-4 w-4 opacity-60 transition-transform", open && "rotate-180")}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {open && (
                <div
                    id={menuId}
                    role="menu"
                    className="absolute left-0 top-full z-50 mt-1 min-w-[12rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10"
                >
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {section.label}
                    </p>
                    {section.items.map((item) => {
                        const active = isNavItemActive(location.pathname, item);
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                role="menuitem"
                                className={linkClass(active)}
                                onClick={() => setOpen(false)}
                            >
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
