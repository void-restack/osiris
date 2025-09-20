import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OAuthClient } from "@/types";
import type { Row } from "@tanstack/react-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { OAuthClientData } from "@/lib/store";
import {
    MoreHorizontal,
    Edit,
    Trash2,
    RefreshCw,
    Copy,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    useDeleteOAuthClientMutation,
    useRegenerateOAuthSecretMutation
} from "@/lib/mutations";

interface OAuthClientsGridViewProps {
    rows: Row<OAuthClient>[];
}

export function OAuthClientsGridView({ rows }: OAuthClientsGridViewProps) {
    const { openOAuthClientEditSidebar } = useAppStore();
    const deleteClientMutation = useDeleteOAuthClientMutation();
    const regenerateSecretMutation = useRegenerateOAuthSecretMutation();

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

    const handleCopyClientId = (clientId: string) => {
        navigator.clipboard.writeText(clientId);
        toast.success("Client ID copied to clipboard");
    };

    const handleRegenerateSecret = (client: OAuthClient) => {
        if (confirm(`Are you sure you want to regenerate the client secret for "${client.name}"? The old secret will stop working.`)) {
            regenerateSecretMutation.mutate(client.clientId);
        }
    };

    const handleDelete = (client: OAuthClient) => {
        if (confirm(`Are you sure you want to delete "${client.name}"? This action cannot be undone.`)) {
            deleteClientMutation.mutate(client.clientId);
        }
    };

    return (
        <ScrollArea className="relative h-[calc(100vh-560px)] hidebar">
            <div className="grid w-full gap-6 p-2 pb-24 sm:pb-28 hidebar [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
                {rows.map((row) => {
                    const client = row.original;
                    const description = client.metadata?.description || client.metadata?.purpose;

                    return (
                        <div
                            key={row.id}
                            className="min-h-[200px] group hover:shadow-md transition-shadow duration-200 p-4 inset-shadow-card rounded-xl bg-primary-00 opacity-100 min-w-[348px] overflow-hidden cursor-pointer relative"
                            onClick={() => handleEdit(client)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex flex-col items-start gap-3 min-w-0 flex-1">
                                    <Avatar className="size-12 rounded-sm shrink-0">
                                        <AvatarImage src={client.iconUrl || "/logo.png"} alt={client.name} />
                                        <AvatarFallback className="size-12 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                                            {client.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-medium text-primary-800 truncate">
                                            {client.name}
                                        </h4>
                                        <p className="text-[13px] text-primary-300 truncate">
                                            {client.clientId.slice(0, 8)}...{client.clientId.slice(-8)}
                                        </p>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        asChild
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Open menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(client);
                                        }}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Client
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyClientId(client.clientId);
                                        }}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy Client ID
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleRegenerateSecret(client);
                                        }}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Regenerate Secret
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(client);
                                            }}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Client
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div>
                                <div className="space-y-1">
                                    {client.redirectUris.slice(0, 2).map((uri, index) => (
                                        <Badge variant="secondary" className="text-xs rounded-[6px] text-[13px] p-0 px-1">
                                            {uri}
                                        </Badge>
                                    ))}
                                    {client.redirectUris.length > 2 && (
                                        <p className="text-xs text-primary-400">
                                            +{client.redirectUris.length - 2} more
                                        </p>
                                    )}
                                </div>
                            </div>

                            {description && (
                                <div className="mb-4 absolute bottom-0 left-3 right-3">
                                    <p className="text-xs text-primary-600 line-clamp-3 truncate">
                                        {description}
                                    </p>
                                </div>
                            )}

                            {/* <div className="space-y-3"> */}
                            {/* <div>
                                    <p className="text-xs font-medium text-primary-700 mb-1">Redirect URIs</p>
                                    <div className="space-y-1">
                                        {client.redirectUris.slice(0, 2).map((uri, index) => (
                                            <p key={index} className="text-xs text-primary-500 truncate">
                                                {uri}
                                            </p>
                                        ))}
                                        {client.redirectUris.length > 2 && (
                                            <p className="text-xs text-primary-400">
                                                +{client.redirectUris.length - 2} more
                                            </p>
                                        )}
                                    </div>
                                </div> */}

                            {/* <div className="flex items-center justify-between pt-2 border-t border-primary-100">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs rounded-[6px] text-[13px]">
                                            OAuth Client
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-primary-400">
                                        {formatRelativeTime(client.createdAt)}
                                    </div>
                                </div> */}
                            {/* </div> */}
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
