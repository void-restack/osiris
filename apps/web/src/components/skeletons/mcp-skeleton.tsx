import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function McpCardSkeleton() {
    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-12 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function McpListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <McpCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function McpTableSkeleton() {
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
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <div className="ml-auto">
                        <Skeleton className="h-8 w-16 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function McpDetailHeaderSkeleton() {
    return (
        <section className="w-full">
            <div className="flex w-full flex-col gap-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-20" />
                                <span className="text-primary-300">•</span>
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-20 rounded-md" />
                        <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                </div>
            </div>
        </section>
    );
}