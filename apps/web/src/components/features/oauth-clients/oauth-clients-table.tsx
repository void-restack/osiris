import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useOAuthClientsTable } from "@/hooks/use-oauth-clients-table";
import type { OAuthClient } from "@/types";
import { OAuthClientsGridView } from "./oauth-clients-grid-view";
import { CreateOAuthClientDialog } from "./create-oauth-client-dialog";
import {
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    Copy,
} from "lucide-react";
import { ICONS } from "@/components/icons";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/format";
import {
    useDeleteOAuthClientMutation,
    useRegenerateOAuthSecretMutation
} from "@/lib/mutations";
import { useAppStore } from "@/lib/store";
import type { OAuthClientData } from "@/lib/store";

export function OAuthClientsTable({
    showPagination = false,
    onTableReady,
    title = "OAuth Clients"
}: {
    showPagination?: boolean;
    onTableReady?: (table: any) => void;
    title?: string;
} = {}) {
    const { openOAuthClientEditSidebar } = useAppStore();
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const handleCopyClientId = (clientId: string) => {
        navigator.clipboard.writeText(clientId);
        toast.success("Client ID copied to clipboard");
    };

    const handleCopySecret = (secret: string) => {
        navigator.clipboard.writeText(secret);
        toast.success("Client secret copied to clipboard");
    };

    const handleEdit = (client: OAuthClient) => {
        const oauthClientData: OAuthClientData = {
            clientId: client.clientId,
            developerId: client.developerId,
            name: client.name,
            iconUrl: client.iconUrl,
            redirectUris: client.redirectUris,
            metadata: client.metadata,
            createdAt: client.createdAt,
            updatedAt: client.updatedAt,
        };
        openOAuthClientEditSidebar(oauthClientData);
    };

    const deleteClientMutation = useDeleteOAuthClientMutation();
    const regenerateSecretMutation = useRegenerateOAuthSecretMutation();

    const handleDelete = (client: OAuthClient) => {
        if (confirm(`Are you sure you want to delete "${client.name}"? This action cannot be undone.`)) {
            deleteClientMutation.mutate(client.clientId);
        }
    };

    const handleRegenerateSecret = (client: OAuthClient) => {
        if (confirm(`Are you sure you want to regenerate the client secret for "${client.name}"? The old secret will stop working.`)) {
            regenerateSecretMutation.mutate(client.clientId);
        }
    };

    const columns = useMemo<ColumnDef<OAuthClient>[]>(
        () => [
            {
                id: "name",
                accessorKey: "name",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="OAuth Client" />
                ),
                enableSorting: false,
                cell: ({ row }) => {
                    const client = row.original;
                    return (
                        <div
                            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-md transition-colors"
                            onClick={() => handleEdit(client)}
                        >
                            <Avatar className="size-10 rounded-md">
                                <AvatarImage src={client.iconUrl || undefined} alt={client.name} />
                                <AvatarFallback className="size-10 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                                    {client.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-primary-800 truncate">
                                    {client.name}
                                </p>
                                <p className="text-xs text-primary-400 truncate">
                                    {client.clientId}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "redirectUris",
                accessorKey: "redirectUris",
                enableSorting: false,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Redirect URIs" />
                ),
                cell: ({ row }) => {
                    const uris = row.original.redirectUris;
                    return (
                        <div className="max-w-[200px]">
                            {uris.length > 0 ? (
                                <div className="space-y-1">
                                    {uris.slice(0, 2).map((uri, index) => (
                                        <div key={index} className="text-xs text-primary-600 truncate">
                                            {uri}
                                        </div>
                                    ))}
                                    {uris.length > 2 && (
                                        <div className="text-xs text-primary-400">
                                            +{uris.length - 2} more
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-xs text-primary-400">No redirect URIs</span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "metadata",
                accessorKey: "metadata",
                enableSorting: false,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Description" />
                ),
                cell: ({ row }) => {
                    const metadata = row.original.metadata;
                    const description = metadata?.description || metadata?.purpose;
                    return (
                        <div className="max-w-[200px]">
                            {description ? (
                                <p className="text-xs text-primary-600 line-clamp-2">
                                    {description}
                                </p>
                            ) : (
                                <span className="text-xs text-primary-400">No description</span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "createdAt",
                accessorKey: "createdAt",
                enableSorting: false,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Created" />
                ),
                cell: ({ row }) => {
                    return (
                        <div className="text-xs text-primary-600">
                            {formatRelativeTime(row.original.createdAt)}
                        </div>
                    );
                },
            },
            {
                id: "actions",
                header: () => <div className="text-right pr-2">Actions</div>,
                enableSorting: false,
                cell: ({ row }) => {
                    const client = row.original;
                    return (
                        <div className="flex justify-end pr-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(client)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Client
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleCopyClientId(client.clientId)}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Client ID
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRegenerateSecret(client)}>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Regenerate Secret
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => handleDelete(client)}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Client
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
                enableHiding: false,
            },
        ],
        [deleteClientMutation, regenerateSecretMutation]
    );

    const { table, isLoading, isFetching } = useOAuthClientsTable({
        columns,
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
                    <div className="flex items-center gap-4">
                        <span className="text-xl text-primary-800 font-medium whitespace-nowrap">
                            {title}
                        </span>

                        {isFetching && !isLoading && (
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                            </div>
                        )}
                    </div>

                    <div className="flex w-full gap-2 items-center justify-end">
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


                        <CreateOAuthClientDialog />

                    </div>
                </div>

                {viewMode === "table" ? (
                    <ScrollArea className="relative h-[calc(100vh-560px)] hidebar overflow-y-auto">
                        <div className="w-full hidebar pb-8">
                            <DataTable table={table} />
                        </div>
                    </ScrollArea>
                ) : (
                    <OAuthClientsGridView rows={table.getRowModel().rows} />
                )}
            </div>
        </>
    );
}
