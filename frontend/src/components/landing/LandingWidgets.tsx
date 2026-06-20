import { MOCK_WEATHER, PRODUCTIVITY_TIPS } from "./homeContent";
import { cn } from "../ui/cn";

function tipOfTheDay(): string {
    const day = new Date().getDate();
    return PRODUCTIVITY_TIPS[day % PRODUCTIVITY_TIPS.length];
}

type WidgetProps = {
    label: string;
    children: React.ReactNode;
    className?: string;
};

function Widget({ label, children, className }: WidgetProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm",
                "transition-shadow duration-300 hover:shadow-md",
                className
            )}
        >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <div className="mt-3">{children}</div>
        </div>
    );
}

export default function LandingWidgets() {
    const tip = tipOfTheDay();

    return (
        <section aria-label="Live insights" className="grid gap-4 sm:grid-cols-3">
            <Widget label="Weather">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-2xl font-semibold text-slate-900">{MOCK_WEATHER.tempC}°C</p>
                        <p className="mt-0.5 text-sm text-slate-600">{MOCK_WEATHER.condition}</p>
                        <p className="mt-1 text-xs text-slate-500">{MOCK_WEATHER.city}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                        <p>H {MOCK_WEATHER.highC}°</p>
                        <p>L {MOCK_WEATHER.lowC}°</p>
                    </div>
                </div>
                <p className="mt-3 text-[10px] text-slate-400">Mock data · API placeholder</p>
            </Widget>

            <Widget label="Today's productivity tip">
                <p className="text-sm leading-relaxed text-slate-700">{tip}</p>
            </Widget>

            <Widget label="System status">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-sm font-medium text-emerald-800">Online</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">All services operational</p>
            </Widget>
        </section>
    );
}
