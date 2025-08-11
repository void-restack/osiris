import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { z } from "zod";
import { isAuthenticated } from "@/lib/auth-optimized";
import { KnowledgeBaseListContainer } from "@/components/features/knowledge-base/browse-knowledge-base-list-containter";
import { KnowledgeBaseGridSkeleton } from "@/components/features/knowledge-base/knowledge-base-card-skeleton";

const searchSchema = z.object({
  query: z.string().optional(),
  tags: z.string().optional(),
  sortBy: z.enum(['rating', 'credits', 'installs', 'price', 'recent']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isPublic: z.boolean().optional(),
  startPrice: z.number().optional(),
  endPrice: z.number().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  topK: z.coerce.number().optional(),
  showOnlyMyKBs: z.coerce.boolean().optional(),
  showInstalled: z.coerce.boolean().optional(),
});

function KnowledgeBasePageSkeleton() {
  return (
    <div>
      <div className="flex flex-1 flex-col pt-4">
        {/* Header Skeleton */}
        <div className="mx-auto mt-8 max-w-[496px] pb-6 text-center md:w-[496px] space-y-4">
          <div className="h-6 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-4 bg-gray-100 rounded-md animate-pulse w-3/4 mx-auto" />
        </div>

        {/* Search Skeleton */}
        <div className="w-full px-4 mb-14 md:px-0">
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse max-w-md mx-auto mt-6" />
        </div>

        {/* Content Skeleton */}
        <div className="px-4 md:px-6">
          <div className="flex w-full items-center justify-between border-b border-b-primary-100 px-6 py-4">
            <div className="h-6 bg-gray-200 rounded-md animate-pulse w-40" />
            <div className="flex items-center gap-4">
              <div className="h-8 bg-gray-100 rounded-md animate-pulse w-24" />
              <div className="h-8 bg-gray-100 rounded-md animate-pulse w-20" />
            </div>
          </div>
          <div className="p-6">
            <div className="h-10 bg-gray-100 rounded-md animate-pulse mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_hub/knowledge/")({
  shouldReload: false,
  component: () => (
    <Suspense fallback={<KnowledgeBasePageSkeleton />}>
      <RouteComponent />
    </Suspense>
  ),
  validateSearch: searchSchema,
  beforeLoad: () => {
    const authenticated = isAuthenticated();
    return { authenticated };
  },
  loader: async () => {
    // No need to fetch data here anymore - it's handled by the list container
    return { breadcrumb: "Knowledge Bases" };
  },
});

function RouteComponent() {
  return (
    <div className="flex flex-1 flex-col pt-4">
      <KnowledgeBaseListContainer />
    </div>
  );
}
