import React, { useState } from "react";
import { Link } from "react-router-dom";
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

const Register = () => {
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [successEmail, setSuccessEmail] = useState<string | null>(null);
    const [successKind, setSuccessKind] = useState<"candidate" | "supplier" | null>(null);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<RegisterForm>({
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
    });

    const isSupplier = form.role === "supplier";

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
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
        <Card className="w-full max-w-lg border-slate-200/80 shadow-xl shadow-slate-900/10">
            <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Create account</h2>
                <p className="mt-1 text-sm text-slate-600">
                    {isSupplier
                        ? "Supplier accounts require admin approval before you can sign in."
                        : "Candidate accounts require email confirmation before you can sign in."}
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First name">
                        <input
                            className={controlClass}
                            type="text"
                            name="first_name"
                            placeholder="Jane"
                            onChange={handleChange}
                            value={form.first_name}
                            required
                        />
                    </Field>
                    <Field label="Last name">
                        <input
                            className={controlClass}
                            type="text"
                            name="last_name"
                            placeholder="Doe"
                            onChange={handleChange}
                            value={form.last_name}
                            required
                        />
                    </Field>
                </div>

                <Field label="Username">
                    <input
                        className={controlClass}
                        type="text"
                        name="username"
                        placeholder="jdoe"
                        onChange={handleChange}
                        value={form.username}
                        required
                    />
                </Field>

                <Field label="Email">
                    <input
                        className={controlClass}
                        type="email"
                        name="email"
                        placeholder="you@company.com"
                        onChange={handleChange}
                        value={form.email}
                        required
                    />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Password">
                        <input
                            className={controlClass}
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            onChange={handleChange}
                            value={form.password}
                            required
                        />
                    </Field>
                    <Field label="Confirm password">
                        <input
                            className={controlClass}
                            type="password"
                            name="password2"
                            placeholder="••••••••"
                            onChange={handleChange}
                            value={form.password2}
                            required
                        />
                    </Field>
                </div>

                <Field label="Role">
                    <select
                        className={controlClass}
                        name="role"
                        value={form.role}
                        onChange={handleChange}
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
                                name="company_name"
                                onChange={handleChange}
                                value={form.company_name}
                                required={isSupplier}
                            />
                        </Field>
                        <Field label="City">
                            <input
                                className={controlClass}
                                type="text"
                                name="company_city"
                                onChange={handleChange}
                                value={form.company_city}
                                required={isSupplier}
                            />
                        </Field>
                        <Field label="Phone (optional)">
                            <input
                                className={controlClass}
                                type="text"
                                name="company_phone"
                                onChange={handleChange}
                                value={form.company_phone}
                            />
                        </Field>
                        <Field label="Contact person (optional)">
                            <input
                                className={controlClass}
                                type="text"
                                name="contact_person"
                                onChange={handleChange}
                                value={form.contact_person}
                            />
                        </Field>
                    </div>
                ) : null}

                {error && (
                    <div
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading
                        ? isSupplier
                            ? "Submitting request…"
                            : "Sending confirmation…"
                        : isSupplier
                          ? "Submit supplier request"
                          : "Register & send confirmation email"}
                </Button>
            </form>

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
