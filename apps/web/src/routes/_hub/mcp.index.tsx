import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useEffect } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Autocomplete } from "@/components/ui/autocomplete";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { packageQueries, userQueries } from "@/lib/queries";
import { useDataTable } from "@/hooks/use-data-table";
import type { Package, PackageWithUserStatus } from "@/types";
import { createMcpColumns } from "@/components/features/mcp-list/mcp-table-columns";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

const searchSchema = z.object({
  publisherId: z.string().optional(),
  name: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional()
});

export const Route = createFileRoute("/_hub/mcp/")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loader: async ({ context: { queryClient } }) => {
    // Fetch user's installed MCPs
    await queryClient.ensureQueryData(packageQueries.userInstalledOptions());
    // Fetch user's deployed MCPs
    await queryClient.ensureQueryData(packageQueries.userDeploymentsOptions());
    // Fetch popular packages for autocomplete
    await queryClient.ensureQueryData(packageQueries.popularOptions());
    // Fetch user info
    await queryClient.ensureQueryData(userQueries.meOptions());
    return { breadcrumb: "MCP Packages" };
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
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: packageData, isPending } = useQuery({
    ...packageQueries.listOptions({
      publisherId: search?.publisherId,
      name: search?.name,
      search: search?.search,
      page: search?.page || 1,
      limit: Math.min(search?.perPage || 10, 10),
    }),
  });

  const { data: userInstalled } = useSuspenseQuery(
    packageQueries.userInstalledOptions()
  );

  const { data: userDeployments } = useSuspenseQuery(
    packageQueries.userDeploymentsOptions()
  );

  const { data: popularPackages } = useSuspenseQuery(
    packageQueries.popularOptions()
  );

  const packages = useMemo(() => {
    if (!packageData?.data) return [];

    const allPackages = packageData.data;
    const normalizedPackages: Package[] = allPackages.map(normalizePackage);

    const installedMap = new Map(
      userInstalled?.map((item: any) => [item.packageId, item]) || []
    );

    const deployedMap = new Map(
      userDeployments?.map((item: any) => [item.package.packageId, item]) || []
    );

    const combined: PackageWithUserStatus[] = normalizedPackages.map(pkg => ({
      ...pkg,
      isInstalled: installedMap.has(pkg.packageId),
      isDeployed: deployedMap.has(pkg.packageId),
      userInstallation: installedMap.get(pkg.packageId) as any,
      userDeployment: deployedMap.get(pkg.packageId) as any,
    }));

    return combined;
  }, [packageData, userInstalled, userDeployments]);

  const columns = useMemo(() => {
    const cols = createMcpColumns();
    return cols;
  }, []);

  const { table } = useDataTable({
    data: packages,
    columns,
    pageCount: (packageData as any)?.pagination?.totalPages || -1,
    defaultColumn: {
      enableColumnFilter: true,
    },
  });

  const filterableColumns = table.getAllColumns().filter((column) => column.getCanFilter());

  useEffect(() => {
    const columnFilters = table.getState().columnFilters;
    const filterParams: Record<string, string | undefined> = {};

    for (const filter of columnFilters) {
      switch (filter.id) {
        case 'name':
          if (typeof filter.value === 'string' && filter.value.trim()) {
            filterParams.search = filter.value.trim();
          }
          break;
        case 'description':
          if (typeof filter.value === 'string' && filter.value.trim()) {
            // Use search for description too since API doesn't have separate description filter
            filterParams.search = filter.value.trim();
          }
          break;
        case 'publisher':
          if (typeof filter.value === 'string' && filter.value.trim()) {
            filterParams.publisherId = filter.value.trim();
          }
          break;
        case 'tags':
          if (typeof filter.value === 'string' && filter.value.trim()) {
            filterParams.search = filter.value.trim();
          }
          break;
        case 'status':
          console.log('🔍 Status filter (client-side):', filter.value);
          break;
        case 'createdAt':
          // Date filtering will be client-side for now since API doesn't support it
          break;
      }
    }

    navigate({
      search: (prev: any) => ({
        ...prev,
        search: filterParams.search || undefined,
        publisherId: filterParams.publisherId || undefined,
        // Reset page to 1 when filters change
        page: 1,
      })
    });
  }, [table.getState().columnFilters, navigate]);

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

  if (isPending) {
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
        <div className="w-full px-4 mb-14 md:px-0">
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
                <div className="size-4 rounded-md bg-blue-400 flex-shrink-0" />
                <span className="flex-shrink-0">{item.name}</span>
                {item.isInstalled && <span className="text-green-600">✓</span>}
                <span className="flex-shrink-0"> - </span>
                <span className="text-primary-400 truncate flex-1 min-w-0">{item.description}</span>
              </Link>
            )}
            onSelect={(item) => {
              // Navigate to package detail page
              window.location.href = `/mcp/${item.packageId}`;
            }}
          />
        </div>

        <div className="p-6">
          <DataTableSkeleton columnCount={6} rowCount={10} />
        </div>
      </div>
    );
  }

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
              <div className="size-4 rounded-md bg-blue-400 flex-shrink-0" />
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

      {/* Table Header */}
      <div className="flex w-full items-center justify-between border-b border-b-primary-100 px-6 py-4">
        <h4 className="font-medium text-xl">
          MCP Packages ({(packageData as any)?.pagination?.total ?? packages.length})
        </h4>
      </div>

      {/* DataTable with toolbar and pagination */}
      <div className="p-6">
        <DataTable table={table}>
          <DataTableToolbar table={table} />
        </DataTable>
      </div>

      <div className="absolute bottom-0 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-100 p-6">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}