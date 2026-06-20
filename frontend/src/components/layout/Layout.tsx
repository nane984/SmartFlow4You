import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import PageContainer from "./PageContainer";

/**
 * Global app shell: sticky navbar + scrollable main with consistent page padding.
 * Wraps public routes (home, candidate portal) and authenticated modules alike.
 */
export default function Layout() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            <Navbar />
            <main className="flex-1">
                <PageContainer>
                    <Outlet />
                </PageContainer>
            </main>
        </div>
    );
}
