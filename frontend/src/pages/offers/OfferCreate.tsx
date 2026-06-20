import PageHeader from "../../components/ui/PageHeader";
import OfferForm from "../../modules/offer/OfferForm";

export default function OfferCreate() {
    return (
        <>
            <PageHeader
                title="Submit supplier offer"
                description="Link an offer to a tender and supplier. An RFQ record is created automatically when needed."
            />
            <OfferForm />
        </>
    );
}
