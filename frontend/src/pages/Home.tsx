import { useCallback, useRef } from "react";
import FeatureCard from "../components/landing/FeatureCard";
import HeroSection from "../components/landing/HeroSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import LandingFooter from "../components/landing/LandingFooter";
import LandingWidgets from "../components/landing/LandingWidgets";
import { FEATURES } from "../components/landing/homeContent";

/**
 * Public marketing landing page — uses PublicLayout + PublicNavbar (not private Layout).
 */
export default function Home() {
    const featuresRef = useRef<HTMLElement>(null);

    const scrollToFeatures = useCallback(() => {
        featuresRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    return (
        <div className="space-y-20 pb-8">
            <HeroSection onExploreDemo={scrollToFeatures} />

            <div className="mx-auto max-w-6xl space-y-20 px-4 sm:px-6 lg:px-8">
                <section ref={featuresRef} id="features" className="scroll-mt-28 space-y-10">
                    <div className="text-center">
                        <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
                            Platform modules
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Everything your team needs to operate
                        </h2>
                        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                            Three integrated domains — procurement, people, and productivity — designed to
                            scale with your organization.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {FEATURES.map((feature, index) => (
                            <FeatureCard
                                key={feature.id}
                                title={feature.title}
                                description={feature.description}
                                icon={feature.icon}
                                accent={feature.accent}
                                className={
                                    index === 1
                                        ? "[animation-delay:100ms]"
                                        : index === 2
                                          ? "[animation-delay:200ms]"
                                          : undefined
                                }
                            />
                        ))}
                    </div>
                </section>

                <section id="pricing" className="scroll-mt-28">
                    <LandingWidgets />
                </section>

                <HowItWorksSection />
            </div>

            <LandingFooter />
        </div>
    );
}
