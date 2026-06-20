import { useState } from "react";
import { Outlet } from "react-router-dom";
import PageContainer from "./PageContainer";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { cn } from "../ui/cn";

/** Authenticated app shell — sidebar navigation + minimal topbar. */
export default function Layout() {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar className="hidden lg:flex" />

            {mobileNavOpen ? (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
                        aria-label="Close sidebar"
                        onClick={() => setMobileNavOpen(false)}
                    />
                    <Sidebar
                        className={cn(
                            "fixed inset-y-0 left-0 z-50 shadow-xl lg:hidden"
                        )}
                        onNavigate={() => setMobileNavOpen(false)}
                    />
                </>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar onMenuToggle={() => setMobileNavOpen(true)} />
                <main className="flex-1">
                    <PageContainer>
                        <Outlet />
                    </PageContainer>
                </main>
            </div>
        </div>
    );
}
