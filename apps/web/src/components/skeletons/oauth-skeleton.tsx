import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OAuthClientCardSkeleton() {
    return (
        <div className="min-h-[200px] p-4 inset-shadow-card rounded-xl bg-primary-00 opacity-100 min-w-[348px] overflow-hidden">
            <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col items-start gap-3 min-w-0 flex-1">
                    <Skeleton className="size-12 rounded-sm" />
                    <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
            </div>

            <div className="space-y-1">
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
            </div>
        </div>
    );
}

export function OAuthClientGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <ScrollArea className="relative h-[calc(100vh-560px)] hidebar">
            <div className="grid w-full gap-6 p-2 pb-24 sm:pb-28 hidebar [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
                {Array.from({ length: count }).map((_, i) => (
                    <OAuthClientCardSkeleton key={i} />
                ))}
            </div>
        </ScrollArea>
    );
}

export function OAuthClientTableSkeleton() {
    return (
        <ScrollArea className="relative h-[calc(100vh-560px)] hidebar overflow-y-auto">
            <div className="w-full hidebar pb-8">
                <div className="rounded-md border overflow-x-auto w-full max-[698px]:w-[612px] max-sm:w-[560px]">
                    <div className="w-full">
                        {/* Table Header */}
                        <div className="border-b">
                            <div className="flex items-center h-10 px-4">
                                <Skeleton className="h-4 w-32 mr-4" />
                                <Skeleton className="h-4 w-24 mr-4" />
                                <Skeleton className="h-4 w-20 mr-4" />
                                <Skeleton className="h-4 w-16 mr-4" />
                                <div className="ml-auto">
                                    <Skeleton className="h-4 w-12" />
                                </div>
                            </div>
                        </div>

                        {/* Table Rows */}
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center h-[56px] px-4 border-b">
                                <div className="flex items-center gap-3 mr-4">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-36" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-20 rounded-full mr-4" />
                                <Skeleton className="h-4 w-24 mr-4" />
                                <Skeleton className="h-4 w-16 mr-4" />
                                <div className="ml-auto">
                                    <Skeleton className="h-8 w-20 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}

export function OAuthClientDetailSkeleton() {
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
                    <div key={i} className="p-4 rounded-lg border">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <OAuthClientTableSkeleton />
        </div>
    );
}
