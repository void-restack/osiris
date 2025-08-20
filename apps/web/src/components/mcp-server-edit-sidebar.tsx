import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { PermissionSelector, type Permission } from "./ui/permission-selector";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
    useUpdateDeploymentPolicyMutation,
    useUpdateDeploymentMutation,
    useUpdateSecretSharingMutation,
    useUpdateWalletMutation
} from "@/lib/mutations";
import { useQuery } from "@tanstack/react-query";
import { packageQueries } from "@/lib/queries";
import PolicyBuilder from "./policy-builder";
import { getPackageRequiredScopes, getCurrentScopesAsPermissions } from "@/lib/scope-utils";
import { getScopeDisplayName } from "@/lib/scope-definitions";

export function McpServerEditSidebar() {
    const { mcpId } = useParams({ from: "/_hub/mcp/$mcpId" });
    const { selectedMcpServer, closeMcpServerEditSidebar, isMcpServerEditSidebarOpen } = useAppStore();
    const [selectedScopes, setSelectedScopes] = useState<Permission[]>([]);
    const [initialScopes, setInitialScopes] = useState<Permission[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [policyValue, setPolicyValue] = useState<string>("");
    const [initialPolicyValue, setInitialPolicyValue] = useState<string>("");

    const updatePolicyMutation = useUpdateDeploymentPolicyMutation();
    const updateDeploymentMutation = useUpdateDeploymentMutation();
    const updateSecretSharingMutation = useUpdateSecretSharingMutation();
    const updateWalletMutation = useUpdateWalletMutation();

    const currentDeployment = selectedMcpServer;

    const serviceClientInfo = currentDeployment?.userServiceConnectionMcpDeployments?.[0]?.serviceClient;
    const serviceClientType = serviceClientInfo?.type; // 'oauth' | 'secret_sharing' | 'embedded_wallet'
    const serviceClientName = serviceClientInfo?.name;
    const connectionId = currentDeployment?.userServiceConnectionMcpDeployments?.[0]?.connectionId;

    const { data: availableScopes } = useQuery({
        ...packageQueries.authScopesOptions(mcpId || ""),
        enabled: !!mcpId,
    });

    const packageRequiredScopes = getPackageRequiredScopes(availableScopes);
    const currentScopesAsPermissions = currentDeployment ? getCurrentScopesAsPermissions(currentDeployment) : [];
    const availablePermissions = packageRequiredScopes;

    useEffect(() => {
        if (selectedMcpServer && currentDeployment) {
            const deploymentScopes = getCurrentScopesAsPermissions(currentDeployment);

            setSelectedScopes([...deploymentScopes]);
            setInitialScopes([...deploymentScopes]);

            // Get policy from the userServiceConnectionMcpDeployments array
            let policyToUse = { allow: [], deny: [] };
            if (currentDeployment?.userServiceConnectionMcpDeployments?.[0]?.policy) {
                // Use the policy exactly as it comes from the API
                policyToUse = currentDeployment.userServiceConnectionMcpDeployments[0].policy;
                console.log('MCP Server Edit Sidebar - Raw policy from API:', currentDeployment.userServiceConnectionMcpDeployments[0].policy);
                console.log('MCP Server Edit Sidebar - Policy to use:', policyToUse);
                console.log('MCP Server Edit Sidebar - Policy allow array:', policyToUse.allow);
                console.log('MCP Server Edit Sidebar - Policy allow array length:', policyToUse.allow?.length);
                console.log('MCP Server Edit Sidebar - First allow item:', policyToUse.allow?.[0]);
                console.log('MCP Server Edit Sidebar - First allow item keys:', policyToUse.allow?.[0] ? Object.keys(policyToUse.allow[0]) : 'undefined');
            }

            const policyJson = JSON.stringify(policyToUse, null, 2);
            console.log('MCP Server Edit Sidebar - Original Policy from API:', policyToUse);
            console.log('MCP Server Edit Sidebar - Policy JSON to set:', policyJson);
            setPolicyValue(policyJson);
            setInitialPolicyValue(policyJson);

            setHasChanges(false);
        } else {
            // Clear state when no server selected
            setSelectedScopes([]);
            setInitialScopes([]);
            setPolicyValue("");
            setInitialPolicyValue("");
            setHasChanges(false);
        }
    }, [selectedMcpServer, currentDeployment]);

    const checkForChanges = () => {
        if (!selectedMcpServer) return false;

        const currentScopeIds = selectedScopes.map(s => s.id).sort();
        const initialScopeIds = initialScopes.map(s => s.id).sort();
        const scopesChanged = JSON.stringify(currentScopeIds) !== JSON.stringify(initialScopeIds);

        const policyChanged = policyValue !== initialPolicyValue;

        return scopesChanged || policyChanged;
    };

    useEffect(() => {
        setHasChanges(checkForChanges());
    }, [selectedScopes, initialScopes, policyValue, initialPolicyValue]);

    const handleScopeChange = (scopes: Permission[]) => {
        setSelectedScopes(scopes);
    };

    const handlePolicyChange = (value: string) => {
        console.log('MCP Server Edit Sidebar - Policy changed by PolicyBuilder:', value);
        setPolicyValue(value);
    };

    const handleSave = async () => {
        if (!selectedMcpServer || !hasChanges) return;

        setIsLoading(true);
        try {
            const scopesChanged = JSON.stringify(selectedScopes.map(s => s.id).sort()) !== JSON.stringify(initialScopes.map(s => s.id).sort());
            const policyChanged = policyValue !== initialPolicyValue;

            // Handle scopes update based on service client type
            if (scopesChanged) {
                await handleScopesUpdate();
            }

            // Handle policy update for embedded wallets
            if (policyChanged && serviceClientType === 'embedded_wallet') {
                await handlePolicyUpdate();
            }

            setHasChanges(false);
            toast.success("MCP server updated successfully");
        } catch (error) {
            console.error('Error updating MCP server:', error);
            toast.error("Failed to update MCP server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleScopesUpdate = async () => {
        if (!selectedMcpServer || !connectionId) return;

        const newScopes = selectedScopes.map(s => s.id);

        try {
            switch (serviceClientType) {
                case 'oauth':
                    // For OAuth, update the deployment connection scopes
                    await updateDeploymentMutation.mutateAsync({
                        deploymentId: selectedMcpServer.deploymentId,
                        connections: {
                            [connectionId]: {
                                scopes: newScopes
                            }
                        }
                    });
                    break;

                case 'secret_sharing':
                    // For secret sharing, update the connection scopes
                    await updateSecretSharingMutation.mutateAsync({
                        id: connectionId,
                        secret: {
                            // Keep existing secret data, just update scopes if needed
                            scopes: newScopes
                        }
                    });
                    break;

                case 'embedded_wallet':
                    // For embedded wallet, update the wallet policy/configuration
                    await updateWalletMutation.mutateAsync({
                        id: connectionId,
                        policy: {
                            scopes: newScopes,
                            // Keep existing policy data
                        }
                    });
                    break;

                default:
                    throw new Error(`Unsupported service client type: ${serviceClientType}`);
            }

            setInitialScopes(selectedScopes);
        } catch (error) {
            console.error('Failed to update scopes:', error);
            throw error;
        }
    };

    const handlePolicyUpdate = async () => {
        if (!selectedMcpServer) return;

        let policy;
        try {
            policy = JSON.parse(policyValue);
        } catch (error) {
            toast.error("Invalid policy JSON format");
            throw error;
        }

        await updatePolicyMutation.mutateAsync({
            deploymentId: selectedMcpServer.deploymentId,
            policy: policy
        });

        setInitialPolicyValue(policyValue);
    };

    const handleCancel = () => {
        setSelectedScopes(initialScopes);
        setPolicyValue(initialPolicyValue);
        setHasChanges(false);
        closeMcpServerEditSidebar();
    };

    const renderConfigurationSection = () => {
        if (!serviceClientType) {
            return (
                <div className="text-sm text-primary-500 bg-primary-50 p-3 rounded">
                    Unable to determine service client type for this deployment.
                </div>
            );
        }

        switch (serviceClientType) {
            case 'oauth':
                return (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="text-xs text-primary-500">OAuth Scopes & Permissions</Label>
                            <div className="flex flex-wrap gap-2">
                                {currentScopesAsPermissions.length > 0 ? (
                                    currentScopesAsPermissions.map((scope: Permission) => (
                                        <Badge key={scope.id} variant="secondary" className="text-xs">
                                            {getScopeDisplayName(scope.id)}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-primary-400">No scopes selected</span>
                                )}
                            </div>
                            {availablePermissions.length > 0 && selectedMcpServer && (
                                <PermissionSelector
                                    context="mcp-server-edit-sidebar"
                                    key={`oauth-${selectedMcpServer.deploymentId}-${currentScopesAsPermissions.map(s => s.id).join(',')}`}
                                    permissions={availablePermissions}
                                    initialSelected={currentScopesAsPermissions}
                                    onSelectionChange={handleScopeChange}
                                    placeholder="Select OAuth scopes..."
                                />
                            )}
                        </div>
                    </div>
                );

            case 'embedded_wallet':
                return (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="text-xs text-primary-500">Wallet Policy Configuration</Label>
                            <PolicyBuilder
                                value={policyValue}
                                onChange={handlePolicyChange}
                            />
                        </div>
                    </div>
                );

            case 'secret_sharing':
                return (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="text-xs text-primary-500">Database Connection Scopes</Label>
                            <div className="flex flex-wrap gap-2">
                                {currentScopesAsPermissions.length > 0 ? (
                                    currentScopesAsPermissions.map((scope: Permission) => (
                                        <Badge key={scope.id} variant="secondary" className="text-xs">
                                            {getScopeDisplayName(scope.id)}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-primary-400">No scopes configured</span>
                                )}
                            </div>
                            {availablePermissions.length > 0 && selectedMcpServer && (
                                <PermissionSelector
                                    context="mcp-server-edit-sidebar"
                                    key={`secret-${selectedMcpServer.deploymentId}-${currentScopesAsPermissions.map(s => s.id).join(',')}`}
                                    permissions={availablePermissions}
                                    initialSelected={currentScopesAsPermissions}
                                    onSelectionChange={handleScopeChange}
                                    placeholder="Select database scopes..."
                                />
                            )}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-sm text-primary-500 bg-primary-50 p-3 rounded">
                        Configuration not available for service client type: {serviceClientType}
                    </div>
                );
        }
    };

    if (!selectedMcpServer || !isMcpServerEditSidebarOpen) {
        return null;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-primary-100">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-primary-800">
                        Deployment {selectedMcpServer.deploymentId.slice(0, 8)}...{selectedMcpServer.deploymentId.slice(-8)}
                    </h2>
                    {serviceClientName && (
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                                {serviceClientName}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                {serviceClientType}
                            </Badge>
                        </div>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeMcpServerEditSidebar}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                    {/* Server Information */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-primary-800">Server Information</h3>
                        <div className="space-y-3">
                            {selectedMcpServer.url && (
                                <div>
                                    <Label className="text-xs text-primary-500">URL</Label>
                                    <div className="mt-1 text-sm text-primary-700 font-mono bg-primary-50 p-2 rounded">
                                        {selectedMcpServer.url}
                                    </div>
                                </div>
                            )}
                            <div>
                                <Label className="text-xs text-primary-500">Created</Label>
                                <div className="mt-1 text-sm text-primary-700">
                                    {new Date(selectedMcpServer.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Configuration Section */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-primary-800">Configuration</h3>
                        {renderConfigurationSection()}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-primary-100 space-y-3">
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="flex-1"
                        disabled={isLoading}
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
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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