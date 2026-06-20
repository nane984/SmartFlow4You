import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import LinkButton from "../../components/ui/LinkButton";
import { controlClass } from "../../components/ui/inputStyles";
import { getEffectiveRole, getStoredUser, isAppAuthenticated } from "../../auth/accessUtils";
import { ROLES } from "../../auth/roles";
import {
    getCandidateProfileMe,
    registerCandidate,
    syncCandidateProfileMe,
} from "../../modules/hr/candidate.api";
import {
    candidateDisplayName,
    getCandidateProfile,
    profileFromHrRecord,
    profileFromStoredUser,
    saveCandidateProfile,
    type CandidateProfile,
} from "../../modules/candidate/candidateProfile";

function apiErrorMessage(err: unknown, fallback: string): string {
    const ax = err as { response?: { data?: { detail?: string } } };
    return ax.response?.data?.detail ?? fallback;
}

export default function CandidatePortal() {
    const authenticated = isAppAuthenticated();
    const role = getEffectiveRole();
    const isLoggedInCandidate = authenticated && role === ROLES.CANDIDATE;

    const storedUser = getStoredUser();
    const guestProfile = getCandidateProfile();

    const [profile, setProfile] = useState<CandidateProfile>(
        profileFromStoredUser(storedUser) ?? guestProfile ?? { firstName: "", lastName: "", email: "" }
    );
    const [loadingMe, setLoadingMe] = useState(isLoggedInCandidate);
    const [linked, setLinked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isLoggedInCandidate) return;
        let cancelled = false;
        (async () => {
            setLoadingMe(true);
            setError(null);
            try {
                const data = await getCandidateProfileMe();
                if (cancelled) return;
                const fromAccount = profileFromStoredUser(data.account);
                if (fromAccount) {
                    setProfile(fromAccount);
                    saveCandidateProfile(fromAccount);
                }
                if (data.hr_profile) {
                    const hr = profileFromHrRecord(data.hr_profile);
                    setProfile(hr);
                    saveCandidateProfile(hr);
                    setLinked(true);
                } else {
                    const synced = await syncCandidateProfileMe();
                    if (cancelled) return;
                    const hr = profileFromHrRecord(synced.hr_profile);
                    setProfile(hr);
                    saveCandidateProfile(hr);
                    setLinked(true);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(apiErrorMessage(e, "Could not load your candidate profile."));
                }
            } finally {
                if (!cancelled) setLoadingMe(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isLoggedInCandidate]);

    const handleGuestSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!profile.firstName.trim() || !profile.email.trim()) return;
        setSaving(true);
        try {
            const record = await registerCandidate({
                first_name: profile.firstName.trim(),
                last_name: profile.lastName.trim(),
                email: profile.email.trim(),
            });
            const savedProfile = profileFromHrRecord(record);
            saveCandidateProfile(savedProfile);
            setProfile(savedProfile);
            setLinked(true);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 3000);
        } catch {
            setError("Could not save profile. This email may already be registered — try signing in instead.");
        } finally {
            setSaving(false);
        }
    };

    const displayName = candidateDisplayName(profile);

    return (
        <div className="space-y-8">
            <PageHeader
                title={isLoggedInCandidate ? "My candidate profile" : "Candidate portal"}
                description={
                    isLoggedInCandidate
                        ? "Your account is your profile. Use this page as a hub to browse jobs and track applications."
                        : "Create a guest profile to apply without an account, or sign in if you already registered as a candidate."
                }
                actions={
                    isLoggedInCandidate ? (
                        <LinkButton to="/candidate-dashboard" variant="secondary" size="sm">
                            My applications
                        </LinkButton>
                    ) : (
                        <LinkButton to="/login" variant="secondary" size="sm">
                            Sign in
                        </LinkButton>
                    )
                }
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    {isLoggedInCandidate ? (
                        <>
                            <h2 className="text-base font-semibold text-slate-900">Your account</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Name and email come from your SmartFlow login. They are used automatically
                                when you apply for jobs — you do not need to enter them again.
                            </p>
                            {loadingMe ? (
                                <p className="mt-4 text-sm text-slate-500">Loading profile…</p>
                            ) : (
                                <dl className="mt-4 space-y-3 text-sm">
                                    <div>
                                        <dt className="font-medium text-slate-500">Name</dt>
                                        <dd className="text-slate-900">{displayName || "—"}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-slate-500">Email</dt>
                                        <dd className="text-slate-900">{profile.email || storedUser?.email}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-slate-500">Username</dt>
                                        <dd className="text-slate-900">{storedUser?.username ?? "—"}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-slate-500">HR profile</dt>
                                        <dd className="text-slate-900">
                                            {linked ? (
                                                <span className="text-emerald-700">Linked for applications</span>
                                            ) : (
                                                <span className="text-amber-700">Not linked yet</span>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            )}
                            {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
                        </>
                    ) : (
                        <>
                            <h2 className="text-base font-semibold text-slate-900">Guest profile</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                For visitors without an account. Saves an HR candidate record so you can
                                apply to jobs. Already registered?{" "}
                                <Link to="/login" className="font-medium text-brand-700 hover:underline">
                                    Sign in
                                </Link>{" "}
                                instead — you will not need this form.
                            </p>
                            {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
                            {displayName && linked ? (
                                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                                    Profile saved as <strong>{displayName}</strong> ({profile.email})
                                </p>
                            ) : null}
                            {saved ? (
                                <p className="mt-2 text-sm font-medium text-emerald-700">Profile saved.</p>
                            ) : null}
                            <form className="mt-4 space-y-4" onSubmit={handleGuestSave}>
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
                                        onChange={(e) =>
                                            setProfile((p) => ({ ...p, email: e.target.value }))
                                        }
                                        required
                                    />
                                </Field>
                                <Button type="submit" disabled={saving}>
                                    {saving ? "Saving…" : "Save guest profile"}
                                </Button>
                            </form>
                        </>
                    )}
                </Card>

                <Card className="flex flex-col justify-between border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Find a job</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Browse open roles published by HR and submit your CV. Your profile details
                            are pre-filled when you apply.
                        </p>
                    </div>
                    <Link
                        to="/candidate/jobs"
                        className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm hover:bg-emerald-700"
                    >
                        Browse jobs
                    </Link>
                </Card>
            </div>
        </div>
    );
}
