import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { getAuthState } from '@/lib/auth-utils'
import { useQuery } from '@tanstack/react-query'
import { userQueries, creditQueries } from '@/lib/queries'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Icon } from '@/components/ui/icon'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { OAuthClientsTable } from '@/components/features/oauth-clients/oauth-clients-table'
import { PackagesTable } from '@/components/features/packages-table/packages-table'
import { usePackagesTable } from '@/hooks/use-packages-table'
import { useState, useMemo } from 'react'
import { type ColumnDef } from "@tanstack/react-table"
import type { PackageList } from "@/types"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, Clock, Cpu, MoreHorizontal, Eye, Share2 } from "lucide-react"
import { toast } from "sonner"
import { gridViewColumns } from '@/components/features/packages-table/packages-grid-view'

export const Route = createFileRoute('/_hub/profile')({
    component: RouteComponent,
    beforeLoad: async ({ context: { queryClient } }) => {
        const auth = await getAuthState(queryClient);

        if (!auth.isAuthenticated) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: '/profile',
                },
            });
        }

        return { auth };
    },
    loader: async ({ context: { queryClient } }) => {
        // Always fetch user and credit data
        const [userData] = await Promise.all([
            queryClient.ensureQueryData(userQueries.meOptions()),
            queryClient.ensureQueryData(creditQueries.balanceOptions()),
        ]);

        return {
            breadcrumb: `${userData?.name || 'User'} Profile`,
            userId: userData?.id
        };
    },
})

const PACKAGE_TYPES = [
    { label: "MCP Package", value: "mcp", icon: Cpu },
] as const;

function RouteComponent() {
    // These queries will already be cached from the loader
    const { data: user, isPending: userLoading } = useQuery(userQueries.meOptions());
    const { data: creditBalance, isPending: creditLoading } = useQuery(creditQueries.balanceOptions());

    // State for different table instances
    const [oauthClientsTable, setOauthClientsTable] = useState<any>(null);
    const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

    // Track active tab
    const [activeTab, setActiveTab] = useState<string>("oauth-clients");

    const formatCredits = (credits: string) => {
        const numCredits = parseFloat(credits);
        const formattedCredits = Math.floor(numCredits).toLocaleString();
        return formattedCredits;
    };

    // Package table handlers
    const handleInstall = (pkg: PackageList) => {
        const name = pkg.name || (pkg as any).packageName;
        toast.success(`Installing ${name}...`);
    };

    const handleShare = (pkg: PackageList) => {
        const url = pkg.url || (pkg as any).packageUrl;
        navigator.clipboard.writeText(url);
        toast.success("Package URL copied to clipboard");
    };

    // Package table columns
    const columns = useMemo<ColumnDef<PackageList>[]>(
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
                        <p className="text-xs text-primary-400 max-w-[200px] w-full truncate">{pkg.shortDescription || pkg.description || (pkg as any).packageDescription}</p>
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

    // Select columns based on view mode
    const activeColumns = useMemo(() => {
        return viewMode === "grid" ? gridViewColumns : columns;
    }, [viewMode, columns, gridViewColumns]);

    // Only create custom filters when user ID is available
    const customFilters = useMemo(() => {
        if (!user?.id) return {};
        return { publisherId: user.id };
    }, [user?.id]);

    // Use packages table hook with custom filters
    const { table, isLoading, isFetching } = usePackagesTable({
        columns: activeColumns,
        initialPageSize: 10,
        customFilters,
    });

    // Get the current active table based on the selected tab
    const getCurrentTable = () => {
        switch (activeTab) {
            case "mcps":
                return table;
            case "oauth-clients":
                return oauthClientsTable;
            default:
                return null;
        }
    };

    return (
        <div className='h-full'>
            <div className="pt-10 px-8 flex gap-32 flex-col w-full">
                <div className="w-full flex items-center justify-between">
                    <div className="flex flex-col items-start">
                        {creditLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ) : creditBalance ? (
                            <>
                                <h2 className="text-[32px]">
                                    {formatCredits(creditBalance.totalCredits)} <span className="text-primary-300">Credits</span>
                                </h2>
                                <span className="text-[13px] text-primary-300">Osiris Credit Balance</span>
                            </>
                        ) : (
                            <>
                                <h2 className="text-[32px]">0 <span className="text-primary-300">Credits</span></h2>
                                <span className="text-[13px] text-primary-300">Osiris Credit Balance</span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="h-[52px] w-[174px] flex bg-primary-50 rounded-[8px] items-center px-2 gap-[12px]">
                            {userLoading ? (
                                <>
                                    <Skeleton className="size-8 rounded-md" />
                                    <div className="flex flex-col space-y-1">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </>
                            ) : user ? (
                                <>
                                    <Avatar className="size-8">
                                        <AvatarFallback className="bg-primary-300 text-white text-sm">
                                            {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm truncate">{user.name}</h3>
                                        <p className="text-[13px] truncate text-primary-300">{user.email}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-purple-300 size-8 rounded-md" />
                                    <div className="flex flex-col">
                                        <h3 className="text-sm truncate">Loading...</h3>
                                        <p className="text-[13px] truncate text-primary-300">Loading...</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="h-[52px] w-[30px] bg-primary-800 flex items-center justify-center rounded-[8px] inset-shadow-search-btn">
                            <PlusIcon className="text-primary-00 size-4" />
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="oauth-clients" className='px-0 flex gap-2 items-center'>
                            <Icon name="ai" size='md' />
                            OAuth Clients</TabsTrigger>
                        <TabsTrigger value="mcps" className='px-0 mx-6 flex gap-2 items-center'>
                            <Icon name="code" size='md' />
                            Developed MCP's</TabsTrigger>
                        <TabsTrigger value="knowledge-bases" className='px-0 flex items-center gap-2'>
                            <Icon name="file" size='md' />
                            Knowledge Bases</TabsTrigger>
                    </TabsList>

                    <TabsContent value="oauth-clients" className="mt-10">
                        {user?.id ? (
                            <div>
                                <OAuthClientsTable
                                    title="My OAuth Clients"
                                    onTableReady={setOauthClientsTable}
                                    showPagination={false}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Skeleton className="h-8 w-48 mx-auto mb-4" />
                                <Skeleton className="h-4 w-64 mx-auto" />
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="mcps" className="mt-10">
                        {user?.id ? (
                            <PackagesTable
                                table={table}
                                isLoading={isLoading}
                                isFetching={isFetching}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                                title="Developed MCPs"
                            />
                        ) : (
                            <div className="text-center py-12">
                                <Skeleton className="h-8 w-48 mx-auto mb-4" />
                                <Skeleton className="h-4 w-64 mx-auto" />
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="knowledge-bases" className="mt-10">
                        {user?.id ? (
                            <div className="text-center py-12">
                                <Icon name="file" className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">My Knowledge Bases</h3>
                                <p className="text-gray-500">
                                    Knowledge bases functionality coming soon.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Skeleton className="h-8 w-48 mx-auto mb-4" />
                                <Skeleton className="h-4 w-64 mx-auto" />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <div className="absolute bottom-0 border-t border-t-primary-100 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 p-6">
                {getCurrentTable() && <DataTablePagination table={getCurrentTable()} />}
            </div>
        </div>
    )
}