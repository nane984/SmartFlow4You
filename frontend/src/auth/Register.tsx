import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import { controlClass } from "../components/ui/inputStyles";

interface RegisterForm {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
    role: string;
}

const Register = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<RegisterForm>({
        username: "",
        email: "",
        password: "",
        password2: "",
        first_name: "",
        last_name: "",
        role: "employee",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (form.password !== form.password2) {
            setError("Passwords do not match.");
            return;
        }

        const { password2, ...dataToSend } = form;
        setLoading(true);
        try {
            await api.post("core/register/", dataToSend);
            navigate("/login", { replace: true });
        } catch (err: unknown) {
            const ax = err as { response?: { data?: Record<string, unknown> } };
            const data = ax.response?.data;
            if (data && typeof data === "object") {
                const first = Object.entries(data).find(
                    ([, v]) => Array.isArray(v) && typeof v[0] === "string"
                );
                if (first) {
                    setError(`${first[0]}: ${(first[1] as string[])[0]}`);
                    return;
                }
            }
            setError("Registration failed. Check your details and try again.");
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

    return (
        <Card className="w-full max-w-lg border-slate-200/80 shadow-xl shadow-slate-900/10">
            <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Create account</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Join SmartFlow to manage tenders, HR, and company data.
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
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                    </select>
                </Field>

                {error && (
                    <div
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Creating account…" : "Register"}
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
