import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

type PlaceholderPageProps = {
    title: string;
    description?: string;
};

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
    return (
        <>
            <PageHeader title={title} description={description} />
            <Card>
                <p className="text-sm leading-relaxed text-slate-600">
                    This area is reserved for future functionality. Use the navigation above to explore
                    other modules.
                </p>
            </Card>
        </>
    );
}
