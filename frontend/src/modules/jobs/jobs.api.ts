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
};

export async function applyToJob(payload: ApplyToJobPayload) {
    const form = new FormData();
    form.append("job_post", String(payload.jobId));
    form.append("aplicant_name", payload.applicantName);
    form.append("file", payload.file);
    return api.post("applications/", form, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}
