export type JobPost = {
    id: number;
    title: string;
    description: string;
    published: boolean;
    published_at: string | null;
    created_by: number | null;
    posting_status?: "draft" | "published" | "closed";
    job_title?: string;
};

export type CV = {
    id: number;
    file: string;
    aplicant_name: string;
    job_post?: number;
    job_posting?: number;
    score: number | null;
    processed: boolean;
    status: "submitted" | "reviewed" | "interview" | "accepted" | "rejected";
    status_label?: string;
    submitted_at?: string | null;
};
