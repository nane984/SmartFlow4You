/** Offer row as returned by the API (file is a URL string). */
export interface Offer {
    id: number
    /** FK to the tender this offer applies to. */
    tender: number
    /** Submitter; omitted or null when not set on the server. */
    created_by?: number
    /** Stored file URL from the backend. */
    file: string
    price: number
    created_at: string
}

/** Fields sent when creating or updating an offer (multipart if `file` is set). */
export interface OfferPayload {
    tender: number
    file: File | null
    price: number
}