import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AccessDomain } from "../../auth/accessConfig";
import { ACCESS_DOMAINS } from "../../auth/accessConfig";
import { hasAccessToDomain } from "../../auth/accessUtils";

type RequireAccessProps = {
    domain: AccessDomain;
};

/**
 * Role-based gate (placeholder). Pair with {@link RequireAuth} for protected areas.
 * Public domains (candidate portal) should not use this wrapper.
 */
export default function RequireAccess({ domain }: RequireAccessProps) {
    const location = useLocation();

    if (domain === ACCESS_DOMAINS.CANDIDATE_PUBLIC) {
        return <Outlet />;
    }

    if (!hasAccessToDomain(domain)) {
        return (
            <Navigate
                to="/access-denied"
                replace
                state={{
                    from: `${location.pathname}${location.search}`,
                    domain,
                }}
            />
        );
    }

    return <Outlet />;
}
