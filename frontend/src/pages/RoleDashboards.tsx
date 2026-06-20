import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import LinkButton from "../components/ui/LinkButton";

export function HRDashboardPage() {
    return (
        <>
            <PageHeader title="HR Dashboard" description="Create job postings and review candidates." />
            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <h3 className="font-semibold text-slate-900">Job management</h3>
                    <p className="mt-2 text-sm text-slate-600">Create and maintain open positions.</p>
                    <LinkButton to="/hr/jobs" variant="secondary" size="sm" className="mt-4">Open Job Management</LinkButton>
                </Card>
                <Card>
                    <h3 className="font-semibold text-slate-900">Candidates</h3>
                    <p className="mt-2 text-sm text-slate-600">Review applications and interview sessions.</p>
                    <LinkButton to="/hr-dashboard" variant="secondary" size="sm" className="mt-4">View candidates</LinkButton>
                </Card>
            </div>
        </>
    );
}

export function CandidateDashboardPage() {
    return (
        <>
            <PageHeader title="Candidate Dashboard" description="Browse jobs and submit applications." />
            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <h3 className="font-semibold text-slate-900">Open jobs</h3>
                    <p className="mt-2 text-sm text-slate-600">View available positions.</p>
                    <LinkButton to="/candidate/jobs" variant="secondary" size="sm" className="mt-4">Browse jobs</LinkButton>
                </Card>
                <Card>
                    <h3 className="font-semibold text-slate-900">Applications</h3>
                    <p className="mt-2 text-sm text-slate-600">Submit your CV and track progress.</p>
                    <LinkButton to="/candidate" variant="secondary" size="sm" className="mt-4">Candidate portal</LinkButton>
                </Card>
            </div>
        </>
    );
}

export function InterviewerDashboardPage() {
    return (
        <>
            <PageHeader title="Interviewer Dashboard" description="View assigned interviews and provide feedback." />
            <Card>
                <h3 className="font-semibold text-slate-900">Assigned interviews</h3>
                <p className="mt-2 text-sm text-slate-600">Go to the HR module to open your assigned interview sessions.</p>
                <LinkButton to="/hr-dashboard" variant="secondary" size="sm" className="mt-4">Open sessions</LinkButton>
            </Card>
        </>
    );
}

export function AdminDashboardPage() {
    return (
        <>
            <PageHeader title="Admin Dashboard" description="Global administration across all modules." />
            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <h3 className="font-semibold text-slate-900">User management</h3>
                    <p className="mt-2 text-sm text-slate-600">Manage users, roles, and permissions.</p>
                </Card>
                <Card>
                    <h3 className="font-semibold text-slate-900">System overview</h3>
                    <p className="mt-2 text-sm text-slate-600">View all business modules in one place.</p>
                </Card>
            </div>
        </>
    );
}
