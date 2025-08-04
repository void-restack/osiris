import { Skeleton } from "@/components/ui/skeleton";

export function KnowledgeBaseCardSkeleton() {
  return (
    <section className="flex flex-col gap-y-4 relative">
      <div className="relative h-[120px]">
        <Skeleton className="h-[120px] w-full rounded-[8px]" />
        <div className="absolute bottom-4 left-4">
          <Skeleton className="size-12 rounded-[4px]" />
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Skeleton className="h-7 w-16 rounded-[6px]" />
          <Skeleton className="h-7 w-12 rounded-[6px]" />
        </div>
      </div>
      <div className="px-3">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </section>
  );
}

interface KnowledgeBaseGridSkeletonProps {
  count?: number;
}

export function KnowledgeBaseGridSkeleton({ count = 6 }: KnowledgeBaseGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <KnowledgeBaseCardSkeleton key={i} />
      ))}
    </div>
  );
}