import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Autocomplete } from "@/components/ui/autocomplete";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { hubQueries, userQueries } from "@/lib/queries";
import { getAuthState } from "@/lib/auth-utils";
import type { ServiceClient } from "@/types/auth";
import { AuthTable } from "@/components/features/authhub/auth-table";
import { AuthMethodDialog } from "@/components/features/authhub/auth-method-dialog";
import { useAuthTable } from "@/hooks/use-auth-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  Clock,
  User,
  Cpu,
  Wrench,
  BookOpen,
} from "lucide-react";

const searchSchema = z.object({
  type: z.enum(['oauth', 'secret_sharing', 'embedded_wallet']).optional(),
  serviceClient: z.string().optional(),
  success: z.coerce.boolean().optional(),
  userServiceConnectionId: z.string().uuid().optional()
});

const AUTH_TYPES = [
  { label: "OAuth", value: "oauth", icon: Cpu },
  { label: "Secret Sharing", value: "secret_sharing", icon: Wrench },
  { label: "Embedded Wallet", value: "embedded_wallet", icon: BookOpen },
] as const;

export const Route = createFileRoute("/_hub/auth/")({
  component: () => (
    <Suspense fallback={<AuthPageSkeleton />}>
      <RouteComponent />
    </Suspense>
  ),
  validateSearch: searchSchema,
  beforeLoad: () => {
    return {};
  },
  loader: async ({ context: { queryClient } }) => {
    const auth = await getAuthState(queryClient);

    // Always load available auth methods (public data)
    await queryClient.ensureQueryData(hubQueries.authMethodsOptions(undefined));

    // Only load user data if authenticated
    if (auth.isAuthenticated) {
      await queryClient.ensureQueryData(userQueries.meOptions());
    }

    return { breadcrumb: "Authentication", auth };
  },
});

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

function RouteComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { auth } = Route.useLoaderData();
  const [callbackDialogOpen, setCallbackDialogOpen] = useState(false);
  const [callbackMethod, setCallbackMethod] = useState<ServiceClient | null>(null);
  const queryClient = useQueryClient();

  const { data: authMethods } = useQuery({
    ...hubQueries.authMethodsOptions(undefined),
  });

  useEffect(() => {
    if (search?.type && search?.serviceClient && search?.userServiceConnectionId) {
      const method = authMethods?.find((m: { name: string; }) => m.name.toLowerCase() === search.serviceClient?.toLowerCase());
      if (method) {
        setCallbackMethod(method);
        setCallbackDialogOpen(true);
      }
    }
  }, [search, authMethods]);

  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults, isPending: isSearching } = useQuery({
    queryKey: ['auth-methods', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const response = await queryClient.ensureQueryData(hubQueries.authMethodsOptions({
        name: searchQuery
      }));
      return response || [];
    },
    enabled: searchQuery.length >= 2,
  });

  const searchAuthMethods = async (query: string) => {
    setSearchQuery(query);
    return searchResults || [];
  };

  // Define table columns at the parent level
  const tableColumns = useMemo<ColumnDef<ServiceClient>[]>(
    () => [
      {
        id: "search",
        accessorKey: "name",
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} className="text-sm" title="Auth Method" />
        ),
        cell: ({ row }) => {
          const auth = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8 rounded-md shrink-0">
                <AvatarImage src={auth.iconUrl || undefined} alt={auth.name} />
                <AvatarFallback className="rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                  {auth.name?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-primary-800">{auth.name.toString().toWellFormed()}</span>
              </div>
            </div>
          );
        },
        enableSorting: false,
        meta: {
          variant: "text",
          label: "Auth method name",
          placeholder: "Search auth methods...",
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
          const auth = row.original;
          return (
            <p className="text-xs text-primary-400 max-w-[120px] line-clamp-1 truncate">{auth.description}</p>
          );
        },
        enableSorting: false,
      },
      {
        id: "type",
        accessorKey: "type",
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const type = AUTH_TYPES.find(
            (type) => type.value === row.original.type,
          );
          if (!type) return null;
          return (
            <Badge variant="secondary" className="text-xs">
              {type.label}
            </Badge>
          );
        },
        enableSorting: false,
        meta: {
          variant: "select",
          label: "Auth type",
          options: AUTH_TYPES.map((type) => ({
            label: type.label,
            value: type.value,
            icon: type.icon
          })),
        },
      },
      {
        id: "scopes",
        accessorKey: "supportedScopes",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Scopes" />
        ),
        cell: ({ row }) => {
          const scopes = row.original.supportedScopes;
          if (!scopes || scopes.length === 0) {
            return <span className="text-xs text-primary-400">-</span>;
          }
          return (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-primary-400" />
              <span className="text-sm font-medium">{scopes.length}</span>
            </div>
          );
        },
        enableSorting: false,
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
        header: () => <div className="text-sm text-right mr-2 md:mr-6">Actions</div>,
        cell: ({ row }) => {
          const auth = row.original;
          return (
            <div className="flex items-center justify-end mr-2 md:mr-6">
              <AuthMethodDialog method={auth} />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  // Create table instance at parent level (same pattern as mcp.index.tsx)
  const { table, isLoading, isFetching } = useAuthTable({
    columns: tableColumns,
    initialPageSize: 10,
  });

  return (
    <div>
      <div className="flex flex-1 flex-col pt-4">
        {/* Header */}
        <div className="mx-auto mt-8 max-w-[496px] pb-6 text-center md:w-[496px]">
          <h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
            Discover all authenticators
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
            emptyText={isSearching ? "Searching..." : "No auth methods found."}
            footerText="Footer text"
            bottomLeftContent={
              <div className="flex items-center gap-3">
                {authMethods?.slice(0, 2).map((method: ServiceClient) => (
                  <Link to={`/auth/${method.clientId}`} key={method.clientId} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs capitalize">
                    {method.name}
                  </Link>
                ))}
              </div>
            }
            bottomRightContent={<></>}
            popularItems={
              <div className="flex w-full gap-2">
                {authMethods?.slice(0, 3).map((method: ServiceClient) => (
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
              navigate({ to: `/auth/${item.clientId}` });
            }}
          />
        </div>

        {/* Auth Table - pass table instance as prop */}
        <div className="px-4 md:px-6 mb-20">
          <AuthTable
            table={table}
            isLoading={isLoading}
            isFetching={isFetching}
          />
        </div>

        {/* Bottom pagination - same pattern as mcp.index.tsx */}
        <div className="absolute bottom-0 border-t border-t-primary-100 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 p-6 z-40">
          <DataTablePagination table={table} />
        </div>
      </div>

      {/* OAuth Callback Dialog */}
      {auth.isAuthenticated && callbackMethod && (
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