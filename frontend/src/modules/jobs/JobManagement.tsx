import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";
import { createJob, getAllJobsForHr, updateJobPostingStatus, type Job } from "./jobs.api";
import JobStatusSelector, { jobPostingStatusBadgeClass } from "../../components/hr/JobStatusSelector";
import type { JobPostingStatus } from "../../components/hr/JobStatusSelector";

function formatMoney(value: string | null): string {
    if (!value) return "—";
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return n.toLocaleString();
}

export default function JobManagement() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [busyJobId, setBusyJobId] = useState<number | null>(null);
    const [form, setForm] = useState({
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
    });

    const loadJobs = async () => {
        setLoading(true);
        try {
            const data = await getAllJobsForHr();
            setJobs(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load jobs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadJobs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        setSaving(true);
        try {
            await createJob(form);
            setMessage("Job created successfully.");
            setForm({
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
                job_subcategory: ""
            });
            await loadJobs();
        } catch (e: any) {
            console.log("BACKEND ERROR:", e.response?.data);
            setError(e instanceof Error ? e.message : "Job creation failed.");
        } finally {
            setSaving(false);
        }
    };

    const handleJobStatusChange = async (jobId: number, posting_status: JobPostingStatus) => {
        setBusyJobId(jobId);
        setError(null);
        try {
            await updateJobPostingStatus(jobId, posting_status);
            await loadJobs();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update job status.");
            throw e;
        } finally {
            setBusyJobId(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Job Management"
                description="Create job postings and set each position to Active or Inactive."
            />

            {message && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                    {message}
                </div>
            )}
            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <Card>
                <h2 className="text-lg font-semibold text-slate-900">Create Job Posting</h2>
                <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                    <Field label="Title">
                        <input
                            className={controlClass}
                            value={form.job_title}
                            onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
                            required
                        />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Company">
                        <input
                            className={controlClass}
                            value={form.job_company}
                            onChange={(e) => setForm((f) => ({ ...f, job_company: e.target.value }))}
                            required
                        />
                    </Field>
                    <Field label="Location">
                        <input
                            className={controlClass}
                            value={form.job_location}
                            onChange={(e) => setForm((f) => ({ ...f, job_location: e.target.value }))}
                            required
                        />
                    </Field>
                    </div>
                    
                    <Field label="Description">
                        <textarea
                            className={`${controlClass} min-h-[110px]`}
                            value={form.job_description}
                            onChange={(e) => setForm((f) => ({ ...f, job_description: e.target.value }))}
                            required
                        />
                    </Field>
                    <Field label="Responsibilities">
                        <textarea
                            className={`${controlClass} min-h-[110px]`}
                            value={form.job_responsibilities}
                            onChange={(e) => setForm((f) => ({ ...f, job_responsibilities: e.target.value }))}
                            required
                        />
                    </Field>
                    <Field label="Requirements">
                        <textarea
                            className={`${controlClass} min-h-[90px]`}
                            value={form.job_requirements}
                            onChange={(e) => setForm((f) => ({ ...f, job_requirements: e.target.value }))}
                        />
                    </Field>
                    <Field label="Benefits">
                        <textarea
                            className={`${controlClass} min-h-[90px]`}
                            value={form.job_benefits}
                            onChange={(e) => setForm((f) => ({ ...f, job_benefits: e.target.value }))}
                        />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Salary min">
                            <input
                                className={controlClass}
                                type="number"
                                step="0.01"
                                value={form.job_salary_min}
                                onChange={(e) => setForm((f) => ({ ...f, job_salary_min: e.target.value }))}
                            />
                        </Field>
                        <Field label="Salary max">
                            <input
                                className={controlClass}
                                type="number"
                                step="0.01"
                                value={form.job_salary_max}
                                onChange={(e) => setForm((f) => ({ ...f, job_salary_max: e.target.value }))}
                            />
                        </Field>
                        <Field label="Job Type">
                            <input
                                className={controlClass}
                                value={form.job_type}
                                onChange={(e) => setForm((f) => ({ ...f, job_type: e.target.value }))}
                            />
                        </Field>
                        <Field label="Job Category">
                            <input
                                className={controlClass}
                                value={form.job_category}
                                onChange={(e) => setForm((f) => ({ ...f, job_category: e.target.value }))}
                            />
                        </Field>
                        <Field label="Job Subcategory">
                            <input
                                className={controlClass}
                                value={form.job_subcategory}
                                onChange={(e) => setForm((f) => ({ ...f, job_subcategory: e.target.value }))}
                            />
                        </Field>
                    </div>
                    <div>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Creating..." : "Create Job"}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="overflow-x-auto p-0">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr className="text-left text-slate-600">
                            <th className="px-4 py-3 font-medium">Title</th>
                            <th className="px-4 py-3 font-medium">Company</th>
                            <th className="px-4 py-3 font-medium">Salary range</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Change status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? (
                            <tr>
                                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                                    Loading jobs...
                                </td>
                            </tr>
                        ) : jobs.length === 0 ? (
                            <tr>
                                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                                    No jobs created yet.
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job) => {
                                const status = job.posting_status ?? (job.job_published ? "published" : "draft");
                                return (
                                <tr key={job.id}>
                                    <td className="px-4 py-3 text-slate-900">{job.job_title}</td>
                                    <td className="px-4 py-3 text-slate-700">{job.job_company}</td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {formatMoney(job.job_salary_min)} - {formatMoney(job.job_salary_max)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={jobPostingStatusBadgeClass(status)}>
                                            {status === "published"
                                                ? "Active"
                                                : status === "closed"
                                                  ? "Inactive"
                                                  : "Draft"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <JobStatusSelector
                                            jobId={job.id}
                                            status={status}
                                            disabled={busyJobId === job.id}
                                            onChange={handleJobStatusChange}
                                        />
                                    </td>
                                </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
