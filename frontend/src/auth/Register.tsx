import { useEffect, useId, useState, type CSSProperties, type FocusEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/api";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import { controlClass } from "../components/ui/inputStyles";
import { submitSupplierRegistration } from "../modules/admin/supplierRequests.api";
import { formatApiErrors } from "../util/formatApiErrors";

function apiErrorMessage(err: unknown, fallback: string): string {
    const ax = err as { response?: { data?: unknown } };
    if (ax.response?.data) return formatApiErrors(ax.response.data);
    return fallback;
}

interface RegisterForm {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
    role: "candidate" | "supplier";
    company_name: string;
    company_city: string;
    company_phone: string;
    contact_person: string;
}

const EMPTY_REGISTER_FORM: RegisterForm = {
    username: "",
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
    role: "candidate",
    company_name: "",
    company_city: "",
    company_phone: "",
    contact_person: "",
};

const NO_AUTOFILL = {
    autoComplete: "off",
    "data-lpignore": "true",
    "data-1p-ignore": "true",
    "data-bwignore": "true",
    "data-form-type": "other",
} as const;

const maskedPasswordStyle = { WebkitTextSecurity: "disc" } as CSSProperties;

function unlockOnFocus(e: FocusEvent<HTMLInputElement>) {
    e.currentTarget.removeAttribute("readOnly");
}

function RegisterPasswordFields({
    password,
    password2,
    onPasswordChange,
    onPassword2Change,
}: {
    password: string;
    password2: string;
    onPasswordChange: (value: string) => void;
    onPassword2Change: (value: string) => void;
}) {
    const fieldId = useId().replace(/:/g, "");

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password">
                <input
                    className={controlClass}
                    type="text"
                    id={`${fieldId}-pw`}
                    name={`${fieldId}-pw`}
                    style={maskedPasswordStyle}
                    placeholder="••••••••"
                    {...NO_AUTOFILL}
                    readOnly
                    onFocus={unlockOnFocus}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    required
                />
            </Field>
            <Field label="Confirm password">
                <input
                    className={controlClass}
                    type="text"
                    id={`${fieldId}-pw2`}
                    name={`${fieldId}-pw2`}
                    style={maskedPasswordStyle}
                    placeholder="••••••••"
                    {...NO_AUTOFILL}
                    readOnly
                    onFocus={unlockOnFocus}
                    value={password2}
                    onChange={(e) => onPassword2Change(e.target.value)}
                    required
                />
            </Field>
        </div>
    );
}

const Register = () => {
    const location = useLocation();
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [successEmail, setSuccessEmail] = useState<string | null>(null);
    const [successKind, setSuccessKind] = useState<"candidate" | "supplier" | null>(null);
    const [loading, setLoading] = useState(false);
    const [registerStep, setRegisterStep] = useState<1 | 2>(1);
    const [form, setForm] = useState<RegisterForm>(EMPTY_REGISTER_FORM);

    useEffect(() => {
        setForm(EMPTY_REGISTER_FORM);
        setRegisterStep(1);
        setError(null);
        setSuccessMessage(null);
        setSuccessEmail(null);
        setSuccessKind(null);
        setLoading(false);
    }, [location.key]);

    const isSupplier = form.role === "supplier";

    const handleContinueToPassword = () => {
        if (
            !form.first_name.trim() ||
            !form.last_name.trim() ||
            !form.username.trim() ||
            !form.email.trim()
        ) {
            setError("First name, last name, username and email are required.");
            return;
        }
        if (isSupplier && (!form.company_name.trim() || !form.company_city.trim())) {
            setError("Company name and city are required for supplier registration.");
            return;
        }
        setError(null);
        setForm((s) => ({ ...s, password: "", password2: "" }));
        setRegisterStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setSuccessEmail(null);
        setSuccessKind(null);

        if (form.password !== form.password2) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            if (isSupplier) {
                const res = await submitSupplierRegistration({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                    first_name: form.first_name,
                    last_name: form.last_name,
                    company_name: form.company_name,
                    company_city: form.company_city,
                    company_phone: form.company_phone || undefined,
                    contact_person: form.contact_person || undefined,
                });
                setSuccessKind("supplier");
                setSuccessMessage(res.detail);
            } else {
                const { password2, role, company_name, company_city, company_phone, contact_person, ...dataToSend } =
                    form;
                void password2;
                void role;
                void company_name;
                void company_city;
                void company_phone;
                void contact_person;
                const { data } = await api.post<{ detail: string; email: string }>("core/register/", {
                    ...dataToSend,
                    role: "candidate",
                });
                setSuccessKind("candidate");
                setSuccessEmail(data.email);
                setSuccessMessage(data.detail);
            }
        } catch (err: unknown) {
            setError(apiErrorMessage(err, "Registration failed. Check your details and try again."));
        } finally {
            setLoading(false);
        }
    };

    if (successMessage) {
        return (
            <Card className="w-full max-w-lg border-slate-200/80 shadow-xl shadow-slate-900/10">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    {successKind === "candidate" ? "Check your email" : "Request submitted"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{successMessage}</p>
                {successKind === "candidate" && successEmail ? (
                    <p className="mt-3 text-sm text-slate-600">
                        We sent a confirmation link to <strong>{successEmail}</strong>. Click the link
                        in that email to activate your account. You cannot sign in until you confirm.
                    </p>
                ) : null}
                {successKind === "supplier" ? (
                    <p className="mt-3 text-sm text-slate-600">
                        You will receive access once an administrator approves your supplier profile.
                        You cannot sign in until then.
                    </p>
                ) : null}
                <Link
                    to="/login"
                    className="mt-6 inline-flex text-sm font-medium text-brand-700 no-underline hover:underline"
                >
                    Back to sign in
                </Link>
            </Card>
        );
    }

    return (
        <Card
            key={location.key}
            className="w-full max-w-lg border-slate-200/80 shadow-xl shadow-slate-900/10"
        >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">Create account</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        {isSupplier
                            ? "Supplier accounts require admin approval before you can sign in."
                            : "Candidate accounts require email confirmation before you can sign in."}
                    </p>
                </div>
                <p className="text-xs font-medium text-slate-500">Step {registerStep} of 2</p>
            </div>

            {registerStep === 1 ? (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="First name">
                            <input
                                className={controlClass}
                                type="text"
                                name="sf-reg-fn"
                                placeholder="Jane"
                                {...NO_AUTOFILL}
                                readOnly
                                onFocus={unlockOnFocus}
                                onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))}
                                value={form.first_name}
                                required
                            />
                        </Field>
                        <Field label="Last name">
                            <input
                                className={controlClass}
                                type="text"
                                name="sf-reg-ln"
                                placeholder="Doe"
                                {...NO_AUTOFILL}
                                readOnly
                                onFocus={unlockOnFocus}
                                onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))}
                                value={form.last_name}
                                required
                            />
                        </Field>
                    </div>

                    <Field label="Username">
                        <input
                            className={controlClass}
                            type="text"
                            name="sf-reg-login"
                            placeholder="jdoe"
                            {...NO_AUTOFILL}
                            readOnly
                            onFocus={unlockOnFocus}
                            onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                            value={form.username}
                            required
                        />
                    </Field>

                    <Field label="Email">
                        <input
                            className={controlClass}
                            type="email"
                            name="sf-reg-mail"
                            placeholder="you@company.com"
                            {...NO_AUTOFILL}
                            readOnly
                            onFocus={unlockOnFocus}
                            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                            value={form.email}
                            required
                        />
                    </Field>

                    <Field label="Role">
                        <select
                            className={controlClass}
                            name="sf-reg-role"
                            {...NO_AUTOFILL}
                            value={form.role}
                            onChange={(e) =>
                                setForm((s) => ({
                                    ...s,
                                    role: e.target.value as RegisterForm["role"],
                                }))
                            }
                        >
                            <option value="candidate">Candidate</option>
                            <option value="supplier">Supplier (requires approval)</option>
                        </select>
                    </Field>

                    {isSupplier ? (
                        <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                            <p className="text-sm font-medium text-amber-900">Company details for compliance review</p>
                            <Field label="Company name">
                                <input
                                    className={controlClass}
                                    type="text"
                                    name="sf-reg-company"
                                    {...NO_AUTOFILL}
                                    readOnly
                                    onFocus={unlockOnFocus}
                                    onChange={(e) => setForm((s) => ({ ...s, company_name: e.target.value }))}
                                    value={form.company_name}
                                    required={isSupplier}
                                />
                            </Field>
                            <Field label="City">
                                <input
                                    className={controlClass}
                                    type="text"
                                    name="sf-reg-city"
                                    {...NO_AUTOFILL}
                                    readOnly
                                    onFocus={unlockOnFocus}
                                    onChange={(e) => setForm((s) => ({ ...s, company_city: e.target.value }))}
                                    value={form.company_city}
                                    required={isSupplier}
                                />
                            </Field>
                            <Field label="Phone (optional)">
                                <input
                                    className={controlClass}
                                    type="text"
                                    name="sf-reg-phone"
                                    {...NO_AUTOFILL}
                                    readOnly
                                    onFocus={unlockOnFocus}
                                    onChange={(e) => setForm((s) => ({ ...s, company_phone: e.target.value }))}
                                    value={form.company_phone}
                                />
                            </Field>
                            <Field label="Contact person (optional)">
                                <input
                                    className={controlClass}
                                    type="text"
                                    name="sf-reg-contact"
                                    {...NO_AUTOFILL}
                                    readOnly
                                    onFocus={unlockOnFocus}
                                    onChange={(e) => setForm((s) => ({ ...s, contact_person: e.target.value }))}
                                    value={form.contact_person}
                                />
                            </Field>
                        </div>
                    ) : null}

                    {error ? (
                        <div
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                            role="alert"
                        >
                            {error}
                        </div>
                    ) : null}

                    <Button type="button" className="w-full" size="lg" onClick={handleContinueToPassword}>
                        Next: set password
                    </Button>
                </div>
            ) : (
                <form className="space-y-4" autoComplete="off" onSubmit={handleSubmit}>
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        Registering: <span className="font-medium text-slate-900">{form.username}</span>
                        {" · "}
                        {form.email}
                        {" · "}
                        {isSupplier ? "Supplier" : "Candidate"}
                    </p>

                    <RegisterPasswordFields
                        key={form.username}
                        password={form.password}
                        password2={form.password2}
                        onPasswordChange={(value) => setForm((s) => ({ ...s, password: value }))}
                        onPassword2Change={(value) => setForm((s) => ({ ...s, password2: value }))}
                    />

                    {error ? (
                        <div
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                            role="alert"
                        >
                            {error}
                        </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            size="lg"
                            disabled={loading}
                            onClick={() => {
                                setError(null);
                                setRegisterStep(1);
                            }}
                        >
                            Back
                        </Button>
                        <Button type="submit" className="flex-1" size="lg" disabled={loading}>
                            {loading
                                ? isSupplier
                                    ? "Submitting request…"
                                    : "Sending confirmation…"
                                : isSupplier
                                  ? "Submit supplier request"
                                  : "Register & send confirmation email"}
                        </Button>
                    </div>
                </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-600">
                Already registered?{" "}
                <Link
                    to="/login"
                    className="font-medium text-brand-700 underline-offset-2 hover:text-brand-800 hover:underline"
                >
                    Sign in
                </Link>
            </p>
        </Card>
    );
};

export default Register;
