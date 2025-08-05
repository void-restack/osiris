import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, Suspense } from "react";
import { flexRender } from "@tanstack/react-table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Autocomplete } from "@/components/ui/autocomplete";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ICONS } from "@/components/icons";
import { hubQueries, userQueries } from "@/lib/queries";
import { isAuthenticated } from "@/lib/auth-optimized";
import { useDataTable } from "@/hooks/use-data-table";
import type { ServiceClient } from "@/types/auth";
import type { ViewMode } from "@/types";
import { useAuthFilters } from "@/components/features/authhub/use-auth-methods";
import { createColumns } from "@/components/features/authhub/auth-table-columns";
import { FilterSortControls } from "@/components/features/authhub/compact-filters";
import { AuthGridView } from "@/components/features/authhub/auths-grid";
import { AuthMethodDialog } from "@/components/features/authhub/auth-method-dialog";
import { AuthMethodGridSkeleton, AuthMethodTableSkeleton } from "@/components/skeletons/auth-skeleton";

const searchSchema = z.object({
  type: z.enum(['oauth', 'secret_sharing', 'embedded_wallet']).optional(),
  serviceClient: z.string().optional(),
  success: z.coerce.boolean().optional(),
  userServiceConnectionId: z.string().uuid().optional()
});

export const Route = createFileRoute("/_hub/auth/")({
  component: () => (
    <Suspense fallback={<AuthPageSkeleton />}>
      <RouteComponent />
    </Suspense>
  ),
  validateSearch: searchSchema,
  beforeLoad: () => {
    const authenticated = isAuthenticated();
    return { authenticated };
  },
  loader: async ({ context: { queryClient } }) => {
    const authenticated = isAuthenticated();

    // Always load available auth methods (public data)
    await queryClient.ensureQueryData(hubQueries.authMethodsOptions());

    // Only load user data if authenticated
    if (authenticated) {
      await queryClient.ensureQueryData(userQueries.meOptions());
    }

    return { breadcrumb: "Authentication", authenticated };
  },
});

const activeClass = "!bg-white data-[state=on]:!bg-white";
const inactiveClass = "!bg-transparent";

function AuthPageSkeleton() {
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
            <div className="h-6 bg-gray-200 rounded-md animate-pulse w-32" />
            <div className="flex items-center gap-4">
              <div className="h-8 bg-gray-100 rounded-md animate-pulse w-24" />
              <div className="h-8 bg-gray-100 rounded-md animate-pulse w-20" />
            </div>
          </div>
          <div className="p-6">
            <AuthMethodGridSkeleton count={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { authenticated } = Route.useLoaderData();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [callbackDialogOpen, setCallbackDialogOpen] = useState(false);
  const [callbackMethod, setCallbackMethod] = useState<ServiceClient | null>(null);

  const { data: authMethods } = useSuspenseQuery(hubQueries.authMethodsOptions());

  const {
    filters,
    sortConfig,
    filteredMethods,
    updateFilter,
    updateSort,
    resetFilters,
    filterOptions,
    hasActiveFilters
  } = useAuthFilters({ methods: authMethods });

  useEffect(() => {
    if (search?.type && search?.serviceClient && search?.userServiceConnectionId) {
      const method = authMethods.find((m: { name: string; }) => m.name.toLowerCase() === search.serviceClient?.toLowerCase());
      if (method) {
        setCallbackMethod(method);
        setCallbackDialogOpen(true);
      }
    }
  }, [search, authMethods]);

  const columns = useMemo(() => createColumns(), []);
  const { table } = useDataTable({
    data: filteredMethods,
    columns,
    pageCount: Math.ceil(filteredMethods.length / 10),
  });

  const handleViewChange = (value: "table" | "grid") => {
    if (value === viewMode) return;
    setViewMode(value);
  };

  const searchAuthMethods = (query: string) => {
    return authMethods
      .filter((method: ServiceClient) =>
        method.name.toLowerCase().includes(query.toLowerCase()) ||
        method.description.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10);
  };

  return (
    <div>
      <div className="flex flex-1 flex-col pt-4">
        {/* Header */}
        <div className="mx-auto mt-8 max-w-[496px] pb-6 text-center md:w-[496px]">
          <h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
            Search all authenticators
          </h2>
          <span className="text-primary-300 text-sm">
            Search across various authentication hubs on osiris
          </span>
        </div>

        {/* Search Autocomplete */}
        <div className="w-full px-4 mb-14 md:px-0">
          <Autocomplete
            className="mt-6"
            onSearch={searchAuthMethods}
            getItemValue={(item) => item.clientId}
            getItemLabel={(item) => item.name}
            emptyText="No auth methods found."
            footerText="Footer text"
            bottomLeftContent={
              <div className="flex items-center gap-3">
                {authMethods.slice(0, 2).map((method: ServiceClient) => (
                  <Link to={`/auth/${method.clientId}`} key={method.clientId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs capitalize">
                    {method.name}
                  </Link>
                ))}
              </div>
            }
            bottomRightContent={<></>}
            popularItems={
              <div className="flex w-full gap-2">
                {authMethods.slice(0, 3).map((method: ServiceClient) => (
                  <Link to={`/auth/${method.clientId}`} key={method.clientId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs capitalize">
                    {method.name}
                  </Link>
                ))}
              </div>
            }
            renderItem={(item) => (
              <Link to={`/auth/${item.clientId}`} className="flex items-center space-x-2 w-full">
                {item.iconUrl ? (
                  <Avatar className="size-4 rounded-md flex-shrink-0">
                    <AvatarImage src={item.iconUrl} alt={item.name} />
                    <AvatarFallback className="text-xs">
                      {item.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="size-4 rounded-md bg-purple-400 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="flex-shrink-0">{item.name}</span>
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
            All Hubs ({filteredMethods.length}
            {filteredMethods.length !== authMethods.length &&
              ` of ${authMethods.length}`
            })
          </h4>

          <div className="flex items-center gap-4">
            <FilterSortControls
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
          <AuthGridView methods={filteredMethods} />
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
                            {hasActiveFilters ? "No results match your filters." : "No results."}
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
          <span>OSIRIS</span>
        )}
      </div>

      {/* OAuth Callback Dialog */}
      {authenticated && callbackMethod && (
        <AuthMethodDialog
          method={callbackMethod}
          open={callbackDialogOpen}
          onOpenChange={setCallbackDialogOpen}
          mode="callback"
          callbackData={{
            success: search?.success ?? false,
            connectionId: search?.userServiceConnectionId
          }}
        />
      )}
    </div>
  );
}
