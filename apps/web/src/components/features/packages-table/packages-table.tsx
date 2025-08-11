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
    Download,
    Clock,
    Cpu,
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
import { Link } from "@tanstack/react-router";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

    const handleInstall = (pkg: PackageList) => {
        const name = pkg.name || (pkg as any).packageName;
        toast.success(`Installing ${name}...`);
    };

    const handleShare = (pkg: PackageList) => {
        const url = pkg.url || (pkg as any).packageUrl;
        navigator.clipboard.writeText(url);
        toast.success("Package URL copied to clipboard");
    };

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
                                {/* <span className="text-xs text-primary-400 max-w-[100px] truncate">
                                    {pkg.description || (pkg as any).packageDescription}
                                </span> */}
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
            // {
            //     id: "deployments",
            //     accessorFn: (row) => (row as any).deploymentCount || 0,
            //     enableColumnFilter: false, // Disabled - not supported by API
            //     header: ({ column }) => (
            //         <DataTableColumnHeader column={column} title="Deployments" />
            //     ),
            //     cell: ({ row }) => {
            //         const deployments = (row.original as any).deploymentCount;
            //         if (deployments === undefined) {
            //             return <span className="text-xs text-primary-400">-</span>;
            //         }
            //         return (
            //             <div className="flex items-center gap-1">
            //                 <Download className="h-3 w-3 text-primary-400" />
            //                 <span className="text-sm font-medium">{deployments.toLocaleString()}</span>
            //             </div>
            //         );
            //     },
            // },
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

    const activeColumns = useMemo(() => {
        const selectedColumns = viewMode === "grid" ? gridViewColumns : columns;
        const searchColumn = selectedColumns.find(col => col.id === "search");
        return selectedColumns;
    }, [viewMode, columns]);

    const { table, isLoading, isFetching } = usePackagesTable({
        columns: activeColumns,
        initialPageSize: 10,
    });

    React.useEffect(() => {
        if (onTableReady && table) {
            onTableReady(table);
        }
    }, [table, onTableReady]);

    return (
        <>
            <div className="space-y-4">
                <div className="flex w-full gap-4 md:items-center md:justify-between flex-col md:flex-row border-b border-b-primary-100 pb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl text-primary-800 font-medium whitespace-nowrap">
                            All MCPs
                        </span>
                        {isFetching && !isLoading && (
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                            </div>
                        )}
                    </div>

                    <div className="flex w-full items-center justify-end">
                        <DataTableToolbar className="w-full" table={table} />

                        <ToggleGroup
                            className="rounded-[6px] bg-[#F5F5F5] p-[2px] h-8"
                            type="single"
                            value={viewMode}
                            onValueChange={(value) => setViewMode(value as "table" | "grid")}
                        >
                            <ToggleGroupItem
                                value="table"
                                className={cn(
                                    "hover:!bg-white/90 h-full",
                                    viewMode === "table" ? "!bg-white data-[state=on]:!bg-white" : "!bg-transparent",
                                )}
                            >
                                <ICONS.list stroke={viewMode === "table" ? "#000000" : "#A3A3A3"} />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="grid"
                                className={cn(
                                    "hover:!bg-white/90 h-full",
                                    viewMode === "grid" ? "!bg-white data-[state=on]:!bg-white" : "!bg-transparent",
                                )}
                            >
                                <ICONS.directory stroke={viewMode === "grid" ? "#000000" : "#A3A3A3"} />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>

                {viewMode === "table" ? (
                    <ScrollArea className="relative h-[calc(100vh-560px)] hidebar overflow-y-auto">
                        <div className="w-full hidebar  pb-8">
                            <DataTable table={table} />
                        </div>
                    </ScrollArea>
                ) : (
                    <PackagesGridView
                        rows={table.getPaginationRowModel().rows}
                    />
                )}

                {showPagination && <DataTablePagination table={table} />}
            </div>
        </>
    );
}