import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthMethodCardSkeleton() {
    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-12 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>
            </CardContent>
        </Card>
    );
}

export function AuthMethodGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <AuthMethodCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function AuthMethodTableSkeleton() {
    return (
        <div className="space-y-4">
            {/* Table Header */}
            <div className="flex items-center gap-4 px-4 py-3 border-b">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <div className="ml-auto">
                    <Skeleton className="h-4 w-12" />
                </div>
            </div>

            {/* Table Rows */}
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-36" />
                        </div>
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <div className="ml-auto">
                        <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function AuthDetailSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <AuthMethodTableSkeleton />
        </div>
    );
}