import { Outlet, useLocation } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import PageContainer from "./PageContainer";
import { PUBLIC_MAIN_OFFSET_CLASS } from "./layoutConstants";
import { cn } from "../ui/cn";

/** Public marketing shell — no sidebar, no logout, no module navigation. */
export default function PublicLayout() {
    const { pathname } = useLocation();
    const isHome = pathname === "/";

    return (
        <div className="min-h-screen bg-slate-100">
            <PublicNavbar />
            <main className={cn(!isHome && PUBLIC_MAIN_OFFSET_CLASS)}>
                {isHome ? <Outlet /> : (
                    <PageContainer>
                        <Outlet />
                    </PageContainer>
                )}
            </main>
        </div>
    );
}
