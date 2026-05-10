import PageHeader from "../../components/ui/PageHeader";
import TenderForm from "../../components/tenders/TenderForm";

export default function TenderCreate() {
    return (
        <>
            <PageHeader
                title="Create tender"
                description="Define the tender, investor, deadlines, and how the record was sourced."
            />
            <TenderForm />
        </>
    );
}
