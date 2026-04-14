import { Link, type LinkProps } from "react-router-dom";
import { cn } from "./cn";
import type { ButtonSize, ButtonVariant } from "./Button";

const variants: Record<ButtonVariant, string> = {
    primary:
        "border border-transparent bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
    secondary:
        "border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30",
    danger:
        "border border-transparent bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40",
    ghost:
        "border border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30",
};

const sizes: Record<ButtonSize, string> = {
    sm: "rounded-lg px-3 py-1.5 text-sm font-medium",
    md: "rounded-xl px-4 py-2.5 text-sm font-medium",
    lg: "rounded-xl px-5 py-3 text-base font-medium",
};

export type LinkButtonProps = LinkProps & {
    variant?: ButtonVariant;
    size?: ButtonSize;
};

export default function LinkButton({
    className,
    variant = "primary",
    size = "md",
    ...props
}: LinkButtonProps) {
    return (
        <Link
            className={cn(
                "inline-flex cursor-pointer items-center justify-center no-underline transition-colors",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
}
