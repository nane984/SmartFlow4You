import { Link } from "react-router-dom";
import { APP_VERSION } from "./homeContent";
import { cn } from "../ui/cn";

export default function LandingFooter() {
    const year = new Date().getFullYear();

    return (
        <footer
            className={cn(
                "relative mt-20 border-t border-slate-200 bg-slate-900 text-slate-300",
                "left-1/2 right-1/2 -mx-[50vw] w-screen max-w-none"
            )}
        >
            <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <div>
                    <p className="text-lg font-semibold text-white">SmartFlow</p>
                    <p className="mt-1 text-sm text-slate-400">
                        AI-powered ERP for tenders, HR &amp; project management
                    </p>
                    <p className="mt-3 text-xs text-slate-500">Version {APP_VERSION}</p>
                </div>

                <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
                    <Link to="/login" className="text-slate-400 no-underline transition-colors hover:text-white">
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="text-slate-400 no-underline transition-colors hover:text-white"
                    >
                        Register
                    </Link>
                    <Link
                        to="/candidate/jobs"
                        className="text-slate-400 no-underline transition-colors hover:text-white"
                    >
                        Careers
                    </Link>
                </nav>
            </div>

            <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
                © {year} SmartFlow. All rights reserved.
            </div>
        </footer>
    );
}
