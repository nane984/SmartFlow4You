
/** Matches backend `Company.company_type` — investor, contractor, supplier. */
export type CompanyRoleType = "investor" | "contractor" | "supplier";

export interface Company {
    id: number;
    name: string;
    email: string;
    contact_person?: string;
    city: string;
    company_type?: string;
}


export interface CompanyPayload {
    name: string;
    email: string;
    contact_person?: string;
    city: string;
    company_type: string;
}