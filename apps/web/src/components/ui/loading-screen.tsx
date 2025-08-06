import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
    message?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function LoadingScreen({
    message = "Loading...",
    className,
    size = "md"
}: LoadingScreenProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12"
    };

    return (
        <div className={cn(
            "flex flex-col items-center justify-center min-h-[200px] gap-4",
            className
        )}>
            <div className="flex items-center gap-3">
                <Loader2 className={cn("animate-spin text-primary-600", sizeClasses[size])} />
                <span className="text-lg font-medium text-primary-700">
                    {message}
                </span>
            </div>
            <div className="w-32 h-1 bg-primary-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full animate-pulse" />
            </div>
        </div>
    );
}

export function FullPageLoadingScreen({ message }: { message?: string }) {
    return (
        <></>
    );
}