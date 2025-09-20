import { X, Loader2, Plus, Trash2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { useUpdateOAuthClientMutation, useRegenerateOAuthSecretMutation } from "@/lib/mutations";
import { useQuery } from "@tanstack/react-query";
import { hubQueries } from "@/lib/queries";
import { formatRelativeTime } from "@/lib/format";

export function OAuthClientEditSidebar() {
    const {
        selectedOAuthClient,
        closeOAuthClientEditSidebar,
        isOAuthClientEditSidebarOpen,
        updateSelectedOAuthClient
    } = useAppStore();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [redirectUris, setRedirectUris] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showClientSecret, setShowClientSecret] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    const updateClientMutation = useUpdateOAuthClientMutation();
    const regenerateSecretMutation = useRegenerateOAuthSecretMutation();

    // Fetch the latest client data
    const { data: clientData, isLoading: isClientDataLoading } = useQuery({
        ...hubQueries.oauthClientOptions(selectedOAuthClient?.clientId || ""),
        enabled: !!selectedOAuthClient?.clientId,
    });

    // Initialize form data when client is selected
    useEffect(() => {
        if (selectedOAuthClient) {
            setName(selectedOAuthClient.name);
            setDescription(selectedOAuthClient.metadata?.description || "");
            setRedirectUris(selectedOAuthClient.redirectUris.length > 0 ? selectedOAuthClient.redirectUris : [""]);
            setHasChanges(false);
            setShowClientSecret(false);
            setClientSecret(null);
        }
    }, [selectedOAuthClient]);

    // Track changes
    useEffect(() => {
        if (selectedOAuthClient) {
            const nameChanged = name !== selectedOAuthClient.name;
            const descriptionChanged = description !== (selectedOAuthClient.metadata?.description || "");
            const urisChanged = JSON.stringify(redirectUris.filter(uri => uri.trim())) !==
                JSON.stringify(selectedOAuthClient.redirectUris);

            setHasChanges(nameChanged || descriptionChanged || urisChanged);
        }
    }, [name, description, redirectUris, selectedOAuthClient]);

    const handleAddRedirectUri = () => {
        setRedirectUris([...redirectUris, ""]);
    };

    const handleRemoveRedirectUri = (index: number) => {
        if (redirectUris.length > 1) {
            setRedirectUris(redirectUris.filter((_, i) => i !== index));
        }
    };

    const handleUpdateRedirectUri = (index: number, value: string) => {
        const updated = [...redirectUris];
        updated[index] = value;
        setRedirectUris(updated);
    };

    const handleSave = async () => {
        if (!selectedOAuthClient || !hasChanges) return;

        const validUris = redirectUris.filter(uri => uri.trim() !== "");
        if (validUris.length === 0) {
            toast.error("At least one redirect URI is required");
            return;
        }

        if (!name.trim()) {
            toast.error("Client name is required");
            return;
        }

        setIsLoading(true);
        try {
            const updatedClient = await updateClientMutation.mutateAsync({
                clientId: selectedOAuthClient.clientId,
                name: name.trim(),
                redirectUris: validUris,
                metadata: description.trim() ? { description: description.trim() } : {},
            });

            // Update the selected client in the store
            updateSelectedOAuthClient(updatedClient);
            setHasChanges(false);
        } catch (error) {
            console.error("Failed to update OAuth client:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateSecret = async () => {
        if (!selectedOAuthClient) return;

        if (!confirm("Are you sure you want to regenerate the client secret? The old secret will stop working immediately.")) {
            return;
        }

        try {
            const result = await regenerateSecretMutation.mutateAsync(selectedOAuthClient.clientId);
            setClientSecret(result.clientSecret);
            setShowClientSecret(true);
        } catch (error) {
            console.error("Failed to regenerate client secret:", error);
        }
    };

    const handleCopyClientId = () => {
        if (selectedOAuthClient) {
            navigator.clipboard.writeText(selectedOAuthClient.clientId);
            toast.success("Client ID copied to clipboard");
        }
    };

    const handleCopyClientSecret = () => {
        if (clientSecret) {
            navigator.clipboard.writeText(clientSecret);
            toast.success("Client secret copied to clipboard");
        }
    };

    if (!isOAuthClientEditSidebarOpen || !selectedOAuthClient) {
        return null;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-primary-100">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-primary-800">Edit OAuth Client</h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeOAuthClientEditSidebar}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {isClientDataLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Client Info */}
                        <div className="space-y-[6px]">
                            <Label className="text-[13px] text-primary-400">Client ID</Label>
                            <div className="flex items-center gap-2">
                                <div className="rounded-md bg-primary-50 px-3 py-2 font-mono text-primary-400 text-sm truncate flex-1" title={selectedOAuthClient.clientId}>
                                    {selectedOAuthClient.clientId}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopyClientId}
                                    className="h-8 w-8 p-0"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-[6px]">
                            <Label className="text-[13px] text-primary-400">Created</Label>
                            <div className="rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-400">
                                {formatRelativeTime(selectedOAuthClient.createdAt)}
                            </div>
                        </div>

                        <div className="border-t border-t-primary-100 border-dashed" />

                        {/* Editable Fields */}
                        <div className="space-y-[6px]">
                            <Label htmlFor="client-name" className="text-[13px] text-primary-400">
                                Client Name
                            </Label>
                            <Input
                                id="client-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My Application"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-[6px]">
                            <Label htmlFor="client-description" className="text-[13px] text-primary-400">
                                Description
                            </Label>
                            <Textarea
                                id="client-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief description of your application"
                                rows={3}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-[6px]">
                            <Label className="text-[13px] text-primary-400">
                                Redirect URIs
                            </Label>
                            <div className="space-y-2">
                                {redirectUris.map((uri, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            value={uri}
                                            onChange={(e) => handleUpdateRedirectUri(index, e.target.value)}
                                            placeholder="http://localhost:3000/callback"
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveRedirectUri(index)}
                                            disabled={redirectUris.length === 1}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddRedirectUri}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Redirect URI
                                </Button>
                            </div>
                        </div>

                        <div className="border-t border-t-primary-100 border-dashed" />

                        {/* Client Secret Section */}
                        <div className="space-y-[6px]">
                            <div className="flex items-center justify-between">
                                <Label className="text-[13px] text-primary-400">Client Secret</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRegenerateSecret}
                                    disabled={regenerateSecretMutation.isPending}
                                >
                                    {regenerateSecretMutation.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                    ) : null}
                                    Regenerate Secret
                                </Button>
                            </div>

                            {showClientSecret && clientSecret ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={clientSecret}
                                            readOnly
                                            className="font-mono text-xs flex-1"
                                            type="password"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopyClientSecret}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                        <p className="text-xs text-amber-800">
                                            <strong>Important:</strong> Store this secret securely. You won't be able to see it again after closing this panel.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-primary-400">
                                    The client secret is hidden for security. Use "Regenerate Secret" to create a new one.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-primary-100 space-y-3">
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={closeOAuthClientEditSidebar}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1"
                        disabled={!hasChanges || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
