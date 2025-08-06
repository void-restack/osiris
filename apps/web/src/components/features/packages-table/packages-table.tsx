"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { usePackagesTable } from "@/hooks/use-packages-table";
import type { PackageList } from "@/types";
import { ExternalLink, Download, Star, Clock, User, Package, Cpu, Wrench, BookOpen } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

// Define package types for filtering (based on real API data)
const PACKAGE_TYPES = [
    { label: "MCP Package", value: "mcp", icon: Cpu },
] as const;

// Mock data for demonstration (in real app, this would come from API)
const MOCK_PUBLISHERS = [
    { label: "Anthropic", value: "anthropic" },
    { label: "OpenAI", value: "openai" },
    { label: "Microsoft", value: "microsoft" },
    { label: "Google", value: "google" },
    { label: "Meta", value: "meta" },
] as const;

export function PackagesTable() {
    // Handle install action
    const handleInstall = (pkg: PackageList) => {
        toast.success(`Installing ${pkg.name}...`);
        // TODO: Implement actual installation logic
    };

    // Handle external link
    const handleViewPackage = (pkg: PackageList) => {
        window.open(pkg.url, "_blank");
    };

    // Column definitions with proper metadata for filtering
    const columns = useMemo<ColumnDef<PackageList>[]>(
        () => [
            {
                id: "name",
                accessorKey: "name",
                enableColumnFilter: true,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Package" />
                ),
                cell: ({ row }) => {
                    const pkg = row.original;
                    return (
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-8 w-8 shrink-0 border">
                                <AvatarImage
                                    src={pkg.iconUrl || (pkg as any).packageIconUrl || undefined}
                                    alt={pkg.name || (pkg as any).packageName}
                                />
                                <AvatarFallback className="text-xs font-medium bg-primary-100 text-primary-700">
                                    {(pkg.name || (pkg as any).packageName)?.charAt(0).toUpperCase() || 'P'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="font-medium text-sm text-primary-800 truncate">
                                    {pkg.name || (pkg as any).packageName}
                                </span>
                                <span className="text-xs text-primary-400 truncate">
                                    {pkg.description || (pkg as any).packageDescription}
                                </span>
                            </div>
                        </div>
                    );
                },
                meta: {
                    variant: "text",
                    label: "Package name",
                    placeholder: "Search packages...",
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
                    return (
                        <Badge variant="secondary" className="capitalize">
                            {type}
                        </Badge>
                    );
                },
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
                id: "publisher",
                accessorKey: "publisherId",
                enableColumnFilter: true,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Publisher" />
                ),
                cell: ({ row }) => {
                    const publisherId = row.getValue("publisher") as string;
                    // In real app, you'd resolve publisher ID to name
                    const publisherName = publisherId.slice(0, 8);
                    return (
                        <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-primary-400" />
                            <span className="text-sm text-primary-600 font-mono">
                                {publisherName}...
                            </span>
                        </div>
                    );
                },
                meta: {
                    variant: "multiSelect",
                    label: "Publisher",
                    options: MOCK_PUBLISHERS.map(pub => ({
                        label: pub.label,
                        value: pub.value,
                        icon: User
                    })),
                },
            },
            {
                id: "version",
                accessorKey: "latestVersion",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Version" />
                ),
                cell: ({ row }) => {
                    const version = row.getValue("version") as string;
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
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Pricing" />
                ),
                cell: ({ row }) => {
                    const paymentConfig = row.original.paymentConfig;
                    return (
                        <Badge variant="secondary" className="text-xs">
                            {paymentConfig ? "Paid" : "Free"}
                        </Badge>
                    );
                },
            },
            {
                id: "updatedAt",
                accessorKey: "updatedAt",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Updated" />
                ),
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
                meta: {
                    variant: "dateRange",
                    label: "Updated date",
                },
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    const pkg = row.original;
                    return (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewPackage(pkg)}
                            >
                                <ExternalLink className="h-3 w-3" />
                                <span className="sr-only">View package</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleInstall(pkg)}
                            >
                                <Download className="h-3 w-3" />
                                <span className="sr-only">Install package</span>
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [handleInstall, handleViewPackage]
    );

    // Initialize table with optimized server-side data fetching
    const { table, data, filters, isLoading } = usePackagesTable({
        columns,
        initialPageSize: 20,
    });

    return (
        <div className="space-y-4">
            {isLoading ? (
                <DataTableSkeleton
                    columnCount={6}
                    rowCount={20}
                    withPagination
                    withViewOptions
                    filterCount={2}
                    cellWidths={["40rem", "10rem", "8rem", "8rem", "12rem", "6rem"]}
                />
            ) : (
                <>
                    <DataTable table={table}>
                        <DataTableToolbar table={table}>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-primary-400">
                                    {data.pagination.total} packages
                                </span>
                                {filters.search && (
                                    <Badge variant="secondary" className="text-xs">
                                        Search: {filters.search}
                                    </Badge>
                                )}
                                {/* Publisher filter was removed in favor of type/pricing filters */}
                            </div>
                        </DataTableToolbar>
                    </DataTable>
                    <DataTablePagination table={table} />
                </>
            )}
        </div>
    );
}