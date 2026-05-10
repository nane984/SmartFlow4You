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
    investor: number;
    deadline: string;
    status: string;
    source: TenderInputSource | "";
    external_id: string;
    source_url: string;
    tender_type: string;
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
}

export interface TenderItemCreatePayload {
    name: string;
    unit: string;
    quantity: string;
}
