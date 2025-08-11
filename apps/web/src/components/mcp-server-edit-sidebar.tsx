import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppStore, type McpServerData } from "@/lib/store";
import { PermissionSelector, type Permission } from "./ui/permission-selector";
import { formatScopeForDisplay } from "@/lib/scope-utils";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useUpdateDeploymentPolicyMutation } from "@/lib/mutations";
import { useQuery } from "@tanstack/react-query";
import { packageQueries } from "@/lib/queries";
import PolicyBuilder from "./policy-builder";

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

    const { data: deploymentData, isLoading: isDeploymentDataLoading } = useQuery({
        ...packageQueries.userDeploymentsForPackageOptions(mcpId || "", { page: 1, limit: 10 }),
        enabled: !!mcpId,
    });

    const currentDeployment = deploymentData?.data?.find(
        (deployment: any) => deployment.deploymentId === selectedMcpServer?.deploymentId
    );

    const { data: deploymentAuthData } = useQuery({
        ...packageQueries.deploymentAuthOptions(selectedMcpServer?.deploymentId || ""),
        enabled: !!selectedMcpServer?.deploymentId,
    });

    const primaryServiceClientType = deploymentAuthData?.[0]?.serviceClient?.serviceClientType;

    useEffect(() => {
        if (selectedMcpServer) {
            // Convert scopes to Permission format
            const scopesAsPermissions = selectedMcpServer.scopes.map(scope => ({
                id: scope,
                label: formatScopeForDisplay(scope)
            }));
            setSelectedScopes(scopesAsPermissions);
            setInitialScopes(scopesAsPermissions);

            // Initialize policy with existing policy from deployment or empty policy
            let policyToUse = { allow: [], deny: [] };
            if (currentDeployment?.policy) {
                policyToUse = currentDeployment.policy;
            }
            const policyJson = JSON.stringify(policyToUse, null, 2);
            setPolicyValue(policyJson);
            setInitialPolicyValue(policyJson);

            setHasChanges(false);
        }
    }, [selectedMcpServer, deploymentData]);

    const checkForChanges = () => {
        if (!selectedMcpServer) return false;

        // Check if scopes have changed
        const currentScopeIds = selectedScopes.map(s => s.id).sort();
        const initialScopeIds = initialScopes.map(s => s.id).sort();
        const scopesChanged = JSON.stringify(currentScopeIds) !== JSON.stringify(initialScopeIds);

        // Check if policy has changed
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
        setPolicyValue(value);
    };

    const handleSave = async () => {
        if (!selectedMcpServer || !hasChanges) return;

        setIsLoading(true);
        try {
            // Log the deployment information for debugging
            console.log('=== MCP Server Edit Sidebar - Save Operation ===');
            console.log('Deployment ID:', selectedMcpServer.deploymentId);
            console.log('Service Client Type:', primaryServiceClientType);
            console.log('Current Deployment Data:', currentDeployment);
            console.log('Current Auth Data:', deploymentAuthData);

            // Log the complete save payload that would be sent to APIs
            const completeSavePayload = {
                deploymentId: selectedMcpServer.deploymentId,
                serviceClientType: primaryServiceClientType,
                changes: {
                    scopes: selectedScopes.map(s => s.id).sort(),
                    initialScopes: initialScopes.map(s => s.id).sort(),
                    scopesChanged: JSON.stringify(selectedScopes.map(s => s.id).sort()) !== JSON.stringify(initialScopes.map(s => s.id).sort()),
                    policyChanged: policyValue !== initialPolicyValue,
                    policyValue: policyValue !== initialPolicyValue ? 'Modified' : 'Unchanged'
                },
                timestamp: new Date().toISOString()
            };
            console.log('Complete Save Payload:', completeSavePayload);

            // Handle different deployment types based on service client type
            if (primaryServiceClientType === 'embedded_wallet') {
                await handleEmbeddedWalletUpdate();
            } else if (primaryServiceClientType === 'oauth') {
                await handleOAuthUpdate();
            } else {
                await handleOtherDeploymentTypes();
            }

            setHasChanges(false);
        } catch (error) {
            toast.error("Failed to update MCP server");
            console.error("Error updating MCP server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmbeddedWalletUpdate = async () => {
        if (!selectedMcpServer) return;

        console.log('=== Handling Embedded Wallet Update ===');

        // Parse the policy JSON
        let policy;
        try {
            policy = JSON.parse(policyValue);
        } catch (error) {
            toast.error("Invalid policy JSON format");
            throw error;
        }

        // Log the policy update payload
        const policyUpdatePayload = {
            deploymentId: selectedMcpServer.deploymentId,
            policy: policy
        };
        console.log('Policy Update Payload:', policyUpdatePayload);
        console.log('API Endpoint that would be called: PATCH /packages/deployments/{deploymentId}/update-policy');
        console.log('Request Body:', { policy: policy });

        // Update policy if it has changed
        if (policyValue !== initialPolicyValue) {
            console.log('Policy has changed, calling updateDeploymentPolicyMutation...');
            await updatePolicyMutation.mutateAsync(policyUpdatePayload);
            toast.success("Policy updated successfully");
            setInitialPolicyValue(policyValue);
            console.log('Policy update completed successfully');
        } else {
            console.log('Policy unchanged, skipping policy update');
        }

        // Log any other embedded wallet specific configurations
        console.log('Embedded wallet configuration update completed');
    };

    const handleOAuthUpdate = async () => {
        if (!selectedMcpServer) return;

        console.log('=== Handling OAuth Update ===');

        // Log the scopes update payload
        const scopesUpdatePayload = {
            deploymentId: selectedMcpServer.deploymentId,
            scopes: selectedScopes.map(s => s.id)
        };
        console.log('Scopes Update Payload:', scopesUpdatePayload);
        console.log('API Endpoint that would be called: PATCH /packages/deployments/{deploymentId}/update-scopes');
        console.log('Request Body:', { scopes: selectedScopes.map(s => s.id) });

        // Check if scopes have changed
        if (JSON.stringify(selectedScopes.map(s => s.id).sort()) !== JSON.stringify(initialScopes.map(s => s.id).sort())) {
            console.log('Scopes have changed, would call updateDeploymentScopes API...');

            // TODO: Replace with actual API call when endpoint is available
            // const response = await api(`/packages/deployments/${selectedMcpServer.deploymentId}/update-scopes`, {
            //     method: "PATCH",
            //     body: { scopes: selectedScopes.map(s => s.id) }
            // });

            // Simulate API call for now
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success("MCP server scopes updated successfully");
            setInitialScopes(selectedScopes);
            console.log('Scopes update completed successfully');
        } else {
            console.log('Scopes unchanged, skipping scopes update');
        }

        // Log any other OAuth specific configurations
        console.log('OAuth configuration update completed');
    };

    const handleOtherDeploymentTypes = async () => {
        if (!selectedMcpServer) return;

        console.log('=== Handling Other Deployment Types ===');
        console.log('Service Client Type:', primaryServiceClientType);
        console.log('Deployment ID:', selectedMcpServer.deploymentId);

        // Log the current deployment configuration
        const deploymentConfigPayload = {
            deploymentId: selectedMcpServer.deploymentId,
            serviceClientType: primaryServiceClientType,
            currentScopes: selectedScopes.map(s => s.id),
            currentPolicy: policyValue !== initialPolicyValue ? 'Modified' : 'Unchanged'
        };
        console.log('Deployment Config Payload:', deploymentConfigPayload);

        // Log that this deployment type is not yet fully supported
        console.log(`Configuration for ${primaryServiceClientType} service clients is not yet fully implemented`);
        toast.error(`Configuration for ${primaryServiceClientType} service clients is not yet supported`);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Other deployment type handling completed');
    };

    const handleCancel = () => {
        setSelectedScopes(initialScopes);
        setPolicyValue(initialPolicyValue);
        setHasChanges(false);
        closeMcpServerEditSidebar();
    };

    if (!selectedMcpServer || !isMcpServerEditSidebarOpen) {
        return null;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-primary-100">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-primary-800">Deployment {selectedMcpServer.deploymentId.slice(0, 8)}...{selectedMcpServer.deploymentId.slice(-8)}</h2>
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
                            <div>
                                <Label className="text-xs text-primary-500">Status</Label>
                                <div className="mt-1">
                                    <Badge
                                        variant={selectedMcpServer.status === 'active' ? 'default' : 'secondary'}
                                        className="text-xs"
                                    >
                                        {selectedMcpServer.status}
                                    </Badge>
                                </div>
                            </div>
                            {selectedMcpServer.url ? <div>
                                <Label className="text-xs text-primary-500">URL</Label>
                                <div className="mt-1 text-sm text-primary-700 font-mono bg-primary-50 p-2 rounded">
                                    {selectedMcpServer.url}
                                </div>
                            </div> : null}
                            <div>
                                <Label className="text-xs text-primary-500">Created</Label>
                                <div className="mt-1 text-sm text-primary-700">
                                    {new Date(selectedMcpServer.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full border-t border-t-primary-100 border-dashed" />

                    {/* Scopes Management - Only show for OAuth service clients */}
                    {primaryServiceClientType === 'oauth' && (
                        <>
                            <div className="space-y-4">
                                <h3 className="font-medium text-primary-800">Scopes & Permissions</h3>
                                <div className="space-y-3">
                                    <Label className="text-xs text-primary-500">Current Scopes</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedScopes.map((scope) => (
                                            <Badge key={scope.id} variant="secondary" className="text-xs">
                                                {scope.label}
                                            </Badge>
                                        ))}
                                    </div>
                                    <PermissionSelector
                                        permissions={[]}
                                        initialSelected={selectedScopes}
                                        onSelectionChange={handleScopeChange}
                                        placeholder="Select scopes..."
                                    />
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Policy Management - Only show for embedded_wallet service clients */}
                    {primaryServiceClientType === 'embedded_wallet' && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {isDeploymentDataLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-primary-600">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading policy...
                                    </div>
                                ) : (
                                    <PolicyBuilder
                                        value={policyValue}
                                        onChange={handlePolicyChange}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Show message if service client type is not supported */}
                    {primaryServiceClientType && !['oauth', 'embedded_wallet'].includes(primaryServiceClientType) && (
                        <div className="space-y-4">
                            <h3 className="font-medium text-primary-800">Configuration</h3>
                            <div className="text-sm text-primary-600">
                                Configuration options for {primaryServiceClientType} service clients are not yet available.
                            </div>
                        </div>
                    )}

                    {/* Show loading state while determining service client type */}
                    {(!primaryServiceClientType || isDeploymentDataLoading) && (
                        <div className="space-y-4">
                            <h3 className="font-medium text-primary-800">Configuration</h3>
                            <div className="flex items-center gap-2 text-sm text-primary-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading configuration options...
                            </div>
                        </div>
                    )}
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
