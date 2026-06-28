import PageHeader from "../../components/ui/PageHeader";
import OfferForm from "../../modules/offer/OfferForm";

export default function OfferCreate() {
    return (
        <>
            <PageHeader
                title="Submit supplier offer"
                description="For suppliers: link a priced response to a tender and supplier company. An RFQ is created automatically when needed."
            />
            <OfferForm />
        </>
    );
}
