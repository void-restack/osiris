"use client";

import { type ColumnDef, type Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { usePackagesTable } from "@/hooks/use-packages-table";
import type { PackageList } from "@/types";
import { PackagesGridView, gridViewColumns } from "./packages-grid-view";
import {
    ExternalLink,
    Download,
    Star,
    Clock,
    User,
    Package,
    Cpu,
    Wrench,
    BookOpen,
    MoreHorizontal,
    Eye,
    Share2,
} from "lucide-react";
import { ICONS } from "@/components/icons";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// Define package types for filtering (based on real API data)
const PACKAGE_TYPES = [
    { label: "MCP Package", value: "mcp", icon: Cpu },
] as const;





export function PackagesTable({
    showPagination = false,
    onTableReady
}: {
    showPagination?: boolean;
    onTableReady?: (table: any) => void;
} = {}) {
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    // Handle individual actions
    const handleInstall = (pkg: PackageList) => {
        const name = pkg.name || (pkg as any).packageName;
        toast.success(`Installing ${name}...`);
    };

    const handleViewPackage = (pkg: PackageList) => {
        const url = pkg.url || (pkg as any).packageUrl;
        window.open(url, "_blank");
    };

    const handleShare = (pkg: PackageList) => {
        const url = pkg.url || (pkg as any).packageUrl;
        navigator.clipboard.writeText(url);
        toast.success("Package URL copied to clipboard");
    };

    // Column definitions with actions
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
                            <Avatar className="h-10 w-10 shrink-0 border">
                                <AvatarImage
                                    src={pkg.iconUrl || (pkg as any).packageIconUrl || undefined}
                                    alt={pkg.name || (pkg as any).packageName}
                                />
                                <AvatarFallback className="text-xs font-medium bg-primary-100 text-primary-700">
                                    {(pkg.name || (pkg as any).packageName)?.charAt(0).toUpperCase() || 'P'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-[300px]">
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
                    const typeConfig = PACKAGE_TYPES.find(t => t.value === type);
                    const Icon = typeConfig?.icon || Package;

                    return (
                        <div className="flex items-center gap-2">
                            <Icon className="h-3 w-3 text-primary-400" />
                            <Badge variant="secondary" className="capitalize">
                                {typeConfig?.label || type}
                            </Badge>
                        </div>
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
                id: "version",
                accessorKey: "latestVersion",
                enableColumnFilter: false, // Disabled - not supported by API
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
                id: "deployments",
                accessorFn: (row) => (row as any).deploymentCount || 0,
                enableColumnFilter: false, // Disabled - not supported by API
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Deployments" />
                ),
                cell: ({ row }) => {
                    const deployments = (row.original as any).deploymentCount;
                    if (deployments === undefined) {
                        return <span className="text-xs text-primary-400">-</span>;
                    }
                    return (
                        <div className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-primary-400" />
                            <span className="text-sm font-medium">{deployments.toLocaleString()}</span>
                        </div>
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
                        <Badge variant="secondary" className="text-xs">
                            {paymentConfig ? "Paid" : "Free"}
                        </Badge>
                    );
                },
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
                enableColumnFilter: false, // Disabled - API only supports createdAfter/createdBefore
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
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    const pkg = row.original;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewPackage(pkg)}>
                                    <Eye className="h-3 w-3 mr-2" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleInstall(pkg)}>
                                    <Download className="h-3 w-3 mr-2" />
                                    Install Package
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(pkg)}>
                                    <Share2 className="h-3 w-3 mr-2" />
                                    Copy URL
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
                enableSorting: false,
                enableHiding: false,
            },
        ],
        [handleInstall, handleViewPackage, handleShare]
    );

    // Choose columns based on view mode  
    const activeColumns = useMemo(() => {
        const selectedColumns = viewMode === "grid" ? gridViewColumns : columns;

        // Debug: Check if search column exists in current view
        const searchColumn = selectedColumns.find(col => col.id === "search");


        return selectedColumns;
    }, [viewMode, columns]);

    // Initialize table with optimized server-side data fetching
    const { table, data, filters, isLoading, isFetching } = usePackagesTable({
        columns: activeColumns,
        initialPageSize: 10, // Limit to 10 items
    });

    // Notify parent when table is ready
    React.useEffect(() => {
        if (onTableReady && table) {
            onTableReady(table);
        }
    }, [table, onTableReady]);



    return (
        <>
            <div className="space-y-4">
                {/* Header with filters and view toggle */}
                <div className="flex w-full gap-4 md:items-center md:justify-between px-4 flex-col md:flex-row md:px-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-primary-400">
                            {isLoading ? "Loading..." : `${data.pagination.total} packages`}
                        </span>
                        {isFetching && !isLoading && (
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                                <span className="text-xs text-primary-400">Updating...</span>
                            </div>
                        )}
                    </div>

                    <div className="flex w-max items-center justify-end gap-4">
                        {/* Filters */}
                        <DataTableToolbar table={table} />

                        {/* View Toggle */}
                        <ToggleGroup
                            className="rounded-[6px] bg-[#F5F5F5] p-[2px]"
                            type="single"
                            value={viewMode}
                            onValueChange={(value) => setViewMode(value as "table" | "grid")}
                        >
                            <ToggleGroupItem
                                value="table"
                                className={cn(
                                    "hover:!bg-white/90",
                                    viewMode === "table" ? "!bg-white data-[state=on]:!bg-white" : "!bg-transparent",
                                )}
                            >
                                <ICONS.list stroke={viewMode === "table" ? "#000000" : "#A3A3A3"} />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="grid"
                                className={cn(
                                    "hover:!bg-white/90",
                                    viewMode === "grid" ? "!bg-white data-[state=on]:!bg-white" : "!bg-transparent",
                                )}
                            >
                                <ICONS.directory stroke={viewMode === "grid" ? "#000000" : "#A3A3A3"} />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>

                {/* Content - Always show real content with placeholderData */}
                {viewMode === "table" ? (
                    <div className="w-full">
                        <DataTable table={table} />
                    </div>
                ) : (
                    <PackagesGridView
                        rows={table.getPaginationRowModel().rows}
                        onInstall={handleInstall}
                        onViewPackage={handleViewPackage}
                        onShare={handleShare}
                    />
                )}

                {/* Pagination - Only show if requested */}
                {showPagination && <DataTablePagination table={table} />}
            </div>
        </>
    );
}