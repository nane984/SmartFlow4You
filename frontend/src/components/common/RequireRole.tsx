import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUserRole } from "../../auth/authUtils";
import type { AppRole } from "../../auth/roles"

type RequireRoleProps = {
    allowed: AppRole[];
};

export default function RequireRole({ allowed }: RequireRoleProps) {
    const location = useLocation();
    const role = getUserRole();

    if (!role || !allowed.includes(role)) {
        return (
            <Navigate
                to="/access-denied"
                replace
                state={{ from: `${location.pathname}${location.search}` }}
            />
        );
    }
    return <Outlet />;
}
