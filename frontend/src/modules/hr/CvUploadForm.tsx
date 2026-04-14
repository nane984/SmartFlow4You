import { useEffect, useState } from "react";
import {
    formatCvUploadError,
    getJobPostsForApplication,
    uploadCv,
    validateCvFileClient,
} from "./cv.api";
import type { JobPost } from "./cv.types";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";

const fileInputClass =
    "block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-6 text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:border-brand-400 hover:bg-brand-50/30 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50";

export default function CvUploadForm() {
    const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [jobsError, setJobsError] = useState<string | null>(null);

    const [jobPostId, setJobPostId] = useState("");
    const [aplicantName, setAplicantName] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingJobs(true);
            setJobsError(null);
            try {
                const list = await getJobPostsForApplication();
                if (!cancelled) {
                    setJobPosts(list);
                    if (list.length === 1) {
                        setJobPostId(String(list[0].id));
                    }
                }
            } catch {
                if (!cancelled) {
                    setJobsError("Could not load job posts. Try again later.");
                    setJobPosts([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingJobs(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        setSubmitError(null);
        setSuccessMessage(null);
        if (f) {
            const msg = validateCvFileClient(f);
            if (msg) {
                setSubmitError(msg);
                setFile(null);
                e.target.value = "";
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setSubmitError(null);

        const jpid = Number.parseInt(jobPostId, 10);
        if (!Number.isFinite(jpid) || jpid < 1) {
            setSubmitError("Please select a job post.");
            return;
        }
        if (!aplicantName.trim()) {
            setSubmitError("Please enter applicant name.");
            return;
        }
        if (!file) {
            setSubmitError("Please choose a CV file (PDF or Word).");
            return;
        }

        const clientErr = validateCvFileClient(file);
        if (clientErr) {
            setSubmitError(clientErr);
            return;
        }

        setSubmitting(true);
        try {
            const created = await uploadCv({
                jobPostId: jpid,
                aplicantName: aplicantName.trim(),
                file,
            });
            setSuccessMessage(
                `CV uploaded successfully (reference #${created.id}). You can submit another application below.`
            );
            setFile(null);
            setAplicantName("");
            const input = document.getElementById("cv-file-input") as HTMLInputElement | null;
            if (input) {
                input.value = "";
            }
        } catch (err) {
            setSubmitError(formatCvUploadError(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Submit CV"
                description="Upload a PDF or Word document (max 5 MB) and link it to a published job post."
            />

            <Card className="max-w-xl">
                {loadingJobs && (
                    <p className="text-sm text-slate-600">Loading open positions…</p>
                )}
                {jobsError && (
                    <div
                        className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                        role="alert"
                    >
                        {jobsError}
                    </div>
                )}
                {!loadingJobs && !jobsError && jobPosts.length === 0 && (
                    <p className="mb-4 text-sm text-slate-600">
                        There are no published job posts right now. You cannot submit a CV until at
                        least one job is published in the admin.
                    </p>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <Field label="Job post">
                        <select
                            className={controlClass}
                            value={jobPostId}
                            onChange={(e) => setJobPostId(e.target.value)}
                            required
                            disabled={loadingJobs || jobPosts.length === 0}
                        >
                            <option value="">— Select a position —</option>
                            {jobPosts.map((jp) => (
                                <option key={jp.id} value={jp.id}>
                                    {jp.title}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Applicant name" hint="As it should appear on the application.">
                        <input
                            className={controlClass}
                            type="text"
                            value={aplicantName}
                            onChange={(e) => setAplicantName(e.target.value)}
                            required
                            disabled={jobPosts.length === 0}
                            placeholder="Full legal name"
                        />
                    </Field>

                    <Field
                        label="CV file"
                        hint="Accepted: PDF, .doc, .docx — maximum 5 MB."
                    >
                        <input
                            id="cv-file-input"
                            className={fileInputClass}
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={onFileChange}
                            disabled={jobPosts.length === 0}
                        />
                    </Field>

                    <Button type="submit" disabled={submitting || jobPosts.length === 0} className="w-full sm:w-auto">
                        {submitting ? "Uploading…" : "Upload CV"}
                    </Button>
                </form>

                {successMessage && (
                    <div
                        className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
                        role="status"
                    >
                        {successMessage}
                    </div>
                )}
                {submitError && (
                    <div
                        className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                        role="alert"
                    >
                        {submitError}
                    </div>
                )}
            </Card>
        </>
    );
}
