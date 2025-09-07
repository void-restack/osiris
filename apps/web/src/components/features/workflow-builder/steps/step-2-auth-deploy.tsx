import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { McpCard } from "../components";
import { AuthMethodDialog } from "@/components/features/authhub/auth-method-dialog";
import { McpDeployDialog } from "@/components/mcp-deploy-dialog";
import { hubQueries, packageQueries } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import type { StepProps } from "../types";
import type { ServiceClient } from "@/types/auth";
import type { PackageWithUserStatus } from "@/types";

export function Step2AuthDeploy({ data, updateData, isValid, setIsValid }: StepProps) {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

    // Dialog state
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [deployDialogOpen, setDeployDialogOpen] = useState(false);
    const [selectedServiceForAuth, setSelectedServiceForAuth] = useState<ServiceClient | null>(null);
    const [selectedPackageForDeploy, setSelectedPackageForDeploy] = useState<PackageWithUserStatus | null>(null);

    // Data queries
    const { data: authMethods } = useQuery(hubQueries.authMethodsOptions());
    const { data: userAuth } = useQuery(hubQueries.userAuthOptions(isAuthenticated));

    // Calculate deployment status counts
    const statusCounts = useMemo(() => {
        const counts = { total: 0, configuring: 0, deploying: 0, deployed: 0 };
        counts.total = data.selectedMcps.length;

        Object.values(data.mcpDeployments).forEach(deployment => {
            if (deployment.status === 'configuring') counts.configuring++;
            if (deployment.status === 'deploying') counts.deploying++;
            if (deployment.status === 'deployed') counts.deployed++;
        });

        return counts;
    }, [data.selectedMcps.length, data.mcpDeployments]);

    // Validate step - all MCPs should be deployed
    useEffect(() => {
        const allDeployed = data.selectedMcps.every(mcp => {
            const status = data.mcpDeployments[mcp.packageId]?.status;
            console.log('✅ Validation check for', mcp.name, ':', status);
            return status === 'deployed';
        });

        console.log('🎯 Step validation result:', { allDeployed, mcpCount: data.selectedMcps.length });
        setIsValid(allDeployed);
    }, [data.selectedMcps, data.mcpDeployments, setIsValid]);

    // Get MCP status
    const getMcpStatus = (packageId: string) => {
        const status = data.mcpDeployments[packageId]?.status || 'idle';
        console.log('🔍 Status for', packageId, ':', status);
        return status;
    };

    // Auth scope queries for each selected MCP
    const authScopeQueries = data.selectedMcps.map(mcp =>
        useQuery(packageQueries.authScopesOptions(mcp.packageId))
    );

    // Get required services for a package
    const getRequiredServices = (packageId: string) => {
        const authQuery = authScopeQueries.find(q => q.data?.packageId === packageId);
        const authScopes = authQuery?.data;
        return Object.keys(authScopes?.serviceClientMap || {});
    };

    // Configure Auth Handler - now with proper service detection
    const handleConfigureAuth = (packageId: string) => {
        const requiredServices = getRequiredServices(packageId);

        if (requiredServices.length === 0) {
            console.warn('No auth services required for package:', packageId);
            return;
        }

        // For now, use the first required service
        // TODO: Handle multiple services by showing a service selection UI
        const firstRequiredService = requiredServices[0];
        const serviceMethod = authMethods?.find((method: any) => method.name === firstRequiredService);

        if (!serviceMethod) {
            console.error('Auth method not found for service:', firstRequiredService);
            return;
        }

        // Mark as configuring
        updateData({
            mcpDeployments: {
                ...data.mcpDeployments,
                [packageId]: {
                    packageId,
                    status: 'configuring'
                }
            }
        });

        // Store context for dialog callback
        setSelectedServiceForAuth(serviceMethod);
        setAuthDialogOpen(true);
    };

    // Deploy Handler
    const handleDeploy = (packageId: string) => {
        const mcp = data.selectedMcps.find(m => m.packageId === packageId);
        if (!mcp) return;

        // Mark as deploying
        updateData({
            mcpDeployments: {
                ...data.mcpDeployments,
                [packageId]: {
                    packageId,
                    status: 'deploying'
                }
            }
        });

        setSelectedPackageForDeploy(mcp);
        setDeployDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Info Message */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-5 w-5 text-blue-500" />
                <p className="text-sm text-blue-700">
                    Configure authentication connections and deploy your selected tools. Authentication is required before deployment.
                </p>
            </div>

            {/* Selected MCPs */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Deploy Tools ({data.selectedMcps.length})</CardTitle>
                    <p className="text-sm text-gray-500">
                        Set up authentication and deploy each tool for this workflow step
                    </p>
                </CardHeader>
                <CardContent>
                    {data.selectedMcps.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No tools selected</p>
                            <p className="text-xs mt-1">Go back to select tools first</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.selectedMcps.map((mcp) => (
                                <McpCard
                                    key={mcp.packageId}
                                    mcp={mcp}
                                    showStatus={true}
                                    status={getMcpStatus(mcp.packageId)}
                                    onConfigureAuth={() => handleConfigureAuth(mcp.packageId)}
                                    onDeploy={() => handleDeploy(mcp.packageId)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Deployment Status Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Deployment Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">{statusCounts.total}</div>
                            <div className="text-xs text-gray-500">Total Tools</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{statusCounts.configuring}</div>
                            <div className="text-xs text-gray-500">Configuring</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{statusCounts.deploying}</div>
                            <div className="text-xs text-gray-500">Deploying</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{statusCounts.deployed}</div>
                            <div className="text-xs text-gray-500">Deployed</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Auth Method Dialog */}
            {selectedServiceForAuth && (
                <AuthMethodDialog
                    method={selectedServiceForAuth}
                    open={authDialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            // Dialog is being closed - reset any configuring status
                            const configuringPackage = Object.entries(data.mcpDeployments)
                                .find(([, deployment]) => deployment.status === 'configuring');

                            if (configuringPackage) {
                                const packageId = configuringPackage[0];
                                updateData({
                                    mcpDeployments: {
                                        ...data.mcpDeployments,
                                        [packageId]: {
                                            packageId,
                                            status: 'idle' // Reset to idle so user can try again
                                        }
                                    }
                                });
                            }

                            setSelectedServiceForAuth(null);
                        }
                        setAuthDialogOpen(open);
                    }}
                    onSuccess={(connectionId, serviceName) => {
                        // Find which package was being configured
                        const configuringPackage = Object.entries(data.mcpDeployments)
                            .find(([, deployment]) => deployment.status === 'configuring');

                        if (configuringPackage) {
                            const packageId = configuringPackage[0];
                            updateData({
                                selectedConnections: {
                                    ...data.selectedConnections,
                                    [packageId]: {
                                        ...data.selectedConnections[packageId],
                                        [serviceName]: connectionId
                                    }
                                },
                                mcpDeployments: {
                                    ...data.mcpDeployments,
                                    [packageId]: {
                                        packageId,
                                        status: 'idle' // Ready to deploy
                                    }
                                }
                            });
                        }

                        queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
                        setSelectedServiceForAuth(null);
                    }}
                />
            )}

            {/* MCP Deploy Dialog */}
            {selectedPackageForDeploy && (
                <McpDeployDialog
                    package={selectedPackageForDeploy}
                    open={deployDialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            // Dialog is being closed - reset any deploying status
                            const deployingPackage = Object.entries(data.mcpDeployments)
                                .find(([, deployment]) => deployment.status === 'deploying');

                            if (deployingPackage) {
                                const packageId = deployingPackage[0];
                                updateData({
                                    mcpDeployments: {
                                        ...data.mcpDeployments,
                                        [packageId]: {
                                            packageId,
                                            status: 'idle' // Reset to idle so user can try again
                                        }
                                    }
                                });
                            }

                            setSelectedPackageForDeploy(null);
                        }
                        setDeployDialogOpen(open);
                    }}
                    onSuccess={(deploymentId) => {
                        console.log('🚀 Deploy success for:', selectedPackageForDeploy.name, 'with ID:', deploymentId);

                        const packageId = selectedPackageForDeploy.packageId;
                        const updatedMcpDeployments = {
                            ...data.mcpDeployments,
                            [packageId]: {
                                packageId,
                                deploymentId,
                                status: 'deployed' as const
                            }
                        };

                        const updatedDeploymentIds = [...new Set([...data.deploymentIds, deploymentId])];

                        console.log('📊 Updating state:', {
                            packageId,
                            deploymentId,
                            mcpDeployments: updatedMcpDeployments,
                            deploymentIds: updatedDeploymentIds
                        });

                        updateData({
                            mcpDeployments: updatedMcpDeployments,
                            deploymentIds: updatedDeploymentIds
                        });

                        setSelectedPackageForDeploy(null);
                        setDeployDialogOpen(false);
                    }}
                />
            )}
        </div>
    );
}
