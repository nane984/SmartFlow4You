import type { CreateJobPayload } from "./jobs.api";

export const EMPTY_JOB_FORM: CreateJobPayload = {
    job_title: "",
    job_company: "",
    job_location: "",
    job_description: "",
    job_responsibilities: "",
    job_requirements: "",
    job_benefits: "",
    job_salary_min: "",
    job_salary_max: "",
    job_type: "",
    job_category: "",
    job_subcategory: "",
};

export function formatJobSalary(min: string | null, max: string | null): string {
    const minN = min ? Number(min) : NaN;
    const maxN = max ? Number(max) : NaN;
    const minLabel = Number.isNaN(minN) ? min : minN.toLocaleString();
    const maxLabel = Number.isNaN(maxN) ? max : maxN.toLocaleString();
    if (!min && !max) return "Not specified";
    if (!min) return `Up to ${maxLabel}`;
    if (!max) return `From ${minLabel}`;
    return `${minLabel} – ${maxLabel}`;
}

export function jobEffectiveStatus(job: { posting_status?: string; job_published?: boolean }): string {
    return job.posting_status ?? (job.job_published ? "published" : "draft");
}
