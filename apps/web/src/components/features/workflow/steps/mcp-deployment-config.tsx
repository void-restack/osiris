import { useState, useMemo, useCallback } from 'react';
import { CheckCircle, AlertCircle, Loader2, Settings, ChevronDown, ChevronRight, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionSelector } from '@/components/ui/permission-selector';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { transformScopeDefinitions } from '@/lib/scope-utils';
import { getScopeDisplayName } from '@/lib/scope-definitions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SmartOAuthConnector } from './smart-oauth-connector';
import type { PackageWithUserStatus } from '@/types';
import type { McpDeploymentStatus, Permission } from '../types';

// Utility functions ported from oauth.consent.tsx
function hasAllRequiredScopes(connection: any, requiredScopes: string[], serviceName: string, authMethods: any[]) {
  const connectionScopes = connection.user_service_connections.scopes || []
  const requiredScopesArray = Array.isArray(requiredScopes) ? requiredScopes : []
  return requiredScopesArray.every((requiredScope) => {
    const scopeWithoutPrefix = requiredScope.startsWith(`${serviceName}:`)
      ? requiredScope.replace(`${serviceName}:`, '')
      : requiredScope
    const scopeWithPrefix = `${serviceName}:${requiredScope}`
    const hasOAuth = (authMethods?.find((m: any) => m.name === serviceName)?.type === 'oauth')

    return (
      connectionScopes.includes(requiredScope) ||
      connectionScopes.includes(scopeWithoutPrefix) ||
      connectionScopes.includes(scopeWithPrefix)
    )
  })
}

function getPermissionsForService(serviceName: string, requiredScopes: string[], authMethods: any[]) {
  const serviceAuthMethod = authMethods?.find((m: any) => m.name === serviceName)
  const rawScopeDefinitions = serviceAuthMethod?.scopeDefinitions || {}

  const scopeDefinitions = transformScopeDefinitions(serviceName, rawScopeDefinitions);

  const required = Array.isArray(requiredScopes) ? requiredScopes : []
  const entries = Object.entries(scopeDefinitions).filter(([scope]) => {
    const scopeWithoutPrefix = scope.startsWith(`${serviceName}:`) ? scope.replace(`${serviceName}:`, '') : scope
    const scopeWithPrefix = `${serviceName}:${scope}`
    return required.includes(scope) || required.includes(scopeWithoutPrefix) || required.includes(scopeWithPrefix)
  })

  return entries.map(([id, label]) => ({
    id,
    label: getScopeDisplayName(id) || String(label)
  }));
}

interface ScopeStatus {
  missingServices: string[];
  servicesWithInsufficientScopes: string[];
  hasIssues: boolean;
}

interface McpDeploymentConfigProps {
  pkg: PackageWithUserStatus;
  deployment?: McpDeploymentStatus;
  deploymentName: string;
  onDeploymentNameChange: (name: string) => void;
  onDeploy: () => Promise<void>;
  isDeploying: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  scopeStatus?: ScopeStatus;

  // Auth-related props
  authScopes?: any;
  userAuth?: any[];
  authMethods?: any[];
  selectedConnections: Record<string, string>;
  selectedPermissions: Record<string, Permission[]>;
  onConnectionSelect: (serviceName: string, connectionId: string) => void;
  onPermissionSelect: (serviceName: string, permissions: Permission[]) => void;
}

export function McpDeploymentConfig({
  pkg,
  deployment,
  deploymentName,
  onDeploymentNameChange,
  onDeploy,
  isDeploying,
  isExpanded,
  onToggleExpanded,
  scopeStatus,
  authScopes,
  userAuth = [],
  authMethods = [],
  selectedConnections,
  selectedPermissions,
  onConnectionSelect,
  onPermissionSelect
}: McpDeploymentConfigProps) {
  const [showOAuthConnector, setShowOAuthConnector] = useState<string | null>(null);

  // Calculate required services and validate readiness
  const requiredServices = useMemo(() => {
    return Object.keys(authScopes?.serviceClientMap || {});
  }, [authScopes]);

  // Pre-calculate permissions for all services (moved outside of map to avoid hooks rule violation)
  const allServicePermissions = useMemo(() => {
    if (!authScopes?.serviceClients) return {};

    const permissionsMap: Record<string, Permission[]> = {};

    requiredServices.forEach(serviceName => {
      const serviceClient = authScopes.serviceClients.find((client: any) => client.name === serviceName);
      if (!serviceClient?.scopeDefinitions) {
        permissionsMap[serviceName] = [];
        return;
      }

      const requiredScopesForService = authScopes.serviceClientMap?.[serviceName] || [];
      const transformedScopeDefinitions = transformScopeDefinitions(
        serviceClient.name,
        serviceClient.scopeDefinitions
      );

      permissionsMap[serviceName] = Object.entries(transformedScopeDefinitions)
        .filter(([scope]) => {
          // Only include scopes that are required by this MCP
          return requiredScopesForService.some((reqScope: any) => reqScope.includes(scope));
        })
        .map(([scope, label]) => ({
          id: scope,
          label: getScopeDisplayName(scope) || String(label)
        }));
    });

    return permissionsMap;
  }, [authScopes, requiredServices]);

  const isReadyToDeploy = useMemo(() => {
    if (deploymentName.trim().length === 0) return false;

    // Check that all required services have selected connections
    return requiredServices.every(serviceName => selectedConnections[serviceName]);
  }, [deploymentName, requiredServices, selectedConnections]);

  // Handle connection selection
  const handleConnectionSelect = useCallback((serviceName: string, connectionId: string) => {
    onConnectionSelect(serviceName, connectionId);
  }, [onConnectionSelect]);

  // Handle permission selection  
  const handlePermissionSelect = useCallback((serviceName: string, permissions: Permission[]) => {
    onPermissionSelect(serviceName, permissions);
  }, [onPermissionSelect]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={pkg.iconUrl || undefined} alt={pkg.name} />
              <AvatarFallback>
                {pkg.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <CardTitle className="text-base">{pkg.name}</CardTitle>
              <p className="text-sm text-gray-500">
                {pkg.shortDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Deployment Status Badges */}
            {deployment?.status === 'deployed' && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Deployed
              </Badge>
            )}
            {deployment?.status === 'failed' && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Failed
              </Badge>
            )}
            {isDeploying && (
              <Badge className="bg-blue-100 text-blue-800">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Deploying
              </Badge>
            )}

            {/* Scope Status Warnings (Informational) */}
            {scopeStatus?.hasIssues && !isDeploying && deployment?.status !== 'deployed' && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                {scopeStatus.missingServices.length > 0 ? 'Setup Needed' : 'Limited Access'}
              </Badge>
            )}

            <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Configure
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-1" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>

            {deployment?.status !== 'deployed' && (
              <Button
                size="sm"
                onClick={onDeploy}
                disabled={isDeploying}
                className={scopeStatus?.hasIssues ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Deploying
                  </>
                ) : (
                  scopeStatus?.hasIssues ? 'Deploy Anyway' : 'Deploy'
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-6 border-t pt-4">
              {/* Deployment Name */}
              <div className="space-y-2">
                <Label htmlFor={`deployment-name-${pkg.packageId}`}>
                  Deployment Name
                </Label>
                <Input
                  id={`deployment-name-${pkg.packageId}`}
                  value={deploymentName}
                  onChange={(e) => onDeploymentNameChange(e.target.value)}
                  placeholder={`${pkg.name} deployment`}
                />
              </div>

              {/* Scope Status Information */}
              {scopeStatus?.hasIssues && (
                <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-800">
                        Deployment Notice
                      </p>
                      <div className="text-sm text-amber-700 space-y-1">
                        {scopeStatus.missingServices.length > 0 && (
                          <p>• Missing connections: {scopeStatus.missingServices.join(', ')}</p>
                        )}
                        {scopeStatus.servicesWithInsufficientScopes.length > 0 && (
                          <p>• Limited permissions for: {scopeStatus.servicesWithInsufficientScopes.join(', ')}</p>
                        )}
                        <p className="italic">Some features may not work as expected. You can add connections/permissions later.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Configuration */}
              {requiredServices.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-900">
                    Service Configuration
                  </Label>

                  <div className="space-y-4">
                    {requiredServices.map(serviceName => {
                      const serviceClient = authScopes?.serviceClients.find((client: any) => client.name === serviceName);
                      if (!serviceClient) return null;

                      const serviceConnections = userAuth.filter((c: any) => c.service_clients.name === serviceName);

                      // Get pre-calculated permissions for this service
                      const permissions = allServicePermissions[serviceName] || [];

                      return (
                        <Accordion key={serviceName} type="single" collapsible className="border border-gray-200 rounded-lg">
                          <AccordionItem value={serviceName} className="border-none">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center gap-3 w-full">
                                <Avatar className="size-10 rounded-lg">
                                  <AvatarImage src={serviceClient.iconUrl || undefined} alt={serviceName} />
                                  <AvatarFallback className="bg-blue-500 text-white font-bold capitalize rounded-lg">
                                    {serviceName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start flex-1">
                                  <h4 className="text-gray-900 capitalize font-medium">
                                    {serviceName} Account
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Select an existing {serviceName} account or connect a new one
                                  </p>
                                </div>
                                {selectedConnections[serviceName] && (
                                  <Badge className="bg-green-100 text-green-800">
                                    Connected
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              {/* Permissions Selection */}
                              {permissions.length > 0 && (
                                <div className="mb-6">
                                  <p className="text-sm font-medium text-gray-900 mb-3">
                                    Select permissions to grant:
                                  </p>
                                  <PermissionSelector
                                    context="deploy-dialog"
                                    key={`deploy-${serviceName}-${pkg.packageId}`}
                                    permissions={permissions}
                                    placeholder={`Search ${serviceName} permissions...`}
                                    onSelectionChange={(perms) => handlePermissionSelect(serviceName, perms)}
                                    initialSelected={selectedPermissions[serviceName] || []}
                                  />
                                </div>
                              )}

                              {/* Account Selection */}
                              {serviceConnections.length > 0 && (
                                <div className="mb-6">
                                  <p className="text-sm font-medium text-primary-800 mb-3">Your connected accounts:</p>
                                  <RadioGroup
                                    value={selectedConnections[serviceName] || ''}
                                    onValueChange={(value) => handleConnectionSelect(serviceName, value)}
                                    className="space-y-3"
                                  >
                                    {serviceConnections
                                      .map((connection: any) => ({
                                        ...connection,
                                        hasAllRequiredScopes: hasAllRequiredScopes(
                                          connection,
                                          authScopes?.serviceClientMap?.[serviceName] || [],
                                          serviceName,
                                          authMethods || []
                                        )
                                      }))
                                      .sort((a, b) => Number(b.hasAllRequiredScopes) - Number(a.hasAllRequiredScopes))
                                      .map((connection: any) => {
                                        const radioId = `radio-${connection.user_service_connections.id}`;
                                        const requiredScopes = authScopes?.serviceClientMap?.[serviceName] || [];
                                        const availablePermissions = getPermissionsForService(serviceName, requiredScopes, authMethods || []);

                                        return (
                                          <div key={connection.user_service_connections.id} className="flex items-start space-x-3">
                                            <RadioGroupItem
                                              id={radioId}
                                              value={connection.user_service_connections.id}
                                              className="mt-1"
                                            />
                                            <label
                                              htmlFor={radioId}
                                              className={`flex-1 p-3 border rounded-[6px] hover:border-primary-200 transition-colors cursor-pointer ${connection.hasAllRequiredScopes
                                                ? 'border-green-200 bg-green-25'
                                                : 'border-primary-100 bg-primary-25 opacity-75'
                                                }`}
                                            >
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                  <p className={`text-sm font-medium ${connection.hasAllRequiredScopes
                                                    ? 'text-green-800'
                                                    : 'text-primary-600'
                                                    }`}>
                                                    {(() => {
                                                      const md = connection.user_service_connections.metadata;
                                                      const t = connection.service_clients?.type;
                                                      if (!t) return `${connection.user_service_connections.name || 'Unknown Connection'}`;

                                                      switch (t) {
                                                        case 'oauth':
                                                          return `${md?.user?.name || md?.user?.email || 'Unknown User'}`;
                                                        case 'secret_sharing':
                                                          return `${connection.user_service_connections.name || 'Database Connection'}`;
                                                        case 'embedded_wallet': {
                                                          const walletName = md?.name || connection.user_service_connections.name || 'Wallet Connection';
                                                          return `${walletName}`;
                                                        }
                                                        default:
                                                          return `${connection.user_service_connections.name || 'Unknown Connection'}`;
                                                      }
                                                    })()}
                                                  </p>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                  {/* Status Badge */}
                                                  {connection.hasAllRequiredScopes ? (
                                                    <div className="flex items-center space-x-1">
                                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                                      <span className="text-xs font-medium text-green-700">Ready</span>
                                                    </div>
                                                  ) : (
                                                    <div className="flex items-center space-x-1">
                                                      <AlertCircle className="h-4 w-4 text-amber-500" />
                                                      <span className="text-xs font-medium text-amber-700">Missing scopes</span>
                                                    </div>
                                                  )}

                                                  {/* Info Button */}
                                                  <Dialog>
                                                    <DialogTrigger asChild>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 hover:bg-primary-100"
                                                        type="button"
                                                      >
                                                        <InfoIcon className="h-3 w-3 text-primary-400" />
                                                      </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md">
                                                      <DialogHeader>
                                                        <DialogTitle className="text-primary-800">Account Permissions</DialogTitle>
                                                        <DialogDescription className="text-primary-600">
                                                          Permissions available for this {serviceName} account
                                                        </DialogDescription>
                                                      </DialogHeader>
                                                      <div className="space-y-3 mt-4">
                                                        {connection.user_service_connections.scopes?.map((scope: string) => {
                                                          const clean = scope.replace(`${serviceName}:`, '');
                                                          const match = availablePermissions.find((p) => p.id === clean || p.id === scope);
                                                          return (
                                                            <div key={scope} className="flex items-center justify-between p-3 bg-primary-25 rounded-lg">
                                                              <div>
                                                                <p className="text-sm font-medium text-primary-800">{match?.label || clean}</p>
                                                                <p className="text-xs text-primary-500">{clean}</p>
                                                              </div>
                                                              <CheckCircle className="h-4 w-4 text-green-600" />
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    </DialogContent>
                                                  </Dialog>
                                                </div>
                                              </div>

                                              <p className={`text-[13px] mb-2 ${connection.hasAllRequiredScopes
                                                ? 'text-green-600'
                                                : 'text-primary-400'
                                                }`}>
                                                {(() => {
                                                  const md = connection.user_service_connections.metadata;
                                                  const t = connection.service_clients?.type;
                                                  if (!t) return 'Unknown connection type';

                                                  switch (t) {
                                                    case 'oauth':
                                                      return md?.user?.email || md?.user?.name || 'No email available';
                                                    case 'secret_sharing':
                                                      return 'Database connection';
                                                    case 'embedded_wallet': {
                                                      const addr = md?.accounts?.addresses?.[0]?.address;
                                                      if (addr) return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
                                                      const chains = md?.accounts?.chains;
                                                      if (chains?.length) return `${chains.length} chain${chains.length > 1 ? 's' : ''}`;
                                                      return 'Blockchain wallet';
                                                    }
                                                    default:
                                                      return 'Unknown type';
                                                  }
                                                })()}
                                              </p>

                                              <div className="flex items-center justify-between">
                                                <div className="flex flex-wrap gap-1">
                                                  {connection.user_service_connections.scopes?.map((scope: string) => (
                                                    <Badge
                                                      key={scope}
                                                      className={`rounded-[6px] px-2 py-0.5 text-xs ${connection.hasAllRequiredScopes
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-primary-100 text-primary-800'
                                                        }`}
                                                    >
                                                      {getScopeDisplayName(scope)}
                                                    </Badge>
                                                  ))}
                                                </div>

                                                {/* Upgrade Account Button */}
                                                {!connection.hasAllRequiredScopes && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="ml-2 h-7 px-2 text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      setShowOAuthConnector(serviceName);
                                                    }}
                                                  >
                                                    Upgrade Account
                                                  </Button>
                                                )}
                                              </div>
                                            </label>
                                          </div>
                                        );
                                      })}
                                  </RadioGroup>
                                </div>
                              )}

                              {/* Smart OAuth Connector */}
                              {showOAuthConnector === serviceName ? (
                                <SmartOAuthConnector
                                  serviceName={serviceName}
                                  serviceMethod={serviceClient}
                                  requiredScopes={authScopes?.serviceClientMap?.[serviceName] || []}
                                  onConnectionSuccess={() => {
                                    // Connection successful, hide the connector and refresh data
                                    setShowOAuthConnector(null);
                                  }}
                                  onCancel={() => setShowOAuthConnector(null)}
                                />
                              ) : (
                                <div className="space-y-3">
                                  <Button
                                    onClick={() => setShowOAuthConnector(serviceName)}
                                    variant="outline"
                                    className="w-full rounded-lg border-dashed border-2 border-primary-200 bg-primary-25 hover:bg-primary-50 hover:border-primary-300 text-primary-700 h-12"
                                    type="button"
                                  >
                                    + Connect a new {serviceName} account
                                  </Button>

                                  {serviceConnections.length === 0 && (
                                    <div className="text-center py-6 px-4 bg-primary-25 rounded-lg border border-primary-100">
                                      <p className="text-sm text-primary-600 mb-2">
                                        No {serviceName} accounts connected yet
                                      </p>
                                      <p className="text-xs text-primary-400">Connect an account to proceed with deployment</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {deployment?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">
                        Deployment Failed
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        {deployment.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {deployment?.status === 'deployed' && deployment.deploymentId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800">
                        Successfully Deployed
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        Deployment ID: {deployment.deploymentId}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Messages */}
              {!isReadyToDeploy && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-amber-400 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-800">
                        Configuration Required
                      </h4>
                      <ul className="text-sm text-amber-700 mt-1 space-y-1">
                        {!deploymentName.trim() && (
                          <li>• Enter a deployment name</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
