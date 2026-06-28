import { Link } from "react-router-dom";
import { cn } from "./cn";

type LogoTheme = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
    /** Link target; omit for a non-clickable logo */
    to?: string;
    theme?: LogoTheme;
    size?: LogoSize;
    /** Show SmartFlow wordmark beside the icon */
    showText?: boolean;
    className?: string;
};

const iconSizes: Record<LogoSize, string> = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-10 w-10",
};

const textSizes: Record<LogoSize, string> = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
};

function LogoMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("shrink-0", className)}
            aria-hidden
        >
            <defs>
                <linearGradient id="sf-mark-gradient" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2dd4bf" />
                    <stop offset="1" stopColor="#0d9488" />
                </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#sf-mark-gradient)" />
            <circle cx="9.5" cy="10.5" r="2" fill="white" fillOpacity="0.95" />
            <path
                d="M9.5 10.5C9.5 8 12.5 7 15.5 7C19.5 7 22.5 9 22.5 12.5C22.5 15 20 16.5 15.5 17.5C11 18.5 9.5 19.5 9.5 22C9.5 24.5 12.5 26 15.5 26C19 26 21.5 24.5 22.5 22.5"
                stroke="white"
                strokeWidth="2.25"
                strokeLinecap="round"
                fill="none"
            />
            <circle cx="22.5" cy="22.5" r="2" fill="white" fillOpacity="0.95" />
        </svg>
    );
}

export default function Logo({
    to = "/",
    theme = "light",
    size = "md",
    showText = true,
    className,
}: LogoProps) {
    const content = (
        <>
            <LogoMark className={iconSizes[size]} />
            {showText ? (
                <span
                    className={cn(
                        "font-semibold tracking-tight",
                        textSizes[size],
                        theme === "dark" ? "text-white" : "text-brand-900"
                    )}
                >
                    Smart
                    <span className={theme === "dark" ? "text-teal-300" : "text-brand-600"}>Flow</span>
                </span>
            ) : null}
        </>
    );

    const classes = cn("inline-flex items-center gap-2.5 no-underline", className);

    if (to) {
        return (
            <Link to={to} className={classes} aria-label="SmartFlow home">
                {content}
            </Link>
        );
    }

    return <span className={classes}>{content}</span>;
}

export { LogoMark };
