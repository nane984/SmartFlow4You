export type CheckFrequency = "1h" | "2h" | "4h" | "6h" | "12h" | "24h";

export type SourceType = "api" | "xml" | "csv" | "web";

export type ExecutionStatus = "success" | "failed" | "no_new_results";

export type TenderKeyword = {
    id: number;
    tender_definition: number;
    keyword: string;
};

export type ProcurementSource = {
    id: number;
    tender_definition: number;
    name: string;
    api_url: string;
    source_type: SourceType;
    enabled: boolean;
    created_at: string;
};

export type TenderDefinition = {
    id: number;
    name: string;
    description: string;
    created_by: number | null;
    created_by_name: string | null;
    default_investor: number;
    default_investor_name: string;
    check_frequency: CheckFrequency;
    is_active: boolean;
    last_checked: string | null;
    last_successful_check: string | null;
    created_at: string;
    updated_at: string;
    keywords: TenderKeyword[];
    sources: ProcurementSource[];
};

export type TenderDefinitionPayload = {
    name: string;
    description?: string;
    default_investor: number;
    check_frequency: CheckFrequency;
    is_active?: boolean;
    keyword_list?: string[];
    source_list?: Array<{
        name: string;
        api_url: string;
        source_type?: SourceType;
        enabled?: boolean;
    }>;
};

export type TenderDefinitionExecutionLog = {
    id: number;
    tender_definition: number;
    started_at: string;
    finished_at: string | null;
    status: ExecutionStatus;
    received_count: number;
    matched_count: number;
    duplicate_count: number;
    processed_count: number;
    imported_count: number;
    skipped_count: number;
    error_message: string;
};

export type TenderDefinitionRunTestResult = {
    definition_name: string;
    received_count: number;
    matched_count: number;
    duplicate_count: number;
    new_import_count: number;
    imported_count: number;
    ignored_count: number;
    errors: string[];
};

export type TenderNotification = {
    id: number;
    title: string;
    message: string;
    link: string;
    tender_id: number | null;
    is_read: boolean;
    created_at: string;
};

export const CHECK_FREQUENCY_OPTIONS: { value: CheckFrequency; label: string }[] = [
    { value: "1h", label: "Every hour" },
    { value: "2h", label: "Every 2 hours" },
    { value: "4h", label: "Every 4 hours" },
    { value: "6h", label: "Every 6 hours" },
    { value: "12h", label: "Every 12 hours" },
    { value: "24h", label: "Once per day" },
];

export const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
    { value: "api", label: "API (JSON)" },
    { value: "xml", label: "XML" },
    { value: "csv", label: "CSV" },
    { value: "web", label: "Web scraping (future)" },
];

export function checkFrequencyLabel(value: CheckFrequency): string {
    return CHECK_FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function executionStatusLabel(status: ExecutionStatus): string {
    switch (status) {
        case "success":
            return "Success";
        case "failed":
            return "Failed";
        case "no_new_results":
            return "No new results";
    }
}
