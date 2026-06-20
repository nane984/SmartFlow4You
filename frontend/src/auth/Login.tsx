import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import api from "../api/api";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import { controlClass } from "../components/ui/inputStyles";
import { clearMockSession, roleHomePath } from "./accessUtils";
import { setStoredRole } from "./authUtils";
import type { AppRole } from "./roles";

function safeInternalPath(value: string | null | undefined): string | null {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
    return trimmed;
}

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await api.post("token/", { username, password });

            clearMockSession();
            localStorage.setItem("access", res.data.access);
            localStorage.setItem("refresh", res.data.refresh);

            const me = await api.get<{ role: AppRole }>("core/users/me/");
            setStoredRole(me.data.role);

            const fromState = (location.state as { from?: string } | null)?.from;
            const fromQuery = searchParams.get("from");
            const target =
                safeInternalPath(fromState) ||
                safeInternalPath(fromQuery) ||
                roleHomePath(me.data.role);

            navigate(target, { replace: true });
        } catch {
            setError("Invalid username or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md border-slate-200/80 shadow-xl shadow-slate-900/10">
            <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Sign in</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Use your SmartFlow credentials to access the dashboard.
                </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
                <Field label="Username">
                    <input
                        className={controlClass}
                        name="username"
                        autoComplete="username"
                        placeholder="you@company.com or username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </Field>
                <Field label="Password">
                    <input
                        className={controlClass}
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
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
                    {loading ? "Signing in…" : "Sign in"}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
                No account?{" "}
                <Link
                    to="/register"
                    className="font-medium text-brand-700 underline-offset-2 hover:text-brand-800 hover:underline"
                >
                    Create one
                </Link>
            </p>
        </Card>
    );
}
