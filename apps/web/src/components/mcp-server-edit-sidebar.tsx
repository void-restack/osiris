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
import { useUpdateDeploymentPolicyMutation } from "@/lib/mutations";
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

    const { data: deploymentData, isLoading: isDeploymentDataLoading } = useQuery({
        ...packageQueries.userDeploymentsForPackageOptions(mcpId || "", { page: 1, limit: 10 }),
        enabled: !!mcpId,
    });

    const currentDeployment = deploymentData?.data?.find(
        (deployment: any) => deployment.deploymentId === selectedMcpServer?.deploymentId
    );

    // Add query to fetch available scopes for the package
    const { data: availableScopes } = useQuery({
        ...packageQueries.authScopesOptions(mcpId || ""),
        enabled: !!mcpId,
    });

    const packageRequiredScopes = getPackageRequiredScopes(availableScopes);

    const currentScopesAsPermissions = currentDeployment ? getCurrentScopesAsPermissions(currentDeployment) : [];

    const availablePermissions = packageRequiredScopes;

    useEffect(() => {
        if (selectedMcpServer && currentDeployment) {
            // Get currently selected scopes from the deployment
            const deploymentScopes = getCurrentScopesAsPermissions(currentDeployment);
            setSelectedScopes(deploymentScopes);
            setInitialScopes(deploymentScopes);

            // Get policy from the userServiceConnectionMcpDeployments array
            let policyToUse = { allow: [], deny: [] };
            if (currentDeployment?.userServiceConnectionMcpDeployments?.[0]?.policy) {
                policyToUse = currentDeployment.userServiceConnectionMcpDeployments[0].policy;
            }

            const policyJson = JSON.stringify(policyToUse, null, 2);
            setPolicyValue(policyJson);
            setInitialPolicyValue(policyJson);

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
        setPolicyValue(value);
    };

    const handleSave = async () => {
        if (!selectedMcpServer || !hasChanges) return;

        setIsLoading(true);
        try {
            const completeSavePayload = {
                deploymentId: selectedMcpServer.deploymentId,
                changes: {
                    scopes: selectedScopes.map(s => s.id).sort(),
                    initialScopes: initialScopes.map(s => s.id).sort(),
                    scopesChanged: JSON.stringify(selectedScopes.map(s => s.id).sort()) !== JSON.stringify(initialScopes.map(s => s.id).sort()),
                    policyChanged: policyValue !== initialPolicyValue,
                    policyValue: policyValue !== initialPolicyValue ? 'Modified' : 'Unchanged'
                },
                timestamp: new Date().toISOString()
            };

            // Handle both OAuth and embedded wallet updates
            if (JSON.stringify(selectedScopes.map(s => s.id).sort()) !== JSON.stringify(initialScopes.map(s => s.id).sort())) {
                await handleScopesUpdate();
            }

            if (policyValue !== initialPolicyValue) {
                await handlePolicyUpdate();
            }

            setHasChanges(false);
        } catch (error) {
            toast.error("Failed to update MCP server");
            console.error("Error updating MCP server:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScopesUpdate = async () => {
        if (!selectedMcpServer) return;

        const scopesUpdatePayload = {
            deploymentId: selectedMcpServer.deploymentId,
            scopes: selectedScopes.map(s => s.id)
        };

        // TODO: Replace with actual API call when endpoint is available
        // const response = await api(`/packages/deployments/${selectedMcpServer.deploymentId}/update-scopes`, {
        //     method: "PATCH",
        //     body: { scopes: selectedScopes.map(s => s.id) }
        // });

        // Simulate API call for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("MCP server scopes updated successfully");
        setInitialScopes(selectedScopes);
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

        const policyUpdatePayload = {
            deploymentId: selectedMcpServer.deploymentId,
            policy: policy
        };

        await updatePolicyMutation.mutateAsync(policyUpdatePayload);
        toast.success("Policy updated successfully");
        setInitialPolicyValue(policyValue);
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
                            {/* <div>
                                <Label className="text-xs text-primary-500">Status</Label>
                                <div className="mt-1">
                                    <Badge
                                        variant={selectedMcpServer.status === 'active' ? 'default' : 'secondary'}
                                        className="text-xs"
                                    >
                                        {selectedMcpServer.status}
                                    </Badge>
                                </div>
                            </div> */}
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

                    {/* Deployment URL Management */}
                    {/* <div className="space-y-4">
                        <h3 className="font-medium text-primary-800">Deployment URL</h3>
                        <div className="space-y-3">
                            <Label className="text-xs text-primary-500">Runtime URL</Label>
                            <div className="mt-1 text-sm text-primary-700 font-mono bg-primary-50 p-2 rounded">
                                {selectedMcpServer.url}
                            </div>
                            <div className="text-xs text-primary-500">
                                This is the URL where your deployed MCP server is accessible.
                                The deploymentId query parameter identifies your specific instance.
                            </div>
                        </div>
                    </div> */}

                    {/* <div className="w-full border-t border-t-primary-100 border-dashed" /> */}

                    {/* Scopes Management - Show for all deployments */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-primary-800">Scopes & Permissions</h3>
                        <div className="space-y-3">
                            <Label className="text-xs text-primary-500">Current Scopes</Label>
                            <div className="flex flex-wrap gap-2">
                                {currentScopesAsPermissions.length > 0 ? (
                                    currentScopesAsPermissions.map((scope: Permission) => (
                                        <Badge key={scope.id} variant="secondary" className="text-xs">
                                            <pre>{getScopeDisplayName(scope.id)}</pre>
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-primary-400">No scopes selected</span>
                                )}
                            </div>
                            {availablePermissions.length > 0 ? (
                                <PermissionSelector
                                    permissions={availablePermissions}
                                    initialSelected={currentScopesAsPermissions}
                                    onSelectionChange={handleScopeChange}
                                    placeholder="Select scopes..."
                                />
                            ) : (
                                <div className="text-sm text-primary-500 bg-primary-50 p-3 rounded">
                                    This package doesn't require any scopes or permissions.
                                </div>
                            )}
                        </div>
                    </div>
                    <Separator />

                    {/* Policy Management - Show for all deployments */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-primary-800">Policy Configuration</h3>
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

                    {/* Show message if service client type is not supported */}
                    {(!isDeploymentDataLoading) && (
                        <div className="space-y-4">
                            <h3 className="font-medium text-primary-800">Configuration</h3>
                            <div className="text-sm text-primary-600">
                                Configuration options are now available for all deployment types.
                            </div>
                        </div>
                    )}

                    {/* Show loading state while determining service client type */}
                    {isDeploymentDataLoading && (
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
