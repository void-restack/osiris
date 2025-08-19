import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, Suspense, useState } from "react";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { knowledgeQueries, userQueries } from "@/lib/queries";
import { getAuthState } from "@/lib/auth-utils";
import type { KnowledgeBase } from "@/types";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useKnowledgeBaseTable } from "@/hooks/use-knowledge-base-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  Clock,
  MoreHorizontal,
  Eye,
  Share2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BuyKnowledgeBaseButton } from "@/components/features/knowledge-base/buy-knowledge-base-button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ICONS } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrowseKnowledgeBaseList, KnowledgeBaseGridViewColumns } from "@/components/features/knowledge-base/browse-knowledge-base-list";

const searchSchema = z.object({
  query: z.string().optional(),
  tags: z.string().optional(),
  sortBy: z.enum(["price", "rating", "credits", "installs", "recent"]).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  isPublic: z.boolean().optional(),
  startPrice: z.number().optional(),
  endPrice: z.number().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  topK: z.coerce.number().optional(),
  showOnlyMyKBs: z.coerce.boolean().optional(),
  showInstalled: z.coerce.boolean().optional(),
});

function KnowledgePageSkeleton() {
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
    <Suspense fallback={<KnowledgePageSkeleton />}>
    <RouteComponent />
    </Suspense>
  ),
  validateSearch: searchSchema,
  beforeLoad: () => {
    return {};
  },
});

function normalizeKnowledgeBase(kb: any): KnowledgeBase {
  if (kb.install && kb.knowledge_base) {
    return {
      knowledgeBaseId: kb.knowledge_base.knowledgeBaseId,
      name: kb.knowledge_base.name,
      description: kb.knowledge_base.description,
      iconUrl: kb.knowledge_base.iconUrl,
      tags: kb.knowledge_base.tags || [],
      isPublic: kb.knowledge_base.isPublic,
      publicMetadata: {
        price: kb.knowledge_base.publicMetadata?.price || 0,
        downloads: kb.knowledge_base.publicMetadata?.downloads || 0,
        rating: kb.knowledge_base.publicMetadata?.rating || 0,
        ratingCount: kb.knowledge_base.publicMetadata?.ratingCount || 0,
      },
      userId: kb.knowledge_base.userId,
      coverImageUrl: kb.knowledge_base.coverImageUrl,
      createdAt: kb.knowledge_base.createdAt,
      updatedAt: kb.knowledge_base.updatedAt,
    };
  }

  if (kb.knowledgeBase) {
    return {
      knowledgeBaseId: kb.knowledgeBase.knowledgeBaseId,
      name: kb.knowledgeBase.name,
      description: kb.knowledgeBase.description,
      iconUrl: kb.knowledgeBase.iconUrl,
      tags: kb.knowledgeBase.tags || [],
      isPublic: kb.knowledgeBase.isPublic,
      publicMetadata: {
        price: kb.knowledgeBase.publicMetadata?.price || 0,
        downloads: kb.knowledgeBase.publicMetadata?.downloads || 0,
        rating: kb.knowledgeBase.publicMetadata?.rating || 0,
        ratingCount: kb.knowledgeBase.publicMetadata?.ratingCount || 0,
      },
      userId: kb.knowledgeBase.userId,
      coverImageUrl: kb.knowledgeBase.coverImageUrl,
      createdAt: kb.knowledgeBase.createdAt,
      updatedAt: kb.knowledgeBase.updatedAt,
    };
  }

  if (kb.knowledge_bases) {
    return {
      knowledgeBaseId: kb.knowledge_bases.knowledgeBaseId,
      name: kb.knowledge_bases.name,
      description: kb.knowledge_bases.description,
      iconUrl: kb.knowledge_bases.iconUrl,
      tags: kb.knowledge_bases.tags || [],
      isPublic: kb.knowledge_bases.isPublic,
      publicMetadata: {
        price: kb.knowledge_bases.publicMetadata?.price || 0,
        downloads: kb.knowledge_bases.publicMetadata?.downloads || 0,
        rating: kb.knowledge_base_ratings?.rating || kb.knowledge_bases.publicMetadata?.rating || 0,
        ratingCount: kb.knowledge_base_ratings?.ratingCount || kb.knowledge_bases.publicMetadata?.ratingCount || 0,
      },
      userId: kb.knowledge_bases.userId,
      coverImageUrl: kb.knowledge_bases.coverImageUrl,
      createdAt: kb.knowledge_bases.createdAt,
      updatedAt: kb.knowledge_bases.updatedAt,
    };
  }

  return {
    knowledgeBaseId: kb.knowledgeBaseId,
    name: kb.name,
    description: kb.description,
    iconUrl: kb.iconUrl,
    tags: kb.tags || [],
    isPublic: kb.isPublic,
    publicMetadata: {
      price: kb.publicMetadata?.price || 0,
      downloads: kb.publicMetadata?.downloads || 0,
      rating: kb.publicMetadata?.rating || 0,
      ratingCount: kb.publicMetadata?.ratingCount || 0,
    },
    userId: kb.userId,
    coverImageUrl: kb.coverImageUrl,
    createdAt: kb.createdAt,
    updatedAt: kb.updatedAt,
  };
}

function RouteComponent() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const { isAuthenticated } = useAuth();

  const { data: popularKnowledgeBases } = useSuspenseQuery(
    knowledgeQueries.basesOptions()
  );

  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults, isPending: isSearching } = useQuery({
    queryKey: ['knowledge-base', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const response = await queryClient.ensureQueryData(knowledgeQueries.searchOptions({
        query: searchQuery,
        page: 1,
        limit: 10
      }));
      
      const grouped = new Map<string, {
        knowledgeBase: any;
        units: any[];
      }>();
      
      response.data.forEach((result: any) => {
        const kbId = result.knowledge_bases?.knowledgeBaseId;
        if (!kbId) return;
        
        if (!grouped.has(kbId)) {
          grouped.set(kbId, {
            knowledgeBase: result.knowledge_bases,
            units: []
          });
        }
        grouped.get(kbId)!.units.push(result);
      });
      
      return Array.from(grouped.values()).map(group => ({
        value: group.knowledgeBase.knowledgeBaseId,
        label: group.knowledgeBase.name,
        ...group
      }));
    },
    enabled: searchQuery.length >= 2,
  });

  const searchKnowledgeBases = async (query: string) => {
    setSearchQuery(query);
    return searchResults || [];
  };

  const normalizedPopularKnowledgeBases = useMemo(() => {
    return (popularKnowledgeBases?.data || []).map(normalizeKnowledgeBase);
  }, [popularKnowledgeBases]);

  const handleShare = (kb: KnowledgeBase) => {
    const url = `${window.location.origin}/knowledge/${kb.knowledgeBaseId}`;
    navigator.clipboard.writeText(url);
    toast.success("Knowledge Base URL copied to clipboard");
  };

  const tableColumns = useMemo<ColumnDef<KnowledgeBase>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Knowledge Base" />
        ),
        cell: ({ row }) => {
          const kb = row.original;
          return (
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-8 rounded-md shrink-0">
                <AvatarImage src={kb.iconUrl || undefined} alt={kb.name} />
                <AvatarFallback className="rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                  {kb.name?.charAt(0).toUpperCase() || "K"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-[300px]">
                <span className="font-medium text-sm text-primary-800 truncate">
                  {kb.name}
                </span>
              </div>
            </div>
          );
        },
        enableSorting: false,
        meta: {
          variant: "text",
          label: "Knowledge Base name",
          placeholder: "Search knowledge bases...",
        },
      },
      {
        id: "description",
        accessorKey: "description",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const kb = row.original;
          return (
            <p className="text-xs text-primary-400 max-w-[200px] w-full truncate">
              {kb.description}
            </p>
          );
        },
      },
      {
        id: "price",
        accessorFn: (row) => row.publicMetadata?.price || 0,
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Price" />
        ),
        cell: ({ row }) => {
          const kb = row.original;
          const price = kb?.publicMetadata?.price;

          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize text-xs">
                {price === 0 ? "Free" : `${price} credits`}
              </Badge>
            </div>
          );
        },
        enableSorting: true,
        meta: {
          variant: "select",
          label: "Price",
          options: [
            { label: "Free", value: "0" },
            { label: "Paid", value: "1" }
          ],
        },
      },
      {
        id: "rating",
        accessorFn: (row) => row.publicMetadata?.rating || 0,
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Rating" />
        ),
        cell: ({ row }) => {
          const kb = row.original;
          const rating = kb?.publicMetadata?.rating || 0;
          const ratingCount = kb?.publicMetadata?.ratingCount || 0;

          return (
            <div className="flex items-center gap-1">
              <span className="text-sm text-primary-600">
                {rating.toFixed(1)} ({ratingCount})
              </span>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "updatedAt",
        accessorFn: (row) => new Date(row.updatedAt),
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const updatedAt = row.getValue("updatedAt") as string;
          const date = new Date(updatedAt);
          const now = new Date();
          const diffInDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
          );

          return (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary-400" />
              <span className="text-sm text-primary-600">
                {diffInDays === 0
                  ? "Today"
                  : diffInDays === 1
                    ? "Yesterday"
                    : `${diffInDays}d ago`}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-2 md:pr-6">Actions</div>,
        cell: ({ row }) => {
          const kb = row.original;
          return (
            <div className="w-full flex items-end justify-end pr-2 md:pr-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/knowledge/${kb.knowledgeBaseId}`}>
                      <Eye className="h-3 w-3 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BuyKnowledgeBaseButton kb={kb} />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(kb)}>
                    <Share2 className="h-3 w-3 mr-2" />
                    Copy URL
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleShare]
  );

  const activeColumns = useMemo(() => {
    return viewMode === "grid" ? KnowledgeBaseGridViewColumns : tableColumns;
  }, [viewMode, tableColumns]);

  const { table, isLoading, isFetching } = useKnowledgeBaseTable({
    columns: activeColumns,
    initialPageSize: 9,
  });

  return (
    <div className="flex flex-1 flex-col pt-4">
      {/* Header */}
      <div className="mx-auto mt-8 max-w-[496px] pb-6 text-center md:w-[496px]">
        <h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
          Discover Knowledge Bases
        </h2>
        <span className="text-primary-300 text-sm">
          Browse and explore knowledge bases for AI applications
        </span>
      </div>

      {/* Search Autocomplete */}
      <div className="w-full px-4 mb-18 md:px-0">
        <Autocomplete
          className="mt-6"
          onSearch={searchKnowledgeBases}
          getItemValue={(item) => item.value}
          getItemLabel={(item) => item.label}
          emptyText={isSearching ? "Searching..." : "No knowledge bases found."}
          footerText="Explore knowledge bases"
          bottomLeftContent={
            <div className="flex items-center gap-3">
              {normalizedPopularKnowledgeBases.slice(0, 3).map((kb: { knowledgeBaseId: string; name: string }) => (
                <Link to={`/knowledge/${kb.knowledgeBaseId}`} key={kb.knowledgeBaseId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs">
                  {kb.name}
                </Link>
              ))}
            </div>
          }
          bottomRightContent={<></>}
          popularItems={
            <div className="flex w-full gap-2">
              {normalizedPopularKnowledgeBases.slice(0, 3).map((kb: { knowledgeBaseId: string; name: string }) => (
                <Link to={`/knowledge/${kb.knowledgeBaseId}`} key={kb.knowledgeBaseId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs">
                  {kb.name}
                </Link>
              ))}
            </div>
          }
          renderItem={(item) => (
            <div className="w-full">
              <div className="flex items-center space-x-2 mb-2">
                {item.knowledgeBase.iconUrl ? (
                  <img
                    src={item.knowledgeBase.iconUrl}
                    alt={item.knowledgeBase.name}
                    className="size-4 rounded-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="size-4 rounded-md bg-blue-400 flex-shrink-0" />
                )}
                <span className="flex-shrink-0 font-medium">{item.knowledgeBase.name}</span>
                <span className="flex-shrink-0 text-gray-500">-</span>
                <span className="text-primary-400 truncate flex-1 min-w-0">{item.knowledgeBase.description || ''}</span>
              </div>
            </div>
          )}
          onSelect={(item) => {
            window.location.href = `/knowledge/${item.value}`;
          }}
        />
      </div>

      {/* Knowledge Base Table */}
      <div className="px-4 md:px-6 mb-20">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="space-y-4">
            <div className="flex w-full gap-4 md:items-center md:justify-between flex-col md:flex-row border-b border-b-primary-100 pb-4 px-4">
              <div className="flex items-center gap-2">
                <span className="text-xl text-primary-800 font-medium whitespace-nowrap">
                  All Knowledge Bases
                </span>
                {isFetching && !isLoading && (
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  </div>
                )}
              </div>

              <div className="flex w-full items-center justify-end gap-2">
                <DataTableToolbar className="w-full" table={table} />
                <ToggleGroup
                  className="rounded-[6px] bg-[#F5F5F5] p-[2px] h-8"
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => setViewMode(value as "table" | "grid")}
                >
                  <ToggleGroupItem
                    value="table"
                    className={cn(
                      "hover:!bg-white/90 h-full",
                      viewMode === "table"
                        ? "!bg-white data-[state=on]:!bg-white"
                        : "!bg-transparent"
                    )}
                  >
                    <ICONS.list
                      stroke={viewMode === "table" ? "#000000" : "#A3A3A3"}
                    />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="grid"
                    className={cn(
                      "hover:!bg-white/90 h-full",
                      viewMode === "grid"
                        ? "!bg-white data-[state=on]:!bg-white"
                        : "!bg-transparent"
                    )}
                  >
                    <ICONS.directory
                      stroke={viewMode === "grid" ? "#000000" : "#A3A3A3"}
                    />
                  </ToggleGroupItem>
                </ToggleGroup>
                {isAuthenticated && (
                  <Link to="/knowledge/new">
                    <Button size="sm">
                      <Plus className="h-3 w-3 mr-2" />
                      Create Knowledge Base 
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {viewMode === "table" ? (
              <ScrollArea className="relative h-[calc(100vh-560px)] hidebar overflow-y-auto hidebar px-4">
                <div className="w-full hidebar pb-8">
                  <DataTable table={table} />
                </div>
              </ScrollArea>
            ) : (
              <BrowseKnowledgeBaseList rows={table.getPaginationRowModel().rows} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom pagination */}
      <div className="absolute bottom-0 border-t border-t-primary-100 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 p-6">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
