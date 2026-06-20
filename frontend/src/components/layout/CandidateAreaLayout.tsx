import { getEffectiveRole, isAppAuthenticated } from "../../auth/accessUtils";
import { ROLES, roleInList } from "../../auth/roles";
import Layout from "./Layout";
import PublicLayout from "./PublicLayout";

/**
 * Candidate portal shell:
 * - Logged-in candidate/admin → private Layout (sidebar + topbar, same as Dashboard)
 * - Guest → public marketing navbar
 */
export default function CandidateAreaLayout() {
    const authed = isAppAuthenticated();
    const role = getEffectiveRole();
    const useAppShell = authed && roleInList(role, [ROLES.CANDIDATE, ROLES.ADMIN]);

    if (useAppShell) {
        return <Layout />;
    }

    return <PublicLayout />;
}
