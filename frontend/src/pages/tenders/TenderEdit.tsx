import PageHeader from "../../components/ui/PageHeader";
import TenderForm from "../../components/tenders/TenderForm";
import { useParams } from "react-router-dom";

export default function TenderEdit() {
    const { id } = useParams();
    const tenderId = id ? Number.parseInt(id, 10) : NaN;

    if (!Number.isFinite(tenderId) || tenderId < 1) {
        return (
            <>
                <PageHeader title="Edit tender" description="Invalid tender id." />
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Edit tender"
                description="Update tender details, deadline, status, or replace the uploaded document."
            />
            <TenderForm tenderId={tenderId} />
        </>
    );
}
