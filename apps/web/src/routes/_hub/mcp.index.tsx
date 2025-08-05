import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, Suspense } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Autocomplete } from "@/components/ui/autocomplete";
import { packageQueries, userQueries } from "@/lib/queries";
import { isAuthenticated } from "@/lib/auth-optimized";
import type { Package, PackageWithUserStatus } from "@/types";
import { McpTableComponent } from "@/components/features/mcp-list/mcp-table-component";
import { McpListSkeleton } from "@/components/skeletons/mcp-skeleton";

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
            <McpListSkeleton count={6} />
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
    const authenticated = isAuthenticated();
    return { authenticated };
  },
  loader: async ({ context: { queryClient } }) => {
    // Check auth state again in loader (since beforeLoad might not pass data as expected)
    const authenticated = isAuthenticated();

    // Always fetch popular packages for autocomplete (public data)
    await queryClient.ensureQueryData(packageQueries.popularOptions());

    // Only fetch user-specific data if authenticated
    if (authenticated) {
      // Fetch user's installed MCPs
      await queryClient.ensureQueryData(packageQueries.userInstalledOptions());
      // Fetch user's deployed MCPs  
      await queryClient.ensureQueryData(packageQueries.userDeploymentsOptions());
      // Fetch user info
      await queryClient.ensureQueryData(userQueries.meOptions());
    }

    return { breadcrumb: "MCP Packages", authenticated };
  },
});

function normalizePackage(pkg: any): Package {

  if (pkg.type && pkg.url && pkg.packageId) {
    const normalized = {
      packageId: pkg.packageId,
      name: pkg.name,
      description: pkg.description,
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
    packageId: pkg.packageId,
    name: pkg.name,
    description: pkg.description,
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
  const search = Route.useSearch();
  const { authenticated: isAuth } = Route.useLoaderData();

  const { data: packageData, isPending } = useQuery({
    ...packageQueries.listOptions({
      publisherId: search?.publisherId,
      name: search?.name,
      search: search?.name || search?.description || search?.search,
      page: search?.page || 1,
      limit: Math.min(search?.perPage || 10, 10),
    }),
  });

  // Conditionally fetch user data only if authenticated
  const { data: userInstalled } = useQuery({
    ...packageQueries.userInstalledOptions(isAuth),
    enabled: isAuth,
  });

  const { data: userDeployments } = useQuery({
    ...packageQueries.userDeploymentsOptions(isAuth),
    enabled: isAuth,
  });

  const { data: popularPackages } = useSuspenseQuery(
    packageQueries.popularOptions()
  );

  const packages = useMemo(() => {
    if (!packageData?.data) return [];

    const allPackages = packageData.data;
    const normalizedPackages: Package[] = allPackages.map(normalizePackage);

    // Only process user data if authenticated and data is available
    const installedMap = new Map(
      isAuth && userInstalled ? userInstalled.map((item: any) => [item.packageId, item]) : []
    );

    const deployedMap = new Map(
      isAuth && userDeployments ? userDeployments.map((item: any) => [item.package.packageId, item]) : []
    );

    const combined: PackageWithUserStatus[] = normalizedPackages.map(pkg => ({
      ...pkg,
      // For non-authenticated users, these will always be false
      isInstalled: isAuth ? installedMap.has(pkg.packageId) : false,
      isDeployed: isAuth ? deployedMap.has(pkg.packageId) : false,
      userInstallation: isAuth ? installedMap.get(pkg.packageId) as any : undefined,
      userDeployment: isAuth ? deployedMap.get(pkg.packageId) as any : undefined,
    }));

    return combined;
  }, [packageData, userInstalled, userDeployments, isAuth]);

  const searchPackages = (query: string) => {
    const filtered = packages
      .filter((pkg) =>
        pkg.name.toLowerCase().includes(query.toLowerCase()) ||
        (pkg.metadata?.tags || []).some((tag: string) =>
          tag.toLowerCase().includes(query.toLowerCase())
        )
      )
      .slice(0, 10);

    return filtered.map(pkg => ({
      ...pkg,
      value: pkg.packageId,
      label: pkg.name
    }));
  };

  const normalizedPopularPackages = useMemo(() => {
    return (popularPackages || []).map(normalizePackage);
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
      <div className="w-full px-4 mb-8 md:px-0">
        <Autocomplete
          className="mt-6"
          onSearch={searchPackages}
          getItemValue={(item) => item.packageId}
          getItemLabel={(item) => item.name}
          emptyText="No packages found."
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
              {item.isInstalled && <span className="text-green-600">✓</span>}
              <span className="flex-shrink-0"> - </span>
              <span className="text-primary-400 truncate flex-1 min-w-0">{item.description}</span>
            </Link>
          )}
          onSelect={(item) => {
            window.location.href = `/mcp/${item.packageId}`;
          }}
        />
      </div>

      {/* Table Component - Isolated from page re-renders */}
      <McpTableComponent
        data={packages}
        pageCount={(packageData as any)?.pagination?.totalPages || 1}
        isLoading={isPending}
      />
    </div>
  );
}
