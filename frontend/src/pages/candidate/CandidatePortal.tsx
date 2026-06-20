import { useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { controlClass } from "../../components/ui/inputStyles";
import { registerCandidate } from "../../modules/hr/candidate.api";
import {
    candidateDisplayName,
    getCandidateProfile,
    saveCandidateProfile,
    type CandidateProfile,
} from "../../modules/candidate/candidateProfile";

export default function CandidatePortal() {
    const existing = getCandidateProfile();
    const [profile, setProfile] = useState<CandidateProfile>(
        existing ?? { firstName: "", lastName: "", email: "" }
    );
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!profile.firstName.trim() || !profile.email.trim()) return;
        setSaving(true);
        try {
            await registerCandidate({
                first_name: profile.firstName.trim(),
                last_name: profile.lastName.trim(),
                email: profile.email.trim(),
            });
            saveCandidateProfile({
                firstName: profile.firstName.trim(),
                lastName: profile.lastName.trim(),
                email: profile.email.trim(),
            });
            setSaved(true);
            window.setTimeout(() => setSaved(false), 3000);
        } catch {
            setError("Could not register profile. It may already exist — try another email.");
        } finally {
            setSaving(false);
        }
    };

    const displayName = candidateDisplayName(getCandidateProfile());

    return (
        <div className="space-y-8">
            <PageHeader
                title="Candidate portal"
                description="Create your profile and apply for open positions — no password required in this preview."
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <h2 className="text-base font-semibold text-slate-900">Your profile</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Registers in the HR module and saves locally for quick apply.
                    </p>
                    {error && (
                        <p className="mt-2 text-sm text-rose-700">{error}</p>
                    )}
                    {displayName && (
                        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                            Signed in as <strong>{displayName}</strong> ({getCandidateProfile()?.email})
                        </p>
                    )}
                    {saved && (
                        <p className="mt-2 text-sm font-medium text-emerald-700">Profile saved.</p>
                    )}
                    <form className="mt-4 space-y-4" onSubmit={handleSave}>
                        <Field label="First name">
                            <input
                                className={controlClass}
                                value={profile.firstName}
                                onChange={(e) =>
                                    setProfile((p) => ({ ...p, firstName: e.target.value }))
                                }
                                required
                            />
                        </Field>
                        <Field label="Surname">
                            <input
                                className={controlClass}
                                value={profile.lastName}
                                onChange={(e) =>
                                    setProfile((p) => ({ ...p, lastName: e.target.value }))
                                }
                            />
                        </Field>
                        <Field label="Email">
                            <input
                                className={controlClass}
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                                required
                            />
                        </Field>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save profile"}
                        </Button>
                    </form>
                </Card>

                <Card className="flex flex-col justify-between border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Find a job</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Browse open roles published by HR and apply with your profile and CV.
                        </p>
                    </div>
                    <Link
                        to="/candidate/jobs"
                        className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm hover:bg-emerald-700"
                    >
                        View Jobs
                    </Link>
                </Card>
            </div>
        </div>
    );
}
