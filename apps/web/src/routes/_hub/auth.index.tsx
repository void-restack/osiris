import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Link2, RefreshCcw, ChevronDown } from "lucide-react";
import { useState } from "react";
import { flexRender, type ColumnDef } from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionSelector, type Permission } from "@/components/ui/permission-selector";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hubQueries } from "@/lib/queries";
import { useCreateServiceConnectionMutation } from "@/lib/mutations";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useDataTable } from "@/hooks/use-data-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { ICONS } from "@/components/icons";
import { toast } from "sonner";

interface AuthMethod {
  clientId: string;
  name: string;
  description: string;
  type: 'oauth' | 'secret_sharing' | 'embedded_wallet';
  supportedScopes: string[];
  scopeDefinitions: Record<string, string>;
  supportedServices: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  embedding: null;
}

type ViewMode = 'grid' | 'table';
type SortOption = 'latest' | 'relevant' | 'new' | 'scopes' | 'name';

const sortOptions = [
  { value: 'latest' as const, label: 'Latest' },
  { value: 'relevant' as const, label: 'Relevant' },
  { value: 'new' as const, label: 'New' },
  { value: 'scopes' as const, label: 'Most Scopes' },
  { value: 'name' as const, label: 'Name A-Z' },
];

const createColumns = (): ColumnDef<AuthMethod>[] => [
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-md bg-purple-400 flex items-center justify-center text-white font-bold text-sm capitalize">
          {row.original.name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-primary-800 capitalize">
            {row.original.name}
          </span>
          <span className="text-primary-400 text-xs">{row.original.type}</span>
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    id: "description",
    header: "Description",
    accessorKey: "description",
    cell: ({ row }) => (
      <div className="text-primary-600 text-sm max-w-md truncate">
        {row.original.description}
      </div>
    ),
  },
  {
    id: "type",
    header: "Type",
    accessorKey: "type",
    cell: ({ row }) => (
      <Badge variant="secondary" className="capitalize">
        {row.original.type.replace('_', ' ')}
      </Badge>
    ),
    meta: {
      variant: "select",
      label: "Type",
      options: [
        { label: "OAuth", value: "oauth" },
        { label: "Secret Sharing", value: "secret_sharing" },
        { label: "Embedded Wallet", value: "embedded_wallet" },
      ],
    },
  },
  {
    id: "scopes",
    header: "Scopes",
    accessorKey: "scopeDefinitions",
    cell: ({ row }) => (
      <span className="text-primary-400 text-sm">
        {Object.keys(row.original.scopeDefinitions).length} scopes
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <Link2 className="size-3 mr-1" />
          Connect
        </Button>
        <Link to={`/auth/${row.original.clientId}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            View
          </Button>
        </Link>
      </div>
    ),
    enableSorting: false,
  },
];

export const Route = createFileRoute("/_hub/auth/")({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => ({
    queryData: queryClient.ensureQueryData(hubQueries.authMethodsOptions()),
    breadcrumb: "Authentication",
  }),
});

const activeClass = "!bg-white data-[state=on]:!bg-white";
const inactiveClass = "!bg-transparent";

function AuthMethodDialog({ method }: { method: AuthMethod }) {
  const [selectedScopes, setSelectedScopes] = useState<Permission[]>([]);
  const [authHubName, setAuthHubName] = useState(`${method.name} connection`);

  const createServiceConnection = useCreateServiceConnectionMutation();

  const handleSaveAuthenticator = async () => {
    if (Object.keys(method.scopeDefinitions).length > 0 && selectedScopes.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    try {
      await createServiceConnection.mutateAsync({
        type: method.name, scopes: selectedScopes.map(scope => scope.id)
      });

    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Failed to start authentication process");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-fit items-center gap-1 rounded-[6px] bg-badge-success px-2 py-1 font-medium text-badge-success-text text-xs"
        >
          <Link2 /> Connect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-full max-w-[448px] rounded-[12px] border-primary-100 p-0">
        <AlertDialogHeader className="border-b border-b-primary-100 px-4 py-3">
          <AlertDialogTitle className="font-normal text-base text-primary-400 capitalize">
            Connect {method.name}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="w-full">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between px-4">
              <div className="flex">
                <div className="size-10 rounded-lg bg-purple-400" />
                <div className="-ml-3 size-10 rounded-lg bg-green-400" />
                <div className="ml-2 flex flex-col">
                  <span className="text-primary-800 text-sm">
                    Piyush Jain
                  </span>
                  <span className="text-primary-300 text-xs">
                    piyushj03z@gmail.com
                  </span>
                </div>
              </div>
              <div className="rounded-md border border-primary-300 p-1">
                <RefreshCcw className="size-4 text-primary-300" />
              </div>
            </div>

            <div className="flex flex-col space-y-1.5 px-4 text-[13px] text-primary-400">
              <label htmlFor="auth_hub_name">Auth Hub Name</label>
              <Input
                type="text"
                value={authHubName}
                onChange={(e) => setAuthHubName(e.target.value)}
                placeholder={`${method.name} connection`}
              />
            </div>

            <div className="border-t border-t-primary-200 border-dashed" />

            <div className="flex flex-col px-4">
              <div className="mb-4 flex flex-col">
                <span>Allow Access</span>
                <span className="text-[13px] text-primary-300">
                  Configure the data access for the MCPs
                </span>
              </div>

              {/* Handle different auth method types */}
              {Object.keys(method.scopeDefinitions).length > 0 ? (
                <PermissionSelector
                  permissions={Object.entries(method.scopeDefinitions).map(([scope, label]) => ({
                    id: scope,
                    label: label
                  }))}
                  placeholder="Search permissions..."
                  onSelectionChange={setSelectedScopes}
                />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">
                    This service doesn't require specific permissions
                  </p>
                  <p className="text-xs mt-2">
                    {method.type === 'secret_sharing'
                      ? 'Secret-based authentication doesn\'t use OAuth scopes'
                      : method.type === 'embedded_wallet'
                        ? 'Wallet connections are managed automatically'
                        : 'No permissions configured for this service'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <AlertDialogFooter className="flex w-full items-center rounded-b-[12px] border-t border-t-primary-100 bg-primary-25 px-4 py-3 sm:justify-between">
          <AlertDialogCancel className="bg-primary-50">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="inset-shadow-search-btn"
            onClick={handleSaveAuthenticator}
            disabled={createServiceConnection.isPending}
          >
            {createServiceConnection.isPending ? "Connecting..." : "Save Authenticator"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RouteComponent() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const { data: authMethods } = useSuspenseQuery(hubQueries.authMethodsOptions());

  const handleViewChange = (value: "table" | "grid") => {
    if (value === viewMode) return;
    setViewMode(value);
  };

  const columns = createColumns();

  const { table } = useDataTable({
    data: authMethods,
    columns,
    pageCount: Math.ceil(authMethods.length / 10),
  });

  const searchAuthMethods = (query: string) => {
    return authMethods.filter((method: AuthMethod) =>
      method.name.toLowerCase().includes(query.toLowerCase()) ||
      method.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  const sortAuthMethods = (methods: AuthMethod[]) => {
    switch (sortBy) {
      case 'latest':
        return [...methods].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'name':
        return [...methods].sort((a, b) => a.name.localeCompare(b.name));
      case 'scopes':
        return [...methods].sort((a, b) => Object.keys(b.scopeDefinitions).length - Object.keys(a.scopeDefinitions).length);
      case 'new':
        return [...methods].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'relevant':
      default:
        return methods;
    }
  };

  const GridView = () => {
    const sortedMethods = sortAuthMethods(authMethods);
    return (
      <div className="grid w-full grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedMethods.map((method: AuthMethod) => (
          <div
            key={method.clientId}
            className="h-fit min-h-48 min-w-xs rounded-xl border border-primary-100 p-6"
          >
            <div className="mb-4 flex w-full items-start justify-between">
              <div className="size-14 rounded-xl bg-primary-300 flex items-center justify-center text-white font-bold text-lg capitalize">
                {method.name.charAt(0)}
              </div>
              <AuthMethodDialog method={method} />
            </div>
            <div className="justify-baseline mb-4 flex flex-col items-start">
              <h4 className="inline items-center font-medium capitalize">
                {method.name} <BadgeCheck className="inline size-4" />
              </h4>
              <span className="text-primary-300 text-xs tracking-tight">
                {Object.keys(method.scopeDefinitions).length} Scopes • {method.type}
              </span>
            </div>
            <p className="truncate text-primary-300 text-sm">
              {method.description}
            </p>
          </div>
        ))}
      </div>
    )
  };

  return (
    <div>
      <div className="flex flex-1 flex-col pt-4">
        <div className="mx-auto mt-8 max-w-[496px] pb-14 text-center md:w-[496px]">
          <h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
            Search all authenticators
          </h2>
          <span className="text-primary-300 text-sm">
            Search across various of authentication hubs on osiris
          </span>
        </div>
        <div className="w-full px-4 md:px-0">
          <Autocomplete
            className="mt-6"
            onSearch={searchAuthMethods}
            getItemValue={(item) => item.clientId}
            getItemLabel={(item) => item.name}
            emptyText="No auth methods found."
            footerText="Footer text"
            bottomLeftContent={
              <div className="flex items-center gap-3">
                {authMethods.slice(0, 2).map((method: AuthMethod) => (
                  <div key={method.clientId} className="rounded-md bg-primary-50 p-1.5 text-xs capitalize">
                    {method.name}
                  </div>
                ))}
              </div>
            }
            bottomRightContent={<></>}
            popularItems={
              <div className="flex w-full gap-2">
                {authMethods.slice(0, 3).map((method: AuthMethod) => (
                  <div key={method.clientId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs capitalize">
                    {method.name}
                  </div>
                ))}
              </div>
            }
            renderItem={(item) => (
              <div className="flex items-center space-x-2 w-full">
                <div className="size-4 rounded-md bg-purple-400 flex-shrink-0" />
                <span className="flex-shrink-0">{item.name}</span>
                <span className="flex-shrink-0"> - </span>
                <span className="text-primary-400 truncate flex-1 min-w-0">{item.description}</span>
              </div>
            )}
          />
        </div>

        <div className="flex w-full items-center justify-between border-b border-b-primary-100 px-6 py-4">
          <h4 className="font-medium text-xl">All Hubs ({authMethods.length})</h4>
          <div className="flex items-center gap-4">
            {/* Table Toolbar - only show when in table view */}
            {viewMode === 'table' && (
              <div className="flex items-center">
                <DataTableToolbar table={table} />
              </div>
            )}

            {/* Sort Dropdown */}
            {viewMode === "grid" && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Sort by: {sortOptions.find(opt => opt.value === sortBy)?.label}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={sortBy === option.value ? "bg-accent" : ""}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>}

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
                <ICONS.directory
                  stroke={viewMode === "grid" ? "#000000" : "#A3A3A3"}
                />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <GridView />
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
                              <TableCell
                                key={cell.id}
                                className="h-[56px]"
                              >
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
                            No results.
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
    </div>
  );
}
