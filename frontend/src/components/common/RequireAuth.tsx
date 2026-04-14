import { Navigate, Outlet, useLocation } from "react-router-dom";
import { clearAuthStorage, isAccessTokenValid } from "../../auth/authUtils";

/**
 * Pathless layout: all child routes are reachable only with a valid (unexpired) access JWT.
 */
export default function RequireAuth() {
    const location = useLocation();
    const token = localStorage.getItem("access");

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
