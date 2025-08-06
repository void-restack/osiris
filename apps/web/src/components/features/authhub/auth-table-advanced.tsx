"use client";

import { type ColumnDef, type Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { ICONS } from "@/components/icons";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useAuthTable } from "@/hooks/use-auth-table";
import type { ServiceClient } from "@/types/auth";
import { AuthGridView } from "./auths-grid";
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
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define auth types for filtering
const AUTH_TYPES = [
    { label: "OAuth", value: "oauth", icon: Cpu },
    { label: "Secret Sharing", value: "secret_sharing", icon: Wrench },
    { label: "Embedded Wallet", value: "embedded_wallet", icon: BookOpen },
] as const;

export function AuthTable({
    showPagination = false,
    onTableReady
}: {
    showPagination?: boolean;
    onTableReady?: (table: any) => void;
} = {}) {
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const handleConnect = (auth: ServiceClient) => {
        toast.success(`Connecting to ${auth.name}...`);
        // Logic to connect to auth method
    };

    const handleViewAuth = (auth: ServiceClient) => {
        toast.info(`Viewing ${auth.name} details...`);
        // Logic to navigate to auth details
    };

    const handleShare = (auth: ServiceClient) => {
        navigator.clipboard.writeText(auth.clientId);
        toast.success(`Copied client ID for ${auth.name}`);
    };

    const columns = useMemo<ColumnDef<ServiceClient>[]>(
        () => [
            {
                id: "search",
                accessorKey: "name",
                enableColumnFilter: true,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Auth Method" />
                ),
                cell: ({ row }) => {
                    const auth = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 shrink-0 border">
                                <AvatarImage src={auth.iconUrl || undefined} alt={auth.name} />
                                <AvatarFallback className="text-xs font-medium bg-primary-100 text-primary-700">
                                    {auth.name?.charAt(0).toUpperCase() || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-primary-800">{auth.name}</span>
                                <span className="text-xs text-primary-400 line-clamp-1">{auth.description}</span>
                            </div>
                        </div>
                    );
                },
                meta: {
                    variant: "text",
                    label: "Auth method name",
                    placeholder: "Search auth methods...",
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
                    const type = AUTH_TYPES.find(
                        (type) => type.value === row.original.type,
                    );
                    if (!type) return null;
                    const Icon = type.icon;
                    return (
                        <Badge variant="secondary" className="text-xs">
                            {Icon && <Icon className="h-3 w-3" />}
                            {type.label}
                        </Badge>
                    );
                },
                meta: {
                    variant: "multiSelect",
                    label: "Auth type",
                    options: AUTH_TYPES.map((type) => ({
                        label: type.label,
                        value: type.value,
                        icon: type.icon
                    })),
                },
            },
            {
                id: "services",
                accessorKey: "supportedServices",
                enableColumnFilter: false,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Services" />
                ),
                cell: ({ row }) => {
                    const services = row.original.supportedServices;
                    if (!services || services.length === 0) {
                        return <span className="text-xs text-primary-400">-</span>;
                    }
                    return (
                        <div className="flex flex-wrap gap-1">
                            {services.slice(0, 2).map((service, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {service}
                                </Badge>
                            ))}
                            {services.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                    +{services.length - 2}
                                </Badge>
                            )}
                        </div>
                    );
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
            },
            {
                id: "updatedAt",
                accessorKey: "updatedAt",
                enableColumnFilter: false,
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
                    const auth = row.original;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => handleViewAuth(auth)}>
                                    <Eye className="h-3 w-3 mr-2" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleConnect(auth)}>
                                    <Download className="h-3 w-3 mr-2" />
                                    Connect
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(auth)}>
                                    <Share2 className="h-3 w-3 mr-2" />
                                    Copy Client ID
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
                enableSorting: false,
                enableHiding: false,
            },
        ],
        [handleConnect, handleViewAuth, handleShare]
    );

    // Initialize table with optimized server-side data fetching
    const { table, data, filters, isLoading, isFetching } = useAuthTable({
        columns,
        initialPageSize: 10,
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
                            {isLoading ? "Loading..." : `${data.pagination.total} auth methods`}
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
                    <AuthGridView methods={table.getPaginationRowModel().rows.map(row => row.original)} />
                )}

                {/* Pagination - Only show if requested */}
                {showPagination && <DataTablePagination table={table} />}
            </div>
        </>
    );
} 