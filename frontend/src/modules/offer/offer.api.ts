import api from "../../api/api";
import type { ApiPage } from "../../components/common/Pagenation.type";
import { formatPriceForApi } from "../../util/parsePriceInput";
import type {
    OfferCreatePayload,
    OfferLineItem,
    OfferLineItemPayload,
    OfferUpdatePayload,
    SupplierOffer,
} from "./offer.types";

function unwrapList<T>(data: ApiPage<T> | T[]): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
}

export async function getOffers(tenderId?: number): Promise<SupplierOffer[]> {
    const url =
        tenderId != null && tenderId > 0 ? `/offers/?tender=${tenderId}` : "/offers/";
    const res = await api.get<ApiPage<SupplierOffer> | SupplierOffer[]>(url);
    return unwrapList(res.data);
}

export async function getOfferById(id: number): Promise<SupplierOffer> {
    const res = await api.get<SupplierOffer>(`/offers/${id}/`);
    return res.data;
}

export async function createOffer(
    data: OfferCreatePayload,
    document: File | null
): Promise<SupplierOffer> {
    const fd = new FormData();
    fd.append("tender_id", String(data.tender_id));
    fd.append("supplier_id", String(data.supplier_id));
    if (data.total_amount != null && Number.isFinite(data.total_amount)) {
        fd.append("total_amount", formatPriceForApi(data.total_amount));
    }
    if (data.currency) fd.append("currency", data.currency);
    if (data.notes?.trim()) fd.append("notes", data.notes.trim());
    if (document) fd.append("document", document);

    if (import.meta.env.DEV) {
        console.log("[createOffer] payload", {
            tender_id: data.tender_id,
            supplier_id: data.supplier_id,
            total_amount: data.total_amount ?? null,
            file: document?.name ?? null,
        });
    }

    const res = await api.post<SupplierOffer>("/offers/", fd);
    return res.data;
}

export async function updateOffer(
    id: number,
    data: OfferUpdatePayload,
    document: File | null
): Promise<SupplierOffer> {
    const fd = new FormData();
    if (data.total_amount != null && Number.isFinite(data.total_amount)) {
        fd.append("total_amount", formatPriceForApi(data.total_amount));
    }
    if (data.currency) fd.append("currency", data.currency);
    if (data.notes !== undefined) fd.append("notes", data.notes);
    if (document) fd.append("document", document);

    const res = await api.put<SupplierOffer>(`/offers/${id}/`, fd);
    return res.data;
}

export async function deleteOffer(id: number): Promise<void> {
    await api.delete(`/offers/${id}/`);
}

export async function getOfferItems(offerId: number): Promise<OfferLineItem[]> {
    const res = await api.get<ApiPage<OfferLineItem> | OfferLineItem[]>(
        `/offer-items/?supplier_offer=${offerId}`,
    );
    return unwrapList(res.data);
}

export async function createOfferItem(data: OfferLineItemPayload): Promise<OfferLineItem> {
    const res = await api.post<OfferLineItem>("/offer-items/", {
        supplier_offer: data.supplier_offer,
        tender_item: data.tender_item,
        unit_price: formatPriceForApi(data.unit_price),
        quantity: formatPriceForApi(data.quantity),
    });
    return res.data;
}

export async function createOfferLineItems(
    offerId: number,
    lines: Omit<OfferLineItemPayload, "supplier_offer">[],
): Promise<void> {
    await Promise.all(
        lines.map((line) =>
            createOfferItem({
                supplier_offer: offerId,
                tender_item: line.tender_item,
                unit_price: line.unit_price,
                quantity: line.quantity,
            }),
        ),
    );
}
