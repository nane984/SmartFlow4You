
export interface Company {
    id: number;
    name: string;
    email: string;
    contact_person?: string;
    city: string;
}


export interface CompanyPayload {
    name: string;
    email: string;
    contact_person?: string;
    city: string;
}