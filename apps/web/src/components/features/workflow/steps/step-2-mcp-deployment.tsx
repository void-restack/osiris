import { useEffect, useState, useCallback, useMemo } from 'react';
import { CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useDeployPackageMutation } from '@/lib/mutations';
import { packageQueries, hubQueries } from '@/lib/queries';
import { McpDeploymentConfig } from './mcp-deployment-config';
import { McpDeployDialog } from '@/components/mcp-deploy-dialog';
import { AuthMethodDialog } from '@/components/features/authhub/auth-method-dialog';
import type { StepComponentProps, Permission } from '../types';

export function Step2McpDeployment({
    data,
    updateData,
    setValid
}: StepComponentProps) {
    const [deployingPackageId, setDeployingPackageId] = useState<string | null>(null);
    const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
    const [deploymentNames, setDeploymentNames] = useState<Record<string, string>>({});
    const [mcpDeployOpen, setMcpDeployOpen] = useState(false);
    const [selectedPackageForDeploy, setSelectedPackageForDeploy] = useState<any>(null);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [selectedServiceForAuth, setSelectedServiceForAuth] = useState<any>(null);
    const deployMutation = useDeployPackageMutation();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

    const authQueries = data.selectedMcps.map(pkg => ({
        packageId: pkg.packageId,
        authScopes: useQuery({
            ...packageQueries.authScopesOptions(pkg.packageId),
            enabled: !!pkg.packageId
        }),
    }));

    const { data: allUserAuth } = useQuery(hubQueries.userAuthOptions(isAuthenticated));
    const { data: authMethods } = useQuery(hubQueries.authMethodsOptions());

    useEffect(() => {
        setDeploymentNames(prev => {
            const newNames = { ...prev };
            let hasChanges = false;

            data.selectedMcps.forEach(mcp => {
                if (!newNames[mcp.packageId]) {
                    newNames[mcp.packageId] = `${mcp.name} deployment`;
                    hasChanges = true;
                }
            });

            return hasChanges ? newNames : prev;
        });
    }, [data.selectedMcps]);

    const allDeployed = useMemo(() => {
        return data.selectedMcps.every(mcp =>
            data.mcpDeployments[mcp.packageId]?.status === 'deployed'
        );
    }, [data.selectedMcps, data.mcpDeployments]);
    useEffect(() => {
        setValid(allDeployed);

        if (allDeployed) {
            const deploymentIds = data.selectedMcps
                .map(mcp => data.mcpDeployments[mcp.packageId]?.deploymentId)
                .filter(Boolean) as string[];
            updateData({ deploymentIds });
        }
    }, [allDeployed, data.selectedMcps, data.mcpDeployments, setValid, updateData]);

    const handleConnectionSelect = useCallback((packageId: string, serviceName: string, connectionId: string) => {
        updateData({
            selectedConnections: {
                ...data.selectedConnections,
                [packageId]: {
                    ...data.selectedConnections[packageId],
                    [serviceName]: connectionId
                }
            }
        });
    }, [data.selectedConnections, updateData]);

    const handlePermissionSelect = useCallback((packageId: string, serviceName: string, permissions: Permission[]) => {
        updateData({
            selectedPermissions: {
                ...data.selectedPermissions,
                [packageId]: {
                    ...data.selectedPermissions[packageId],
                    [serviceName]: permissions
                }
            }
        });
    }, [data.selectedPermissions, updateData]);

    const handleConnectNewAccount = useCallback((packageId: string, serviceName: string, requiredScopes: string[]) => {
        const authQuery = authQueries.find(q => q.packageId === packageId);
        const authScopes = authQuery?.authScopes.data;
        const serviceClient = authScopes?.serviceClients.find((client: any) => client.name === serviceName);

        if (serviceClient) {
            setSelectedServiceForAuth(serviceClient);
            setAuthDialogOpen(true);
        }
    }, [authQueries]);

    const handleDeployWithDialog = useCallback((pkg: any) => {
        setSelectedPackageForDeploy(pkg);
        setMcpDeployOpen(true);
    }, []);

    const getScopeStatus = useCallback((pkg: any) => {
        const authQuery = authQueries.find(q => q.packageId === pkg.packageId);
        const authScopes = authQuery?.authScopes.data;
        const requiredServices = Object.keys(authScopes?.serviceClientMap || {});

        const missingServices = requiredServices.filter(service =>
            !data.selectedConnections[pkg.packageId]?.[service]
        );

        const servicesWithInsufficientScopes: string[] = [];

        requiredServices.forEach(serviceName => {
            const connectionId = data.selectedConnections[pkg.packageId]?.[serviceName];
            if (!connectionId) return;

            const userAuth = allUserAuth?.filter((connection: any) => {
                const allowedServices = Object.keys(authScopes?.serviceClientMap || {});
                return allowedServices.includes(connection.service_clients.name);
            }) || [];

            const connection = userAuth.find((c: any) =>
                c.user_service_connections.id === connectionId
            );

            if (connection) {
                const requiredScopes = authScopes?.serviceClientMap?.[serviceName] || [];
                const connectionScopes = connection.user_service_connections.scopes || [];

                const hasAllScopes = requiredScopes.every((requiredScope: string) => {
                    const scopeWithoutPrefix = requiredScope.startsWith(`${serviceName}:`)
                        ? requiredScope.replace(`${serviceName}:`, '')
                        : requiredScope;
                    const scopeWithPrefix = `${serviceName}:${requiredScope}`;

                    return (
                        connectionScopes.includes(requiredScope) ||
                        connectionScopes.includes(scopeWithoutPrefix) ||
                        connectionScopes.includes(scopeWithPrefix)
                    );
                });

                if (!hasAllScopes) {
                    servicesWithInsufficientScopes.push(serviceName);
                }
            }
        });

        return {
            missingServices,
            servicesWithInsufficientScopes,
            hasIssues: missingServices.length > 0 || servicesWithInsufficientScopes.length > 0
        };
    }, [authQueries, data.selectedConnections, allUserAuth]);

    const deployPackage = useCallback(async (pkg: any) => {
        if (data.mcpDeployments[pkg.packageId]?.status === 'deployed') return;

        const scopeStatus = getScopeStatus(pkg);

        if (scopeStatus.hasIssues) {
            const warnings = [];
            if (scopeStatus.missingServices.length > 0) {
                warnings.push(`Missing connections: ${scopeStatus.missingServices.join(', ')}`);
            }
            if (scopeStatus.servicesWithInsufficientScopes.length > 0) {
                warnings.push(`Limited permissions for: ${scopeStatus.servicesWithInsufficientScopes.join(', ')}`);
            }

            toast.warning(
                `Deploying ${pkg.name} with potential issues:\n${warnings.join('\n')}\nSome features may not work as expected.`,
                { duration: 5000 }
            );
        }

        setDeployingPackageId(pkg.packageId);

        updateData({
            mcpDeployments: {
                ...data.mcpDeployments,
                [pkg.packageId]: {
                    packageId: pkg.packageId,
                    status: 'deploying'
                }
            }
        });

        try {
            // Get auth data for this package
            const authQuery = authQueries.find(q => q.packageId === pkg.packageId);
            const authScopes = authQuery?.authScopes.data;
            const requiredServices = Object.keys(authScopes?.serviceClientMap || {});

            const serviceConnections = requiredServices
                .filter(service => {
                    const hasConnection = data.selectedConnections[pkg.packageId]?.[service];
                    return hasConnection;
                })
                .map(service => {
                    const authMethod = authMethods?.find((method: any) => method.name === service);
                    const isEmbeddedWallet = authMethod?.type === 'embedded_wallet';
                    const connectionId = data.selectedConnections[pkg.packageId][service];
                    const permissions = data.selectedPermissions[pkg.packageId]?.[service] || [];

                    return {
                        connectionId,
                        ...(isEmbeddedWallet
                            ? { policy: { allow: [{}], deny: [] } }
                            : { scopes: permissions.map(permission => permission.id) }
                        )
                    };
                });

            const result = await deployMutation.mutateAsync({
                packageId: pkg.packageId,
                version: "latest",
                url: `${pkg?.url?.replace(/\/$/, '')}/mcp` || "",
                authData: {},
                serviceConnections: serviceConnections
            });

            updateData({
                mcpDeployments: {
                    ...data.mcpDeployments,
                    [pkg.packageId]: {
                        packageId: pkg.packageId,
                        deploymentId: result.deployment.id,
                        status: 'deployed'
                    }
                }
            });

            toast.success(`${pkg.name} deployed successfully!`);
        } catch (error: any) {
            updateData({
                mcpDeployments: {
                    ...data.mcpDeployments,
                    [pkg.packageId]: {
                        packageId: pkg.packageId,
                        status: 'failed',
                        error: error.message
                    }
                }
            });

            toast.error(`Failed to deploy ${pkg.name}: ${error.message}`);
        } finally {
            setDeployingPackageId(null);
        }
    }, [data.mcpDeployments, deploymentNames, updateData, deployMutation]);


    const togglePackageExpanded = useCallback((packageId: string) => {
        setExpandedPackages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(packageId)) {
                newSet.delete(packageId);
            } else {
                newSet.add(packageId);
            }
            return newSet;
        });
    }, []);

    if (data.selectedMcps.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No MCPs Selected</h3>
                    <p className="text-gray-500">Go back to select some tools first.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900">Deploy Selected Tools</h3>
                <p className="text-sm text-gray-500">
                    Each tool needs to be deployed before it can be used in your workflow
                </p>
            </div>

            <div className="space-y-4">
                {data.selectedMcps.map((pkg) => {
                    const deployment = data.mcpDeployments[pkg.packageId];
                    const isExpanded = expandedPackages.has(pkg.packageId);
                    const isDeploying = deployingPackageId === pkg.packageId;

                    const authQuery = authQueries.find(q => q.packageId === pkg.packageId);
                    const authScopes = authQuery?.authScopes.data;
                    const userAuth = useMemo(() => {
                        if (!authScopes?.serviceClientMap || !allUserAuth) return [];
                        const allowedServices = Object.keys(authScopes.serviceClientMap);
                        return allUserAuth.filter((connection: any) =>
                            allowedServices.includes(connection.service_clients.name)
                        );
                    }, [authScopes?.serviceClientMap, allUserAuth]);

                    const scopeStatus = getScopeStatus(pkg);

                    return (
                        <McpDeploymentConfig
                            key={pkg.packageId}
                            pkg={pkg}
                            deployment={deployment}
                            deploymentName={deploymentNames[pkg.packageId] || `${pkg.name} deployment`}
                            onDeploymentNameChange={(name) =>
                                setDeploymentNames(prev => ({
                                    ...prev,
                                    [pkg.packageId]: name
                                }))
                            }
                            onDeploy={async () => handleDeployWithDialog(pkg)}
                            isDeploying={isDeploying}
                            isExpanded={isExpanded}
                            onToggleExpanded={() => togglePackageExpanded(pkg.packageId)}
                            scopeStatus={scopeStatus}
                            authScopes={authScopes}
                            userAuth={userAuth}
                            authMethods={authMethods}
                            selectedConnections={data.selectedConnections[pkg.packageId] || {}}
                            selectedPermissions={data.selectedPermissions[pkg.packageId] || {}}
                            onConnectionSelect={(serviceName, connectionId) =>
                                handleConnectionSelect(pkg.packageId, serviceName, connectionId)
                            }
                            onPermissionSelect={(serviceName, permissions) =>
                                handlePermissionSelect(pkg.packageId, serviceName, permissions)
                            }
                            onConnectNewAccount={(serviceName: string, requiredScopes: string[]) =>
                                handleConnectNewAccount(pkg.packageId, serviceName, requiredScopes)
                            }
                        />
                    );
                })}
            </div>

            {/* Knowledge Base selection has been moved to Step 1 */}

            {/* MCP Deploy Dialog */}
            {selectedPackageForDeploy && (
                <McpDeployDialog
                    package={selectedPackageForDeploy}
                    open={mcpDeployOpen}
                    onOpenChange={(open) => {
                        setMcpDeployOpen(open);
                        if (!open) {
                            setSelectedPackageForDeploy(null);
                            // Refresh deployment data
                            queryClient.invalidateQueries();
                        }
                    }}
                    onSuccess={(deploymentId) => {
                        // Update workflow data with successful deployment
                        updateData({
                            mcpDeployments: {
                                ...data.mcpDeployments,
                                [selectedPackageForDeploy.packageId]: {
                                    packageId: selectedPackageForDeploy.packageId,
                                    deploymentId,
                                    status: 'deployed'
                                }
                            },
                            // Also update the deploymentIds array for the API call
                            deploymentIds: [
                                ...data.deploymentIds.filter(id => id !== deploymentId), // Remove if already exists
                                deploymentId // Add the new deployment ID
                            ]
                        });
                    }}
                />
            )}

            {/* Auth Method Dialog */}
            {selectedServiceForAuth && (
                <AuthMethodDialog
                    method={selectedServiceForAuth}
                    open={authDialogOpen}
                    onOpenChange={(open) => {
                        setAuthDialogOpen(open);
                        if (!open) {
                            setSelectedServiceForAuth(null);
                            // Refresh auth data
                            queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
                        }
                    }}
                    onSuccess={(connectionId, serviceName) => {
                        // Update workflow data with new connection
                        const packageId = data.selectedMcps.find(pkg => {
                            const authQuery = authQueries.find(q => q.packageId === pkg.packageId);
                            const authScopes = authQuery?.authScopes.data;
                            const requiredServices = Object.keys(authScopes?.serviceClientMap || {});
                            return requiredServices.includes(serviceName);
                        })?.packageId;

                        if (packageId) {
                            updateData({
                                selectedConnections: {
                                    ...data.selectedConnections,
                                    [packageId]: {
                                        ...data.selectedConnections[packageId],
                                        [serviceName]: connectionId
                                    }
                                }
                            });
                        }

                        // Refresh auth queries
                        queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });
                    }}
                />
            )}

        </div>
    );
}
