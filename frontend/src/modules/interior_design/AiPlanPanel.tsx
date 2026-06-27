import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { controlClass } from "../../components/ui/inputStyles";
import { getAiStatus } from "./projects.api";
import type { AiStatusResponse, AiSuggestResponse, LayoutData } from "./types";

type Props = {
    onSuggest: (prompt: string) => Promise<AiSuggestResponse>;
    onApplyLayout: (layout: LayoutData) => void;
    lastSuggestions: string[];
};

export default function AiPlanPanel({ onSuggest, onApplyLayout, lastSuggestions }: Props) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AiSuggestResponse | null>(null);
    const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);

    useEffect(() => {
        void getAiStatus()
            .then(setAiStatus)
            .catch(() => setAiStatus({ llm_configured: false, model: null }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const data = await onSuggest(prompt.trim());
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "AI suggestion failed.");
        } finally {
            setLoading(false);
        }
    };

    const suggestions = result?.suggestions ?? lastSuggestions;

    return (
        <div className="space-y-4">
            {aiStatus ? (
                <div
                    className={
                        aiStatus.llm_configured
                            ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
                            : "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                    }
                >
                    {aiStatus.llm_configured ? (
                        <>
                            LLM connected — using <span className="font-medium">{aiStatus.model}</span> for
                            layout proposals.
                        </>
                    ) : (
                        <>
                            LLM not configured on the server. Set{" "}
                            <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code> and restart
                            Django. Basic rule-based suggestions will be used until then.
                        </>
                    )}
                </div>
            ) : null}

            <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)}>
                <label className="block text-sm font-medium text-slate-700" htmlFor="ai-prompt">
                    Describe your space or ask for a plan
                </label>
                <textarea
                    id="ai-prompt"
                    className={`${controlClass} min-h-[100px]`}
                    placeholder="e.g. Modern home office with desk near the window, or cozy Scandinavian living room with sofa..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <Button type="submit" disabled={loading || !prompt.trim()}>
                    {loading ? "Generating…" : "Get AI suggestions"}
                </Button>
            </form>

            {error ? (
                <p className="text-sm text-rose-700">{error}</p>
            ) : null}

            {result?.source ? (
                <p className="text-xs text-slate-500">
                    Generated via{" "}
                    {result.source === "llm" ? (
                        <>
                            LLM{result.model ? ` (${result.model})` : ""}
                        </>
                    ) : (
                        "built-in rules (LLM unavailable or failed)"
                    )}
                    .
                </p>
            ) : null}

            {suggestions.length > 0 ? (
                <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
                    <h3 className="text-sm font-semibold text-brand-900">Suggestions</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-brand-950">
                        {suggestions.map((s, i) => (
                            <li key={`${i}-${s.slice(0, 24)}`}>{s}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {result?.proposed_layout ? (
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onApplyLayout(result.proposed_layout)}
                    >
                        Apply proposed layout to canvas
                    </Button>
                </div>
            ) : null}

            <p className="text-xs text-slate-500">
                The AI reads your brief and current layout, then proposes furniture placement, room
                dimensions, and design tips. Apply a proposal to refine it on the floor plan tab.
            </p>
        </div>
    );
}
