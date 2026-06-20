import { Navigate, Outlet, useLocation } from "react-router-dom";
import { clearAuthStorage, isAccessTokenValid } from "../../auth/authUtils";
import { hasMockSession } from "../../auth/accessUtils";

/**
 * Pathless layout: valid JWT or placeholder mock session (demo roles).
 * Replace mock bypass when real authentication is enforced end-to-end.
 */
export default function RequireAuth() {
    const location = useLocation();
    const token = localStorage.getItem("access");

    if (hasMockSession()) {
        return <Outlet />;
    }

    if (!isAccessTokenValid(token)) {
        if (token) {
            clearAuthStorage();
        }
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: `${location.pathname}${location.search}` }}
            />
        );
    }

    return <Outlet />;
}
