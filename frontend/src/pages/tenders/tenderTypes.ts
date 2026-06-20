import type { TenderAnalysisSummary } from "../../modules/procurement/tenderAnalysis";
import type { TenderVisibility } from "../../modules/procurement/constants";

export type TenderInputSource = "manual" | "email" | "api";

export interface TenderItem {
    id: number;
    tender: number;
    name: string;
    unit: string;
    quantity: string;
}

export interface TenderDocument {
    id: number;
    tender: number;
    label: string;
    file: string;
    uploaded_at: string;
}

export interface Tender {
    id: number;
    title: string;
    description: string;
    /** Investor company (FK); API field name `investor`. */
    investor: number;
    /** Primary uploaded document URL when present (multipart upload). */
    document?: string | null;
    deadline: string;
    status: string;
    source: TenderInputSource | "";
    external_id: string;
    source_url: string;
    tender_type: string;
    visibility?: TenderVisibility | string;
    analysis_notes?: string;
    analysis_summary?: TenderAnalysisSummary;
    supplier_names?: string[];
    created_at: string;
    updated_at: string;
    items?: TenderItem[];
    documents?: TenderDocument[];
}

export interface TenderCreatePayload {
    title: string;
    description: string;
    investor: number;
    deadline: string;
    status: string;
    source: TenderInputSource;
    external_id: string;
    source_url: string;
    tender_type: string;
    visibility?: string;
    analysis_notes?: string;
}

export interface TenderItemCreatePayload {
    name: string;
    unit: string;
    quantity: string;
}
