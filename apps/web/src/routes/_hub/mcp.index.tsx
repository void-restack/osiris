import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { flexRender } from "@tanstack/react-table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Autocomplete } from "@/components/ui/autocomplete";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { ICONS } from "@/components/icons";
import { packageQueries, userQueries } from "@/lib/queries";
import { useDataTable } from "@/hooks/use-data-table";
import type { Package, PackageWithUserStatus, ViewMode } from "@/types";
import { useMcpFilters } from "@/components/features/mcp-list/use-mcp-filters";
import { createMcpColumns } from "@/components/features/mcp-list/mcp-table-columns";
import { McpFilterSortControls } from "@/components/features/mcp-list/mcp-compact-filters";
import { McpGridView } from "@/components/features/mcp-list/mcp-grid-view";

const searchSchema = z.object({
  publisherId: z.string().optional(),
  name: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional()
});

export const Route = createFileRoute("/_hub/mcp/")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loader: async ({ context: { queryClient } }) => {
    // Fetch all packages
    await queryClient.ensureQueryData(packageQueries.listOptions({}));
    // Fetch user's installed MCPs
    await queryClient.ensureQueryData(packageQueries.userInstalledOptions());
    // Fetch user's deployed MCPs
    await queryClient.ensureQueryData(packageQueries.userDeploymentsOptions());
    // Fetch user info
    await queryClient.ensureQueryData(userQueries.meOptions());
    return { breadcrumb: "MCP Packages" };
  },
});

const activeClass = "!bg-white data-[state=on]:!bg-white";
const inactiveClass = "!bg-transparent";

function RouteComponent() {
  const search = Route.useSearch();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Fetch all data
  const { data: packageData } = useSuspenseQuery(
    packageQueries.listOptions({
      publisherId: search?.publisherId,
      name: search?.name,
      page: search?.page || 1,
      limit: search?.limit || 50,
    })
  );

  const { data: userInstalled } = useSuspenseQuery(
    packageQueries.userInstalledOptions()
  );

  const { data: userDeployments } = useSuspenseQuery(
    packageQueries.userDeploymentsOptions()
  );

  // Combine all packages with user status
  const packages = useMemo(() => {
    const allPackages: Package[] = packageData || [];
    const installedMap = new Map(
      userInstalled?.map(item => [item.packageId, item]) || []
    );

    const deployedMap = new Map(
      userDeployments?.map(item => [item.package.packageId, item]) || []
    );

    const combined: PackageWithUserStatus[] = allPackages.map(pkg => ({
      ...pkg,
      isInstalled: installedMap.has(pkg.packageId),
      isDeployed: deployedMap.has(pkg.packageId),
      userInstallation: installedMap.get(pkg.packageId),
      userDeployment: deployedMap.get(pkg.packageId),
    }));

    return combined;
  }, [packageData, userInstalled, userDeployments]);

  const {
    filters,
    sortConfig,
    filteredPackages,
    updateFilter,
    updateSort,
    resetFilters,
    filterOptions,
    hasActiveFilters
  } = useMcpFilters({ packages });

  const columns = useMemo(() => createMcpColumns(), []);
  const { table } = useDataTable({
    data: filteredPackages,
    columns,
    pageCount: Math.ceil(filteredPackages.length / 10),
  });

  const handleViewChange = (value: "table" | "grid") => {
    if (value === viewMode) return;
    setViewMode(value);
  };

  const searchPackages = (query: string) => {
    return packages
      .filter((pkg) =>
        pkg.name.toLowerCase().includes(query.toLowerCase()) ||
        (pkg.metadata?.tags || []).some((tag: string) =>
          tag.toLowerCase().includes(query.toLowerCase())
        )
      )
      .slice(0, 10);
  };

  return (
    <div>
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
                {packages.slice(0, 2).map((pkg) => (
                  <Link to={`/mcp/${pkg.packageId}`} key={pkg.packageId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs">
                    {pkg.name}
                    {pkg.isInstalled && " ✓"}
                  </Link>
                ))}
              </div>
            }
            bottomRightContent={<></>}
            popularItems={
              <div className="flex w-full gap-2">
                {packages.slice(0, 3).map((pkg) => (
                  <Link to={`/mcp/${pkg.packageId}`} key={pkg.packageId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs">
                    {pkg.name}
                    {pkg.isInstalled && " ✓"}
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
              updateFilter('searchQuery', item.name);
            }}
          />
        </div>

        <div className="flex w-full items-center justify-between border-b border-b-primary-100 px-6 py-4">
          <h4 className="font-medium text-xl">
            All Packages
          </h4>

          <div className="flex items-center gap-4">
            <McpFilterSortControls
              filters={filters}
              onFilterChange={updateFilter}
              onReset={resetFilters}
              filterOptions={filterOptions}
              hasActiveFilters={hasActiveFilters}
              sortConfig={sortConfig}
              onSortChange={updateSort}
            />

            {viewMode === 'table' && (
              <div className="border-l pl-4">
                <DataTableToolbar table={table} />
              </div>
            )}

            {/* View Toggle */}
            <ToggleGroup
              className="rounded-[6px] bg-[#F5F5F5] p-[2px]"
              type="single"
              value={viewMode}
              onValueChange={handleViewChange}
            >
              <ToggleGroupItem
                value="table"
                className={cn(
                  "hover:!bg-white/90",
                  viewMode === "table" ? activeClass : inactiveClass,
                )}
              >
                <ICONS.list stroke={viewMode === "table" ? "#000000" : "#A3A3A3"} />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="grid"
                className={cn(
                  "hover:!bg-white/90",
                  viewMode === "grid" ? activeClass : inactiveClass,
                )}
              >
                <ICONS.directory stroke={viewMode === "grid" ? "#000000" : "#A3A3A3"} />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <>
            <McpGridView packages={filteredPackages} />
          </>
        ) : (
          <div className="p-6">
            <div className="w-full overflow-x-auto">
              <div className="flex w-full flex-col gap-2.5">
                <div className="overflow-hidden rounded-md border w-full">
                  <Table className="overflow-scroll w-full">
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              colSpan={header.colSpan}
                              className="h-10 font-medium text-[13px] text-primary-400"
                            >
                              {header.isPlaceholder ? null :
                                flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="h-[56px]">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={table.getAllColumns().length}
                            className="h-24 text-center"
                          >
                            {hasActiveFilters ? "No packages match your filters." : "No packages found."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-100 p-6">
        {viewMode === 'table' ? (
          <DataTablePagination table={table} />
        ) : (
          <span>MCP Hub</span>
        )}
      </div>
    </div>
  );
}
