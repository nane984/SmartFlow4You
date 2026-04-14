import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type AuthShellProps = {
    children: ReactNode;
    /** e.g. "Sign in" vs "Create account" */
    subtitle?: string;
};

export default function AuthShell({ children, subtitle }: AuthShellProps) {
    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900">
            <header className="border-b border-white/10 px-4 py-4 sm:px-8">
                <Link
                    to="/login"
                    className="text-lg font-semibold tracking-tight text-white no-underline hover:text-brand-100"
                >
                    SmartFlow
                </Link>
                {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
            </header>
            <div className="flex flex-1 items-center justify-center p-4 sm:p-8">{children}</div>
        </div>
    );
}
