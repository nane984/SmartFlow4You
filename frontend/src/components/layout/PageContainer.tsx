import type { HTMLAttributes } from "react";
import { cn } from "../ui/cn";

export default function PageContainer({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
