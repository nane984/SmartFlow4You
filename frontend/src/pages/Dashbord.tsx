import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getEffectiveRole } from "../auth/accessUtils";
import { HR_STAFF_ROLES, ROLES, roleInList } from "../auth/roles";
import DashboardHero from "../components/dashboard/DashboardHero";
import DashboardModuleCard from "../components/dashboard/DashboardModuleCard";
import HrRecruitmentPanel from "../components/dashboard/HrRecruitmentPanel";
import {
    CandidateApplicationsList,
    useCandidateApplications,
} from "../components/dashboard/CandidateApplicationsPanel";
import {
    DASHBOARD_MODULES,
    ROLE_SHORTCUTS,
} from "../components/dashboard/dashboardModules";
import LandingWidgets from "../components/landing/LandingWidgets";
import LinkButton from "../components/ui/LinkButton";
import { cn } from "../components/ui/cn";

export default function Dashboard() {
    const role = useMemo(() => getEffectiveRole(), []);
    const isHrStaff = roleInList(role, HR_STAFF_ROLES);
    const isHrPrimary =
        roleInList(role, [ROLES.HR_ADMIN, ROLES.HR]) && !roleInList(role, [ROLES.ADMIN]);
    const isCandidate = roleInList(role, [ROLES.CANDIDATE, ROLES.ADMIN]);
    const candidateApps = useCandidateApplications();

    const modules = useMemo(() => {
        const list = DASHBOARD_MODULES.filter((m) => roleInList(role, m.roles));
        if (isHrStaff) {
            return list.filter((m) => m.id !== "hr-jobs");
        }
        return list;
    }, [role, isHrStaff]);

    const shortcuts = useMemo(
        () => ROLE_SHORTCUTS.filter((s) => roleInList(role, s.roles)),
        [role]
    );

    return (
        <div className="space-y-10 pb-4">
            <DashboardHero
                description={
                    isHrStaff
                        ? "Recruitment hub — review applications, manage job postings, and track interviews."
                        : undefined
                }
            />

            {shortcuts.length > 0 && !isHrPrimary ? (
                <section className="flex flex-wrap gap-2">
                    {shortcuts.map((shortcut) => (
                        <LinkButton key={shortcut.to} to={shortcut.to} variant="secondary" size="sm">
                            {shortcut.label}
                        </LinkButton>
                    ))}
                </section>
            ) : null}

            {isHrStaff ? <HrRecruitmentPanel /> : null}

            {isCandidate && !isHrStaff ? (
                <section className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
                            Applications
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Your job applications
                        </h2>
                    </div>
                    <CandidateApplicationsList
                        applications={candidateApps.applications}
                        interviews={candidateApps.interviews}
                        loading={candidateApps.loading}
                        error={candidateApps.error}
                    />
                </section>
            ) : null}

            {!isHrPrimary && modules.length > 0 ? (
                <section className="space-y-6">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
                            Your modules
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Pick up where you left off
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Quick access to the areas available for your role.
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {modules.map((module, index) => (
                            <DashboardModuleCard
                                key={module.id}
                                to={module.to}
                                title={module.title}
                                description={module.description}
                                icon={module.icon}
                                accent={module.accent}
                                className={
                                    index === 1
                                        ? "[animation-delay:80ms]"
                                        : index === 2
                                          ? "[animation-delay:160ms]"
                                          : undefined
                                }
                            />
                        ))}
                    </div>
                </section>
            ) : !isHrPrimary && modules.length === 0 && !isHrStaff ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                    <p className="text-sm text-slate-600">
                        No modules are assigned to your role yet. Contact an administrator if you
                        need access.
                    </p>
                    <Link
                        to="/"
                        className="mt-4 inline-block text-sm font-medium text-brand-700 no-underline hover:underline"
                    >
                        Back to home
                    </Link>
                </div>
            ) : null}

            {!isHrPrimary ? (
                <section className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
                            Insights
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">Today at a glance</h2>
                    </div>
                    <LandingWidgets />
                </section>
            ) : null}

            {!isHrPrimary ? (
                <section
                    className={cn(
                        "rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-6",
                        "text-center sm:text-left"
                    )}
                >
                    <h3 className="text-base font-semibold text-slate-900">Need the overview?</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Visit the public home page for product information, or use the sidebar to navigate
                        between modules.
                    </p>
                    <LinkButton to="/" variant="ghost" size="sm" className="mt-4">
                        View product home
                    </LinkButton>
                </section>
            ) : null}
        </div>
    );
}
