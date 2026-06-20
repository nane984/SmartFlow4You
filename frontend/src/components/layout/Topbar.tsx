import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthStorage } from "../../auth/authUtils";
import { clearMockSession, getEffectiveRole, getStoredUser } from "../../auth/accessUtils";
import { roleLabel } from "../../auth/roles";
import Button from "../ui/Button";
import { cn } from "../ui/cn";

type TopbarProps = {
    onMenuToggle?: () => void;
    className?: string;
};

/** Private app header — user context + logout only. */
export default function Topbar({ onMenuToggle, className }: TopbarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const role = useMemo(() => getEffectiveRole(), [location.pathname, location.key]);
    const user = useMemo(() => getStoredUser(), [location.pathname, location.key]);

    const logout = () => {
        clearAuthStorage();
        clearMockSession();
        navigate("/", { replace: true });
    };

    const displayName =
        user?.email ||
        user?.username ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        null;

    return (
        <header
            className={cn(
                "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6",
                className
            )}
        >
            <button
                type="button"
                className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Open sidebar"
                onClick={onMenuToggle}
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
            </button>

            <div className="ml-auto flex min-w-0 items-center gap-3">
                {displayName ? (
                    <span className="hidden max-w-[12rem] truncate text-sm text-slate-600 sm:inline">
                        {displayName}
                    </span>
                ) : null}
                {role ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {roleLabel(role)}
                    </span>
                ) : null}
                <Button type="button" variant="secondary" size="sm" onClick={logout}>
                    Log out
                </Button>
            </div>
        </header>
    );
}
