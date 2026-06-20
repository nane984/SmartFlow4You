import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getEffectiveRole } from "../../auth/accessUtils";
import type { AppRole } from "../../auth/roles";
import { roleInList } from "../../auth/roles";

type RequireRoleProps = {
    allowed: AppRole[];
};

/** Role gate — uses canonical + legacy role aliases from /api/me/ or mock session. */
export default function RequireRole({ allowed }: RequireRoleProps) {
    const location = useLocation();
    const role = getEffectiveRole();

    if (!roleInList(role, allowed)) {
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
