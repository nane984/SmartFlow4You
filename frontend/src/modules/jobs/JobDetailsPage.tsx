import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";
import { applyToJob, getJobById, type Job } from "./jobs.api";

export default function JobDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const jobId = useMemo(() => Number.parseInt(id ?? "", 10), [id]);

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [applicantName, setApplicantName] = useState("");
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (!Number.isFinite(jobId) || jobId < 1) {
            setLoading(false);
            setError("Invalid job id.");
            return;
        }

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getJobById(jobId);
                setJob(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load job details.");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [jobId]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job || !cvFile) return;
        setSubmitMessage(null);
        setSubmitError(null);
        setSubmitting(true);
        try {
            await applyToJob({
                jobId: job.id,
                applicantName: applicantName.trim(),
                file: cvFile,
            });
            setSubmitMessage("Application submitted successfully.");
            setApplicantName("");
            setCvFile(null);
        } catch (e) {
            setSubmitError(e instanceof Error ? e.message : "Failed to submit application.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <p className="text-sm text-slate-600">Loading job details...</p>
            </Card>
        );
    }

    if (error || !job) {
        return (
            <Card className="space-y-3">
                <p className="text-sm text-rose-700">{error ?? "Job not found."}</p>
                <Link to="/jobs" className="text-sm font-medium text-brand-800 underline">
                    Back to jobs
                </Link>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title={job.job_title} description={`${job.job_company} · ${job.job_location}`} />

            <Card className="space-y-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">Description</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{job.job_description}</p>
                </div>
                <div>
                    <h2 className="text-base font-semibold text-slate-900">Requirements</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{job.job_requirements}</p>
                </div>
            </Card>

            <Card className="space-y-4">
                <h2 className="text-base font-semibold text-slate-900">Apply with CV</h2>
                {submitMessage && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {submitMessage}
                    </div>
                )}
                {submitError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {submitError}
                    </div>
                )}
                <form className="grid gap-4" onSubmit={handleApply}>
                    <Field label="Full name">
                        <input
                            className={controlClass}
                            value={applicantName}
                            onChange={(e) => setApplicantName(e.target.value)}
                            required
                        />
                    </Field>
                    <Field label="CV file (PDF/DOC/DOCX)">
                        <input
                            className={controlClass}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                            required
                        />
                    </Field>
                    <div className="flex gap-3">
                        <Button type="submit" disabled={submitting || !cvFile}>
                            {submitting ? "Submitting..." : "Submit Application"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setCvFile(null)} disabled={submitting}>
                            Clear file
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
