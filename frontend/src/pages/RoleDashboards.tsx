import PageHeader from "../components/ui/PageHeader";
import LinkButton from "../components/ui/LinkButton";
import {
    CandidateApplicationsList,
    useCandidateApplications,
} from "../components/dashboard/CandidateApplicationsPanel";

export function CandidateDashboardPage() {
    const { applications, interviews, loading, error } = useCandidateApplications();

    return (
        <>
            <PageHeader
                title="My applications"
                description="Track the status of jobs you applied for."
                actions={
                    <LinkButton to="/candidate/interviews" variant="secondary" size="sm">
                        My interviews
                    </LinkButton>
                }
            />
            <CandidateApplicationsList
                applications={applications}
                interviews={interviews}
                loading={loading}
                error={error}
            />
        </>
    );
}

export function InterviewerDashboardPage() {
    return (
        <>
            <PageHeader title="Interviewer Dashboard" description="View assigned interviews and provide feedback." />
            <p className="text-sm text-slate-600">
                Interview sessions are available from the main dashboard for HR staff, or via assigned
                interview links.
            </p>
        </>
    );
}
