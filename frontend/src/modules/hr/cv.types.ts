export type JobPost = {
    id: number;
    title: string;
    description: string;
    published: boolean;
    published_at: string | null;
    created_by: number | null;
};

export type CV = {
    id: number;
    file: string;
    aplicant_name: string;
    job_post: number;
    score: number | null;
    processed: boolean;
    status: "pending" | "accepted" | "rejected";
};
