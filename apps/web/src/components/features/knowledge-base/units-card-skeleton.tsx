import { Skeleton } from "@/components/ui/skeleton";

export function UnitsCardSkeleton() {
  return (
    <div className="relative h-[200px] border-2 border-[#F5F5F5] rounded-[12px]">
      <div className="p-2.5 py-4 h-[87px]">
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      <div className="absolute h-[113px] w-full bottom-0 flex flex-col justify-between overflow-hidden">
        <img src="/union.svg" alt="" className="absolute w-full inset-0 w-fit" />
        
        <div className="relative z-10 px-4 py-1 h-full flex items-center mt-5">
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        <div className="relative z-10 flex items-center justify-between py-2.5 px-[14px] border-t border-t-primary-100">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-3 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

interface UnitsGridSkeletonProps {
  count?: number;
}

export function UnitsGridSkeleton({ count = 8 }: UnitsGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
      {Array.from({ length: count }).map((_, i) => (
        <UnitsCardSkeleton key={i} />
      ))}
    </div>
  );
}