import api from "../../api/api";

export type Job = {
    id: number;
    job_title: string;
    job_company: string;
    job_location: string;
    job_description: string;
    job_responsibilities: string;
    job_requirements: string;
    job_benefits: string;
    job_salary_min: string;
    job_salary_max: string;
    job_type: string;
    job_category: string;
    job_subcategory: string;
    job_created_by: number | null;
    job_published: boolean;
    job_published_at: string | null;
    posting_status?: "draft" | "published" | "closed";
};

export type CreateJobPayload = {
    job_title: string;
    job_company: string;
    job_location: string;
    job_description: string;
    job_responsibilities: string;
    job_requirements: string;
    job_benefits: string;
    job_salary_min: string;
    job_salary_max: string;
    job_type: string;
    job_category: string;
    job_subcategory: string;
};

export async function getJobs(): Promise<Job[]> {
    const res = await api.get<Job[]>("jobs/");
    return Array.isArray(res.data) ? res.data : [];
}

/** HR — all job postings including inactive/draft. */
export async function getAllJobsForHr(): Promise<Job[]> {
    const res = await api.get<Job[]>("hr/jobpost/");
    return Array.isArray(res.data) ? res.data : [];
}

export async function updateJobPostingStatus(
    id: number,
    posting_status: "draft" | "published" | "closed"
): Promise<Job> {
    const res = await api.patch<Job>(`jobs/${id}/`, { posting_status });
    return res.data;
}

export type JobApplication = {
    id: number;
    file: string;
    aplicant_name: string;
    job_post?: number;
    job_posting?: number;
    job_title?: string;
    score: number | null;
    processed: boolean;
    status: "submitted" | "reviewed" | "interview" | "accepted" | "rejected" | string;
    status_label?: string;
    submitted_at?: string | null;
    candidate_name?: string;
};

/** HR staff — all job applications (CV uploads). */
export async function getApplications(): Promise<JobApplication[]> {
    const res = await api.get<JobApplication[]>("applications/");
    return Array.isArray(res.data) ? res.data : [];
}

/** Authenticated candidate — own applications. */
export async function getMyApplications(): Promise<JobApplication[]> {
    const res = await api.get<JobApplication[]>("applications/mine/");
    return Array.isArray(res.data) ? res.data : [];
}

export async function updateApplicationStatus(
    id: number,
    action: "mark_reviewed" | "move_next" | "reject"
): Promise<JobApplication> {
    const res = await api.post<JobApplication>(`applications/${id}/status/`, { action });
    return res.data;
}

export async function getJobById(id: number): Promise<Job> {
    const res = await api.get<Job>(`jobs/${id}/`);
    return res.data;
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
    const body = {
        ...payload,
        job_salary_min: payload.job_salary_min ? Number(payload.job_salary_min) : null,
        job_salary_max: payload.job_salary_max ? Number(payload.job_salary_max) : null,
    };
    const res = await api.post<Job>("jobs/", body);
    return res.data;
}

export type ApplyToJobPayload = {
    jobId: number;
    applicantName: string;
    file: File;
    candidateEmail?: string;
    candidateFirstName?: string;
    candidateLastName?: string;
};

/** Public or authenticated job application (JobApplication / CV upload). */
export async function applyToJob(payload: ApplyToJobPayload) {
    const form = new FormData();
    form.append("job_posting", String(payload.jobId));
    form.append("aplicant_name", payload.applicantName);
    form.append("file", payload.file);
    if (payload.candidateEmail) {
        form.append("candidate_email", payload.candidateEmail);
    }
    if (payload.candidateFirstName) {
        form.append("candidate_first_name", payload.candidateFirstName);
    }
    if (payload.candidateLastName) {
        form.append("candidate_last_name", payload.candidateLastName);
    }
    // Do not set Content-Type — browser/axios must add multipart boundary automatically.
    return api.post("applications/", form);
}
