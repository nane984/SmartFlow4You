import type { TenderItem } from "../../pages/tenders/tenderTypes";

type ItemListProps = {
    items: TenderItem[];
};

export default function ItemList({ items }: ItemListProps) {
    if (items.length === 0) {
        return <p className="text-sm text-slate-600">No line items yet.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                    <tr className="text-left text-slate-600">
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium">Quantity</th>
                        <th className="px-4 py-2 font-medium">Unit</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((row) => (
                        <tr key={row.id}>
                            <td className="px-4 py-2 text-slate-900">{row.name}</td>
                            <td className="px-4 py-2 text-slate-800">{row.quantity}</td>
                            <td className="px-4 py-2 text-slate-800">{row.unit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
