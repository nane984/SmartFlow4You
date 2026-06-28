/** Supplier offer as returned by GET /api/offers/ (SupplierOffer + RFQ context). */
export interface SupplierOffer {
    id: number;
    rfq: number;
    /** Read-only — from linked RFQ. */
    tender: number;
    tender_title?: string;
    supplier?: number;
    supplier_name?: string;
    created_by?: number | null;
    created_by_name?: string;
    document?: string | null;
    total_amount: string | null;
    currency: string;
    notes?: string;
    submitted_at: string;
    valid_until?: string | null;
}

export interface OfferCreatePayload {
    tender_id: number;
    supplier_id: number;
    total_amount?: number;
    currency?: string;
    notes?: string;
}

export interface OfferLineItem {
    id: number;
    supplier_offer: number;
    tender_item: number;
    tender_item_name?: string;
    tender_item_unit?: string;
    unit_price: string;
    quantity: string;
    line_total: string | null;
}

export interface OfferLineItemPayload {
    supplier_offer: number;
    tender_item: number;
    unit_price: number;
    quantity: number;
}

export interface OfferUpdatePayload {
    total_amount?: number;
    currency?: string;
    notes?: string;
}
