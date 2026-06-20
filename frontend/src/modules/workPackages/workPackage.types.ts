import type { ObjectType, WorkCategory } from "../procurement/constants";
import type { SubmissionStatus } from "./submissionStatus";

export interface WorkPackageSubmission {
    id: number;
    subcontractor: number;
    subcontractor_name: string;
    work_package: number;
    work_package_name?: string;
    tender?: number;
    uploaded_file: string;
    status: SubmissionStatus | string;
    price: string | null;
    submitted_at: string;
}

export interface WorkPackage {
    id: number;
    tender: number;
    tender_title?: string;
    name: string;
    description: string;
    work_category?: WorkCategory | string;
    object_type?: ObjectType | string;
    template_file: string | null;
    created_at: string;
    submissions?: WorkPackageSubmission[];
    submission_count?: number;
    contractor_names?: string[];
}

export interface WorkPackageCreatePayload {
    tender: number;
    name: string;
    description: string;
    work_category?: string;
    object_type?: string;
    contractor_ids?: number[];
}

export interface SubmissionCreatePayload {
    subcontractor: number;
    work_package: number;
    status?: SubmissionStatus;
    /** Parsed numeric price; omit when empty. */
    price?: number;
}
