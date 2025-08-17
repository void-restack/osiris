import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, Suspense, useState } from "react";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Autocomplete } from "@/components/ui/autocomplete";
import { packageQueries, userQueries } from "@/lib/queries";
import { getAuthState } from "@/lib/auth-utils";
import type { Package } from "@/types";
import { PackagesTable } from "@/components/features/packages-table/packages-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

const searchSchema = z.object({
  publisherId: z.string().optional(),
  name: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional()
});

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

    // Always fetch popular packages for autocomplete (public data)
    await queryClient.ensureQueryData(packageQueries.popularOptions());

    // Only fetch user-specific data if authenticated
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
  // const search = Route.useSearch();
  // const { auth } = Route.useLoaderData();
  const [packagesTable, setPackagesTable] = useState<any>(null);
  const queryClient = useQueryClient();

  // const { data: packageData, isPending } = useQuery({
  //   ...packageQueries.listOptions({
  //     publisherId: search?.publisherId,
  //     name: search?.name,
  //     search: search?.name || search?.description || search?.search,
  //     page: search?.page || 1,
  //     limit: Math.min(search?.perPage || 10, 10),
  //   }),
  // });

  // const { data: userInstalled } = useQuery({
  //   ...packageQueries.userInstalledOptions(auth.isAuthenticated),
  //   enabled: auth.isAuthenticated,
  // });

  // const { data: userDeployments } = useQuery({
  //   ...packageQueries.userDeploymentsOptions(auth.isAuthenticated),
  //   enabled: auth.isAuthenticated,
  // });

  const { data: popularPackages } = useSuspenseQuery(
    packageQueries.popularOptions()
  );

  // const packages = useMemo(() => {
  //   if (!packageData?.data) return [];

  //   const allPackages = packageData.data;
  //   const normalizedPackages: Package[] = allPackages.map(normalizePackage);

  //   const installedMap = new Map(
  //     auth.isAuthenticated && userInstalled ? userInstalled.map((item: any) => [item.packageId, item]) : []
  //   );

  //   const deployedMap = new Map(
  //     auth.isAuthenticated && userDeployments ? userDeployments.map((item: any) => [item.package.packageId, item]) : []
  //   );

  //   return normalizedPackages;
  // }, [packageData, userInstalled, userDeployments, auth.isAuthenticated]);

  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults, isPending: isSearching } = useQuery({
    queryKey: ['packages', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const response = await queryClient.ensureQueryData(packageQueries.listOptions({
        search: searchQuery,
        page: 1,
        limit: 10
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

      {/* New Packages Table */}
      <div className="px-4 md:px-6">
        <PackagesTable
          onTableReady={(table) => {
            setPackagesTable(table);
          }}
        />
      </div>

      <div className="absolute bottom-0 border-t border-t-primary-100 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 p-6">
        {packagesTable && <DataTablePagination table={packagesTable} />}
      </div>
    </div>
  );
}
