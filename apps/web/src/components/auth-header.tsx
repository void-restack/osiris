import { Suspense } from "react";
import { useReactiveAuth } from "@/lib/auth-optimized";
import { UserPopover } from "./user-popover";
import { LoginButton } from "./login-button";
import { Skeleton } from "./ui/skeleton";
import { AuthErrorBoundary } from "./auth-error-boundary";

/**
 * Conditional header component that shows either UserPopover or LoginButton
 * Uses reactive auth for real-time updates when auth state changes
 */
export function AuthHeader() {
    const authenticated = useReactiveAuth();

    if (authenticated) {
        return (
            <AuthErrorBoundary fallback={<LoginButton />}>
                <Suspense fallback={<AuthHeaderSkeleton />}>
                    <UserPopover />
                </Suspense>
            </AuthErrorBoundary>
        );
    }

    return <LoginButton />;
}

/**
 * Loading skeleton for auth header
 */
function AuthHeaderSkeleton() {
    return (
        <div className="flex h-12 cursor-pointer items-center justify-start rounded-[8px] border border-primary-100 border-dashed bg-white animate-pulse">
            <div className="flex items-center gap-3 px-3">
                <Skeleton className="rounded-sm bg-gray-200 size-8" />
                <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-20 bg-gray-200" />
                    <Skeleton className="h-3 w-24 bg-gray-100" />
                </div>
            </div>
        </div>
    );
}