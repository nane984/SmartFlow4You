import axios from "axios";
import api from "../../api/api";
import type { CV, JobPost } from "./cv.types";

const MAX_CV_BYTES = 5 * 1024 * 1024;
const ALLOWED_CV_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

/** Published job posts suitable for attaching a CV application. */
export async function getJobPostsForApplication(): Promise<JobPost[]> {
    const res = await api.get<JobPost[]>("hr/jobpost/", {
        params: { for_application: "1" },
    });
    return Array.isArray(res.data) ? res.data : [];
}

export async function getCvs(): Promise<CV[]> {
    const res = await api.get<CV[]>("hr/cvs/");
    return Array.isArray(res.data) ? res.data : [];
}

export async function getJobPosts(): Promise<JobPost[]> {
    const res = await api.get<JobPost[]>("hr/jobpost/");
    return Array.isArray(res.data) ? res.data : [];
}

export function validateCvFileClient(file: File): string | null {
    if (file.size > MAX_CV_BYTES) {
        return "File is too large. Maximum size is 5 MB.";
    }
    const name = file.name.toLowerCase();
    const ext = name.slice(name.lastIndexOf("."));
    if (!ALLOWED_CV_EXTENSIONS.has(ext)) {
        return "Invalid file type. Use PDF or Word (.doc, .docx).";
    }
    return null;
}

export async function uploadCv(payload: {
    jobPostId: number;
    aplicantName: string;
    file: File;
}): Promise<CV> {
    const formData = new FormData();
    formData.append("job_post", String(payload.jobPostId));
    formData.append("aplicant_name", payload.aplicantName.trim());
    formData.append("file", payload.file);

    const res = await api.post<CV>("hr/cvs/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

export function formatCvUploadError(err: unknown): string {
    if (!axios.isAxiosError(err) || !err.response?.data) {
        return err instanceof Error ? err.message : "Upload failed.";
    }
    const data = err.response.data as Record<string, unknown>;

    if (typeof data.detail === "string") {
        return data.detail;
    }
    if (Array.isArray(data.non_field_errors) && typeof data.non_field_errors[0] === "string") {
        return data.non_field_errors[0];
    }

    const parts: string[] = [];
    for (const key of ["file", "job_post", "aplicant_name"]) {
        const v = data[key];
        if (Array.isArray(v) && typeof v[0] === "string") {
            parts.push(`${key}: ${v[0]}`);
        } else if (typeof v === "string") {
            parts.push(`${key}: ${v}`);
        }
    }
    if (parts.length) {
        return parts.join(" ");
    }

    return "Upload failed.";
}
