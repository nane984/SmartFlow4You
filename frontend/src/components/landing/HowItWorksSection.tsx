import { HOW_IT_WORKS } from "./homeContent";
import { cn } from "../ui/cn";

export default function HowItWorksSection() {
    return (
        <section id="how-it-works" className="scroll-mt-24">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
                    How it works
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    From raw input to actionable output
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                    SmartFlow connects your operational data with AI-ready workflows so teams spend less
                    time on admin and more on decisions.
                </p>
            </div>

            <ol className="mt-12 grid gap-8 md:grid-cols-3">
                {HOW_IT_WORKS.map((item, index) => (
                    <li
                        key={item.step}
                        className={cn(
                            "relative text-center animate-[fadeIn_0.6s_ease-out_both]",
                            index === 1 && "[animation-delay:120ms]",
                            index === 2 && "[animation-delay:240ms]"
                        )}
                    >
                        {index < HOW_IT_WORKS.length - 1 ? (
                            <span
                                className="absolute left-[calc(50%+2.5rem)] top-8 hidden h-px w-[calc(100%-5rem)] bg-gradient-to-r from-brand-300 to-transparent md:block"
                                aria-hidden
                            />
                        ) : null}

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-teal-600 text-xl font-bold text-white shadow-lg shadow-brand-900/20">
                            {item.step}
                        </div>
                        <h3 className="mt-5 text-lg font-semibold text-slate-900">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}
