import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

export default function AccessDenied() {
    return (
        <>
            <PageHeader title="Access Denied" description="You do not have permission to access this page." />
            <Card className="max-w-xl">
                <p className="text-sm text-slate-700">
                    Your current role does not include this area. Contact an administrator if you think this is a
                    mistake.
                </p>
                <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-700 underline">
                    Back to dashboard
                </Link>
            </Card>
        </>
    );
}
