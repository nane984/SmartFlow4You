import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LinkButton from "../../components/ui/LinkButton";
import { formatApiErrors } from "../../util/formatApiErrors";

type ConfirmState = "idle" | "loading" | "success" | "error";

export default function ConfirmEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token")?.trim() ?? "";
    const [state, setState] = useState<ConfirmState>(token ? "loading" : "error");
    const [message, setMessage] = useState(
        token ? "" : "Confirmation link is invalid or missing."
    );
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.post<{ detail: string; username?: string }>(
                    "core/confirm-email/",
                    { token }
                );
                if (cancelled) return;
                setMessage(data.detail);
                setUsername(data.username ?? null);
                setState("success");
            } catch (err: unknown) {
                if (cancelled) return;
                const ax = err as { response?: { data?: unknown } };
                setMessage(
                    ax.response?.data
                        ? formatApiErrors(ax.response.data)
                        : "Confirmation failed. The link may be expired."
                );
                setState("error");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    return (
        <Card className="w-full max-w-md border-slate-200/80 shadow-xl shadow-slate-900/10">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Email confirmation</h2>

            {state === "loading" ? (
                <p className="mt-4 text-sm text-slate-600">Confirming your email…</p>
            ) : null}

            {state === "success" ? (
                <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {message}
                    </div>
                    {username ? (
                        <p className="text-sm text-slate-600">
                            Account <strong>{username}</strong> is ready.
                        </p>
                    ) : null}
                    <LinkButton to="/login" variant="primary" size="md" className="w-full">
                        Sign in
                    </LinkButton>
                </div>
            ) : null}

            {state === "error" ? (
                <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                        {message}
                    </div>
                    <div className="flex flex-col gap-2">
                        <LinkButton to="/register" variant="primary" size="sm">
                            Register again
                        </LinkButton>
                        <Link
                            to="/login"
                            className="text-center text-sm font-medium text-brand-700 no-underline hover:underline"
                        >
                            Back to sign in
                        </Link>
                    </div>
                </div>
            ) : null}

            {state === "loading" ? (
                <Button type="button" className="mt-6 w-full" size="lg" disabled>
                    Please wait…
                </Button>
            ) : null}
        </Card>
    );
}
