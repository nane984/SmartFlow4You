import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import LinkButton from "../../components/ui/LinkButton";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";
import {
    candidateDisplayName,
    getCandidateProfile,
} from "../../modules/candidate/candidateProfile";
import { applyToJob, getJobById, type Job } from "../../modules/jobs/jobs.api";

export default function CandidateJobApplyPage() {
    const { id } = useParams<{ id: string }>();
    const jobId = useMemo(() => Number.parseInt(id ?? "", 10), [id]);

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const profile = getCandidateProfile();
    const [applicantName, setApplicantName] = useState(() => candidateDisplayName(profile));
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
                setJob(await getJobById(jobId));
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load job.");
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
                candidateEmail: profile?.email,
                candidateFirstName: profile?.firstName,
                candidateLastName: profile?.lastName,
            });
            setSubmitMessage("Application submitted successfully.");
            setCvFile(null);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Failed to submit application.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <p className="text-sm text-slate-600">Loading job…</p>
            </Card>
        );
    }

    if (error || !job) {
        return (
            <Card className="space-y-3">
                <p className="text-sm text-rose-700">{error ?? "Job not found."}</p>
                <LinkButton to="/candidate/jobs" variant="secondary" size="sm">
                    Back to jobs
                </LinkButton>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={job.job_title}
                description={`${job.job_company} · ${job.job_location}`}
                actions={
                    <LinkButton to="/candidate/jobs" variant="secondary" size="sm">
                        ← All jobs
                    </LinkButton>
                }
            />

            {!profile && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <Link to="/candidate" className="font-medium underline">
                        Create your profile
                    </Link>{" "}
                    first so we can pre-fill your application.
                </div>
            )}

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
                <h2 className="text-base font-semibold text-slate-900">Apply</h2>
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
                    {profile?.email && (
                        <p className="text-sm text-slate-600">
                            Email on profile: <span className="font-medium">{profile.email}</span>
                        </p>
                    )}
                    <Field label="CV (PDF / Word)">
                        <input
                            className={controlClass}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                            required
                        />
                    </Field>
                    <Button type="submit" disabled={submitting || !cvFile}>
                        {submitting ? "Submitting…" : "Submit application"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
