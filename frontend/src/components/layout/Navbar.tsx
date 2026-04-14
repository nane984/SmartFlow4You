import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuthStorage } from "../../auth/authUtils";
import Button from "../ui/Button";
import { cn } from "../ui/cn";

const navItems = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/hr", label: "HR" },
    { to: "/tenders", label: "Tenders" },
    { to: "/companies", label: "Companies" },
    { to: "/offers", label: "Offers" },
    { to: "/time-tracking", label: "Time" },
    { to: "/interior", label: "Interior" },
] as const;

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

    const logout = () => {
        clearAuthStorage();
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
                    {navItems.map((item) => (
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
