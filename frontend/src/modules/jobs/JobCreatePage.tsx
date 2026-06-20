import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";
import { createJob } from "./jobs.api";
import { EMPTY_JOB_FORM } from "./jobFormDefaults";

export default function JobCreatePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY_JOB_FORM);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        setSaving(true);
        try {
            const created = await createJob(form);
            setMessage("Job position created. You can publish it from the job list.");
            setForm(EMPTY_JOB_FORM);
            window.setTimeout(() => {
                navigate(`/hr/jobs?selected=${created.id}`);
            }, 800);
        } catch (err: unknown) {
            const ax = err as { response?: { data?: unknown } };
            setError(err instanceof Error ? err.message : "Job creation failed.");
            if (ax.response?.data) console.warn("Create job error:", ax.response.data);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Create job position"
                description="Add a new opening. After creation, set it to Active from the job list when ready to publish."
                actions={
                    <LinkButton to="/hr/jobs" variant="secondary" size="sm">
                        ← Job list
                    </LinkButton>
                }
            />

            {message ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                    {message}
                </div>
            ) : null}
            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <Card>
                <form className="grid gap-4" onSubmit={handleSubmit}>
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
                        <Field label="Job type">
                            <input
                                className={controlClass}
                                value={form.job_type}
                                onChange={(e) => setForm((f) => ({ ...f, job_type: e.target.value }))}
                            />
                        </Field>
                        <Field label="Category">
                            <input
                                className={controlClass}
                                value={form.job_category}
                                onChange={(e) => setForm((f) => ({ ...f, job_category: e.target.value }))}
                            />
                        </Field>
                        <Field label="Subcategory">
                            <input
                                className={controlClass}
                                value={form.job_subcategory}
                                onChange={(e) => setForm((f) => ({ ...f, job_subcategory: e.target.value }))}
                            />
                        </Field>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={saving}>
                            {saving ? "Creating…" : "Create job position"}
                        </Button>
                        <LinkButton to="/hr/jobs" variant="secondary" size="sm">
                            Cancel
                        </LinkButton>
                    </div>
                </form>
            </Card>
        </div>
    );
}
