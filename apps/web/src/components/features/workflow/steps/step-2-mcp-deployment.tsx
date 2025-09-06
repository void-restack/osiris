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
import type { StepComponentProps, Permission } from '../types';

export function Step2McpDeployment({
    data,
    updateData,
    setValid
}: StepComponentProps) {
    const [deployingPackageId, setDeployingPackageId] = useState<string | null>(null);
    const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
    const [deploymentNames, setDeploymentNames] = useState<Record<string, string>>({});
    const [isDeployingAll, setIsDeployingAll] = useState(false);
    const deployMutation = useDeployPackageMutation();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

    // Auth queries for all selected MCPs
    const authQueries = data.selectedMcps.map(pkg => ({
        packageId: pkg.packageId,
        authScopes: useQuery({
            ...packageQueries.authScopesOptions(pkg.packageId),
            enabled: !!pkg.packageId
        }),
    }));

    const { data: allUserAuth } = useQuery(hubQueries.userAuthOptions(isAuthenticated));
    const { data: authMethods } = useQuery(hubQueries.authMethodsOptions());

    // OAuth connections now happen via popup - data refreshes automatically

    // Initialize deployment names
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

            // Only return new object if there were changes
            return hasChanges ? newNames : prev;
        });
    }, [data.selectedMcps]);

    // Check if all MCPs are deployed
    const allDeployed = useMemo(() => {
        return data.selectedMcps.every(mcp =>
            data.mcpDeployments[mcp.packageId]?.status === 'deployed'
        );
    }, [data.selectedMcps, data.mcpDeployments]);

    // Update valid state
    useEffect(() => {
        setValid(allDeployed);

        // Update deployment IDs when all are deployed
        if (allDeployed) {
            const deploymentIds = data.selectedMcps
                .map(mcp => data.mcpDeployments[mcp.packageId]?.deploymentId)
                .filter(Boolean) as string[];
            updateData({ deploymentIds });
        }
    }, [allDeployed, data.selectedMcps, data.mcpDeployments, setValid, updateData]);

    // Handle connection selection
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

    // Handle permission selection
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

    // Knowledge base selection is now handled in Step 1


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

        // Check scope status (informational only - don't block deployment)
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

        // Update deployment status to deploying
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

            // Debug: Log the data structure
            console.log('🔍 DEBUG serviceConnections construction:');
            console.log('packageId:', pkg.packageId);
            console.log('requiredServices:', requiredServices);
            console.log('data.selectedConnections:', data.selectedConnections);
            console.log('data.selectedConnections[packageId]:', data.selectedConnections[pkg.packageId]);
            console.log('data.selectedPermissions:', data.selectedPermissions);
            console.log('data.selectedPermissions[packageId]:', data.selectedPermissions[pkg.packageId]);

            // Construct serviceConnections based on selected connections and permissions
            const serviceConnections = requiredServices
                .filter(service => {
                    const hasConnection = data.selectedConnections[pkg.packageId]?.[service];
                    console.log(`🔍 Service ${service} has connection:`, hasConnection);
                    return hasConnection;
                })
                .map(service => {
                    const authMethod = authMethods?.find((method: any) => method.name === service);
                    const isEmbeddedWallet = authMethod?.type === 'embedded_wallet';
                    const connectionId = data.selectedConnections[pkg.packageId][service];
                    const permissions = data.selectedPermissions[pkg.packageId]?.[service] || [];

                    console.log(`🔍 Service ${service}:`, {
                        connectionId,
                        isEmbeddedWallet,
                        permissions: permissions.length,
                        permissionIds: permissions.map(p => p.id)
                    });

                    return {
                        connectionId,
                        ...(isEmbeddedWallet
                            ? { policy: { allow: [{}], deny: [] } } // Default policy for embedded wallets
                            : { scopes: permissions.map(permission => permission.id) }
                        )
                    };
                });

            console.log('🔍 Final serviceConnections:', serviceConnections);

            const result = await deployMutation.mutateAsync({
                packageId: pkg.packageId,
                version: "latest",
                url: `${pkg?.url?.replace(/\/$/, '')}/mcp` || "",
                authData: {},
                serviceConnections: serviceConnections
            });

            // Update deployment status to deployed
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
            // Update deployment status to failed
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

    const deployAllPackages = useCallback(async () => {
        // Check for any issues but don't block deployment
        const packagesWithIssues = data.selectedMcps.filter(pkg => {
            const scopeStatus = getScopeStatus(pkg);
            return scopeStatus.hasIssues;
        });

        if (packagesWithIssues.length > 0) {
            toast.warning(
                `Deploying all packages including ${packagesWithIssues.length} with potential issues. Some features may not work as expected.`,
                { duration: 5000 }
            );
        }

        // Deploy packages that aren't already deployed
        for (const pkg of data.selectedMcps) {
            if (data.mcpDeployments[pkg.packageId]?.status !== 'deployed') {
                await deployPackage(pkg);
            }
        }
    }, [data.selectedMcps, data.mcpDeployments, deployPackage, getScopeStatus]);

    const handleDeployAll = useCallback(async () => {
        setIsDeployingAll(true);
        try {
            await deployAllPackages();
        } catch (error) {
            console.error('Deploy all failed:', error);
        } finally {
            setIsDeployingAll(false);
        }
    }, [deployAllPackages]);

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
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Deploy Selected Tools</h3>
                    <p className="text-sm text-gray-500">
                        Each tool needs to be deployed before it can be used in your workflow
                    </p>
                </div>
                <Button
                    onClick={deployAllPackages}
                    disabled={deployingPackageId !== null || allDeployed}
                    className="flex items-center gap-2"
                >
                    {deployingPackageId ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Deploying...
                        </>
                    ) : allDeployed ? (
                        <>
                            <CheckCircle className="h-4 w-4" />
                            All Deployed
                        </>
                    ) : (
                        'Deploy All'
                    )}
                </Button>
            </div>

            <div className="space-y-4">
                {data.selectedMcps.map((pkg) => {
                    const deployment = data.mcpDeployments[pkg.packageId];
                    const isExpanded = expandedPackages.has(pkg.packageId);
                    const isDeploying = deployingPackageId === pkg.packageId;

                    // Get auth data for this package
                    const authQuery = authQueries.find(q => q.packageId === pkg.packageId);
                    const authScopes = authQuery?.authScopes.data;

                    // Filter user auth connections for this package's required services
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
                            onDeploy={() => deployPackage(pkg)}
                            isDeploying={isDeploying}
                            isExpanded={isExpanded}
                            onToggleExpanded={() => togglePackageExpanded(pkg.packageId)}
                            scopeStatus={scopeStatus}

                            // Auth props
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
                        />
                    );
                })}
            </div>

            {!allDeployed && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Deploy all tools to continue
                            </h3>
                            <p className="mt-1 text-sm text-blue-700">
                                All selected tools must be deployed before you can proceed to the next step.
                            </p>
                            <div className="mt-4 flex space-x-4">
                                <Button
                                    size="sm"
                                    onClick={handleDeployAll}
                                    disabled={isDeployingAll}
                                >
                                    {isDeployingAll ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            Deploying All
                                        </>
                                    ) : (
                                        'Deploy All'
                                    )}
                                </Button>
                                <span className="text-sm text-gray-500">or deploy individually below</span>
                            </div>
                        </div>
                    </div>

                    {/* Individual deployment cards */}
                    <div className="mt-4 space-y-2">
                        {data.selectedMcps.map(mcp => (
                            <div key={mcp.packageId} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Avatar className="size-8">
                                        <AvatarImage src={mcp.iconUrl || undefined} />
                                        <AvatarFallback>
                                            {mcp.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {mcp.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {mcp.shortDescription}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {data.mcpDeployments[mcp.packageId]?.status === 'deployed' && (
                                        <Badge className="bg-green-100 text-green-800">
                                            Deployed
                                        </Badge>
                                    )}
                                    {data.mcpDeployments[mcp.packageId]?.status === 'deploying' && (
                                        <Badge className="bg-blue-100 text-blue-800">
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            Deploying
                                        </Badge>
                                    )}
                                    {data.mcpDeployments[mcp.packageId]?.status === 'failed' && (
                                        <Badge className="bg-red-100 text-red-800">
                                            Failed
                                        </Badge>
                                    )}

                                    {data.mcpDeployments[mcp.packageId]?.status !== 'deployed' && data.mcpDeployments[mcp.packageId]?.status !== 'deploying' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => deployPackage(mcp)}
                                            disabled={deployingPackageId === mcp.packageId}
                                        >
                                            {deployingPackageId === mcp.packageId ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                    Deploying
                                                </>
                                            ) : (
                                                'Deploy'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Knowledge Base selection has been moved to Step 1 */}

        </div>
    );
}
