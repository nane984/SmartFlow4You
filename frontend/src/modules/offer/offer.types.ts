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

export interface OfferUpdatePayload {
    total_amount?: number;
    currency?: string;
    notes?: string;
}
