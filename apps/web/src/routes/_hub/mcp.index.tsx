import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, Suspense, useState } from "react";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { packageQueries, userQueries } from "@/lib/queries";
import { getAuthState } from "@/lib/auth-utils";
import type { Package, PackageList } from "@/types";
import { PackagesTable } from "@/components/features/packages-table/packages-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { usePackagesTable } from "@/hooks/use-packages-table";
import { gridViewColumns } from "@/components/features/packages-table/packages-grid-view";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  Download,
  Clock,
  Cpu,
  MoreHorizontal,
  Eye,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const searchSchema = z.object({
  publisherId: z.string().optional(),
  name: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional()
});

const PACKAGE_TYPES = [
  { label: "MCP Package", value: "mcp", icon: Cpu },
] as const;

function McpPageSkeleton() {
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

export const Route = createFileRoute("/_hub/mcp/")({
  shouldReload: false,
  component: () => (
    <Suspense fallback={<McpPageSkeleton />}>
      <RouteComponent />
    </Suspense>
  ),
  validateSearch: searchSchema,
  beforeLoad: () => {
    return {};
  },
  loader: async ({ context: { queryClient } }) => {
    const auth = await getAuthState(queryClient);

    await queryClient.ensureQueryData(packageQueries.popularOptions());

    if (auth.isAuthenticated) {
      // Fetch user's installed MCPs
      await queryClient.ensureQueryData(packageQueries.userInstalledOptions());
      // Fetch user's deployed MCPs  
      await queryClient.ensureQueryData(packageQueries.userDeploymentsOptions());
      // Fetch user info
      await queryClient.ensureQueryData(userQueries.meOptions());
    }

    return { breadcrumb: "MCP Packages", auth };
  },
});

function normalizePackage(pkg: any): Package {
  if (pkg.type && pkg.url && pkg.packageId) {
    const normalized = {
      packageId: pkg.packageId,
      name: pkg.name,
      description: pkg.description,
      shortDescription: pkg.shortDescription,
      publisherId: pkg.publisherId,
      latestVersion: pkg.latestVersion,
      iconUrl: pkg.iconUrl,
      coverImageUrl: pkg.coverImageUrl,
      paymentConfig: pkg.paymentConfig,
      type: pkg.type,
      url: pkg.url,
      isActive: true,
    };
    return normalized;
  }

  if (pkg.packageName) {
    const normalized = {
      packageId: pkg.packageId,
      name: pkg.packageName,
      description: pkg.packageDescription,
      shortDescription: pkg.shortDescription,
      publisherId: pkg.publisherId || '',
      latestVersion: pkg.packageLatestVersion,
      iconUrl: pkg.packageIconUrl,
      coverImageUrl: pkg.packageCoverImageUrl,
      paymentConfig: pkg.paymentConfig,
      isActive: true,
    };
    return normalized;
  }

  const normalized = {
    packageId: pkg.id,
    name: pkg.name,
    description: pkg.description,
    shortDescription: pkg.shortDescription,
    publisherId: pkg.publisherId,
    latestVersion: pkg.latestVersion,
    metadata: pkg.metadata,
    createdAt: pkg.createdAt,
    updatedAt: pkg.updatedAt,
    isActive: true,
  };
  return normalized;
}

function RouteComponent() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

  const { data: popularPackages } = useSuspenseQuery(
    packageQueries.popularOptions()
  );

  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults, isPending: isSearching } = useQuery({
    queryKey: ['packages', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const response = await queryClient.ensureQueryData(packageQueries.listOptions({
        search: searchQuery,
        page: 1,
        limit: 12
      }));
      return (response.data || []).map((pkg: any) => ({
        ...pkg,
        value: pkg.packageId,
        label: pkg.name
      }));
    },
    enabled: searchQuery.length >= 2,
  });

  const searchPackages = async (query: string) => {
    setSearchQuery(query);
    return searchResults || [];
  };

  const normalizedPopularPackages = useMemo(() => {
    return (popularPackages?.data || []).map(normalizePackage);
  }, [popularPackages]);

  const handleInstall = (pkg: PackageList) => {
    const name = pkg.name || (pkg as any).packageName;
    toast.success(`Installing ${name}...`);
  };

  const handleShare = (pkg: PackageList) => {
    const url = pkg.url || (pkg as any).packageUrl;
    navigator.clipboard.writeText(url);
    toast.success("Package URL copied to clipboard");
  };

  const tableColumns = useMemo<ColumnDef<PackageList>[]>(
    () => [
      {
        id: "search",
        accessorKey: "name",
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Package" />
        ),
        cell: ({ row }) => {
          const pkg = row.original;
          return (
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-8 rounded-md shrink-0">
                <AvatarImage
                  src={pkg.iconUrl || (pkg as any).packageIconUrl || undefined}
                  alt={pkg.name || (pkg as any).packageName}
                />
                <AvatarFallback className="rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                  {(pkg.name || (pkg as any).packageName)?.charAt(0).toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-[300px]">
                <span className="font-medium text-sm text-primary-800 truncate">
                  {pkg.name || (pkg as any).packageName}
                </span>
              </div>
            </div>
          );
        },
        enableSorting: false,
        meta: {
          variant: "text",
          label: "Package name",
          placeholder: "Search packages...",
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
          const pkg = row.original;
          return (
            <p className="text-xs text-primary-400 max-w-[200px] w-full truncate">
              {pkg.shortDescription || pkg.description || (pkg as any).packageDescription}
            </p>
          );
        },
      },
      {
        id: "type",
        accessorKey: "type",
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          const typeConfig = PACKAGE_TYPES.find(t => t.value === type);

          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize text-xs">
                {typeConfig?.label}
              </Badge>
            </div>
          );
        },
        enableSorting: false,
        meta: {
          variant: "multiSelect",
          label: "Package type",
          options: PACKAGE_TYPES.map(type => ({
            label: type.label,
            value: type.value,
            icon: type.icon
          })),
        },
      },
      {
        id: "version",
        accessorKey: "latestVersion",
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Version" />
        ),
        cell: ({ row }) => {
          const pkg = row.original;
          const version = pkg.latestVersion || (pkg as any).packageLatestVersion;
          return (
            <Badge variant="outline" className="font-mono text-xs">
              v{version}
            </Badge>
          );
        },
      },
      {
        id: "pricing",
        accessorFn: (row) => row.paymentConfig ? "Paid" : "Free",
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Pricing" />
        ),
        cell: ({ row }) => {
          const paymentConfig = row.original.paymentConfig;
          return (
            <Badge variant="secondary" className="text-xs uppercase">
              {paymentConfig ? "Paid" : "Free"}
            </Badge>
          );
        },
        enableSorting: false,
        meta: {
          variant: "select",
          label: "Pricing",
          options: [
            { label: "Free", value: "Free" },
            { label: "Paid", value: "Paid" }
          ],
        },
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        enableSorting: false,
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
                    : `${diffInDays}d ago`
                }
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-2 md:pr-6">Actions</div>,
        cell: ({ row }) => {
          const pkg = row.original;
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
                    <Link to={`/mcp/${pkg.packageId}`}>
                      <Eye className="h-3 w-3 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleInstall(pkg)}>
                    <Download className="h-3 w-3 mr-2" />
                    Deploy Package
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(pkg)}>
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
    [handleInstall, handleShare]
  );

  const activeColumns = useMemo(() => {
    return viewMode === "grid" ? gridViewColumns : tableColumns;
  }, [viewMode, tableColumns]);

  const { table, isLoading, isFetching } = usePackagesTable({
    columns: activeColumns,
    initialPageSize: 12,
    customFilters: {},
  });

  return (
    <div className="flex flex-1 flex-col pt-4">
      {/* Header */}
      <div className="mx-auto mt-8 max-w-[496px] pb-6 text-center md:w-[496px]">
        <h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
          Discover MCP Packages
        </h2>
        <span className="text-primary-300 text-sm">
          Browse and install Model Context Protocol packages
        </span>
      </div>

      {/* Search Autocomplete */}
      <div className="w-full px-4 mb-18 md:px-0">
        <Autocomplete
          className="mt-6"
          onSearch={searchPackages}
          getItemValue={(item) => item.packageId}
          getItemLabel={(item) => item.name}
          emptyText={isSearching ? "Searching..." : "No packages found."}
          footerText="Explore packages"
          bottomLeftContent={
            <div className="flex items-center gap-3">
              {normalizedPopularPackages.slice(0, 3).map((pkg: { packageId: string; name: string }) => (
                <Link to={`/mcp/${pkg.packageId}`} key={pkg.packageId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs">
                  {pkg.name}
                </Link>
              ))}
            </div>
          }
          bottomRightContent={<></>}
          popularItems={
            <div className="flex w-full gap-2">
              {normalizedPopularPackages.slice(0, 3).map((pkg: { packageId: string; name: string }) => (
                <Link to={`/mcp/${pkg.packageId}`} key={pkg.packageId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs">
                  {pkg.name}
                </Link>
              ))}
            </div>
          }
          renderItem={(item) => (
            <Link to={`/mcp/${item.packageId}`} className="flex items-center space-x-2 w-full">
              {item.iconUrl ? (
                <img
                  src={item.iconUrl}
                  alt={item.name}
                  className="size-4 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="size-4 rounded-md bg-blue-400 flex-shrink-0" />
              )}
              <span className="flex-shrink-0">{item.name}</span>
              <span className="flex-shrink-0"> - </span>
              <span className="text-primary-400 truncate flex-1 min-w-0">{item.shortDescription || item.description}</span>
            </Link>
          )}
          onSelect={(item) => {
            window.location.href = `/mcp/${item.packageId}`;
          }}
        />
      </div>

      {/* Packages Table */}
      <div className="px-4 md:px-6 mb-20">
        <PackagesTable
          table={table}
          isLoading={isLoading}
          isFetching={isFetching}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          title="All MCPs"
        />
      </div>

      {/* Bottom pagination */}
      <div className="absolute bottom-0 z-40 border-t border-t-primary-100 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 p-6">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
