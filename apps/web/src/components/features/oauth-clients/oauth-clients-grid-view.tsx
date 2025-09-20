import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { OAuthClient } from "@/types";
import type { Row } from "@tanstack/react-table";
import { useAppStore } from "@/lib/store";
import type { OAuthClientData } from "@/lib/store";
import {
    RefreshCw,
    Copy,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
    useDeleteOAuthClientMutation,
    useRegenerateOAuthSecretMutation
} from "@/lib/mutations";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface OAuthClientsGridViewProps {
    rows: Row<OAuthClient>[];
}

export function OAuthClientsGridView({ rows }: OAuthClientsGridViewProps) {
    const { openOAuthClientEditSidebar } = useAppStore();
    const deleteClientMutation = useDeleteOAuthClientMutation();
    const regenerateSecretMutation = useRegenerateOAuthSecretMutation();

    const [regeneratingClients, setRegeneratingClients] = useState<Record<string, boolean>>({});

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

    const handleRegenerateSecret = async (client: OAuthClient) => {
        if (!confirm(`Are you sure you want to regenerate the client secret for "${client.name}"? The old secret will stop working immediately.`)) {
            return;
        }

        setRegeneratingClients(prev => ({ ...prev, [client.clientId]: true }));

        try {
            const result = await regenerateSecretMutation.mutateAsync(client.clientId);

            // Immediately copy the secret to clipboard
            navigator.clipboard.writeText(result.clientSecret);
            toast.success("Client secret regenerated and copied to clipboard");

        } catch (error) {
            console.error("Failed to regenerate client secret:", error);
            toast.error("Failed to regenerate client secret");
        } finally {
            setRegeneratingClients(prev => ({ ...prev, [client.clientId]: false }));
        }
    };

    // const handleDelete = (client: OAuthClient) => {
    //     if (confirm(`Are you sure you want to delete "${client.name}"? This action cannot be undone.`)) {
    //         deleteClientMutation.mutate(client.clientId);
    //     }
    // };

    return (
        <div className="grid w-full gap-6 p-2 pb-6 hidebar [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {rows.map((row) => {
                const client = row.original;
                const description = client.metadata?.description || client.metadata?.purpose;

                return (
                    <div
                        key={row.id}
                        className="min-h-[200px] group hover:shadow-md transition-shadow duration-200 inset-shadow-card rounded-[12px] bg-primary-00 opacity-100 overflow-hidden cursor-pointer relative"
                        onClick={() => handleEdit(client)}
                    >
                        <div className="p-3">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex flex-col items-start gap-4 min-w-0 flex-1">
                                    <Avatar className="size-12 rounded-sm shrink-0">
                                        <AvatarImage src={client.iconUrl || "/logo.png"} alt={client.name} />
                                        <AvatarFallback className="size-12 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                                            {client.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-primary-800 truncate">
                                            {client.name}
                                        </h4>
                                        <p className="text-[13px] text-primary-300 truncate">
                                            {client.clientId.slice(0, 8)}...{client.clientId.slice(-8)}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="secondary" onClick={() => handleEdit(client)} size="xs" className="bg-primary-50 py-0.5 px-2 h-fit rounded-sm text-primary-400">
                                    <span className="text-xs">View more</span>
                                </Button>
                            </div>

                            {/* <div>
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
                        </div> */}

                            {description && (
                                <div className="">
                                    <p className="text-xs text-primary-600 line-clamp-3 truncate">
                                        {description}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-primary-100 h-16 w-full flex items-center px-3 bg-primary-25">
                            <div className="flex items-center justify-between gap-4 w-full">
                                <span className="text-xs text-primary-300 whitespace-nowrap">Secret Key</span>
                                <div className="flex w-full rounded-md shadow-xs">

                                    <Input
                                        className="-me-px flex-1 items-center rounded-e-none bg-primary-00 shadow-none focus-visible:z-10 h-8 text-xs font-mono"
                                        placeholder="***********"
                                        readOnly
                                        disabled
                                        onFocus={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }}

                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }}
                                    />
                                    <button
                                        className="border-input bg-primary-50 text-muted-foreground/80 hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex w-9 items-center justify-center rounded-e-md border text-sm transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleRegenerateSecret(client);
                                        }}
                                        disabled={regeneratingClients[client.clientId]}
                                    >
                                        {regeneratingClients[client.clientId] ? (
                                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                        ) : (
                                            <RefreshCw size={16} aria-hidden="true" />
                                        )}
                                    </button>

                                </div>
                            </div>
                        </div>

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
        </div >
    );
}
