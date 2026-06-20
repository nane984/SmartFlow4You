import { Link, useLocation } from "react-router-dom";
import Card from "../components/ui/Card";
import LinkButton from "../components/ui/LinkButton";
import PageHeader from "../components/ui/PageHeader";
import type { AccessDomain } from "../auth/accessConfig";
import { ACCESS_DOMAINS } from "../auth/accessConfig";

type DeniedState = {
    from?: string;
    domain?: AccessDomain;
};

function domainHint(domain: AccessDomain | undefined): string {
    switch (domain) {
        case ACCESS_DOMAINS.TENDERS:
            return "Procurement modules require a Tender user, Supplier, or Administrator role.";
        case ACCESS_DOMAINS.HR:
            return "HR job management requires an HR Admin, Interviewer, or Administrator role.";
        default:
            return "Your current role does not include this area.";
    }
}

export default function AccessDenied() {
    const location = useLocation();
    const state = (location.state ?? {}) as DeniedState;

    return (
        <div className="mx-auto max-w-xl px-4 py-12">
            <PageHeader title="Access denied" description={domainHint(state.domain)} />
            <Card className="space-y-4">
                <p className="text-sm text-slate-700">
                    Sign in with the correct role, use a demo role from the home page, or contact an
                    administrator.
                </p>
                {state.from && (
                    <p className="text-xs text-slate-500">
                        Requested: <code className="rounded bg-slate-100 px-1">{state.from}</code>
                    </p>
                )}
                <div className="flex flex-wrap gap-2">
                    <LinkButton to="/" variant="primary" size="sm">
                        Home
                    </LinkButton>
                    <LinkButton to="/login" variant="secondary" size="sm">
                        Sign in
                    </LinkButton>
                    <Link
                        to="/candidate"
                        className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 no-underline hover:bg-emerald-100"
                    >
                        Candidate portal
                    </Link>
                </div>
            </Card>
        </div>
    );
}
