import { useState, useCallback, useMemo } from "react";
import { Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PermissionSelector, type Permission } from "@/components/ui/permission-selector";
import { userQueries, hubQueries, packageQueries } from "@/lib/queries";
import { useDeployPackageMutation, useCreateServiceConnectionMutation, useCreateSecretSharingMutation, useCreateWalletMutation } from "@/lib/mutations";
import { AuthMethodDialog } from "@/components/features/authhub/auth-method-dialog";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { getReadableScopes } from "@/lib/scope-utils";
import { getScopeDisplayName } from "@/lib/scope-definitions";
import type { PackageWithUserStatus } from "@/types";

interface McpDeployDialogProps {
  package: PackageWithUserStatus;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function ServiceSection({
  serviceName,
  serviceClient,
  requiredScopes,
  userAuth,
  authScopes,
  selectedPermissions,
  onPermissionSelect,
  selectedConnections,
  onConnectionSelect,
  authMethods,
  createServiceConnection,
  createSecretSharing,
  createWallet,
  onConnectNewAccount,
}: {
  serviceName: string;
  serviceClient: any;
  requiredScopes: string[];
  userAuth: any[];
  authScopes: any;
  selectedPermissions: Record<string, Permission[]>;
  onPermissionSelect: (serviceName: string, permissions: Permission[]) => void;
  selectedConnections: Record<string, string>;
  onConnectionSelect: (serviceName: string, id: string) => void;
  authMethods: any[];
  createServiceConnection: any;
  createSecretSharing: any;
  createWallet: any;
  onConnectNewAccount: (serviceName: string, requiredScopes: string[]) => void;
}) {
  const serviceConnections = useMemo(
    () => userAuth.filter((c: any) => c.service_clients.name === serviceName),
    [userAuth, serviceName]
  );

  const permissions = useMemo(
    () => getReadableScopes(serviceName, authScopes),
    [serviceName, authScopes]
  );

  console.log("permissions", permissions);

  const handleServicePermissionSelect = useCallback(
    (perms: Permission[]) => onPermissionSelect(serviceName, perms),
    [serviceName, onPermissionSelect]
  );

  const initialSelected = useMemo(
    () => selectedPermissions[serviceName] || [],
    [selectedPermissions, serviceName]
  );

  const pendingConnect =
    createServiceConnection.isPending ||
    createSecretSharing.isPending ||
    createWallet.isPending;

  return (
    <Accordion type="single" collapsible className="border border-primary-100 rounded-[6px]">
      <AccordionItem value={serviceName} className="border-none">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-3 w-full">
            <Avatar className="size-10 rounded-[6px] shadow-xl">
              <AvatarImage
                src={serviceClient.iconUrl}
                alt={serviceName}
                className="rounded-[6px]"
              />
              <AvatarFallback className="bg-purple-300 text-white font-bold text-lg capitalize rounded-[6px]">
                {serviceName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start flex-1">
              <h3 className="text-primary-800 capitalize font-medium">{serviceName} Account</h3>
              <p className="text-[13px] text-primary-300">Select an existing {serviceName} account or connect a new one</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {permissions.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-primary-800 mb-3">Select permissions to grant:</p>
              <PermissionSelector
                permissions={permissions}
                placeholder={`Search ${serviceName} permissions...`}
                onSelectionChange={handleServicePermissionSelect}
                initialSelected={initialSelected}
              />
            </div>
          )}

          {serviceConnections.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-primary-800 mb-3">Your connected accounts:</p>
              <RadioGroup
                value={selectedConnections[serviceName] || ''}
                onValueChange={(value) => onConnectionSelect(serviceName, value)}
                className="space-y-3"
              >
                {serviceConnections.map((connection: any) => (
                  <div key={connection.user_service_connections.id} className="flex items-start space-x-3 cursor-pointer group">
                    <RadioGroupItem id={connection.user_service_connections.id} value={connection.user_service_connections.id} className="mt-1" />
                    <div id={connection.user_service_connections.id} className="flex-1 p-3 border border-primary-100 rounded-[6px] group-hover:border-primary-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-primary-800">
                            {(() => {
                              const md = connection.user_service_connections.metadata;
                              const t = connection.service_clients?.type;
                              const shortId = connection.user_service_connections.id.slice(0, 8);
                              if (!t) return `${connection.user_service_connections.name || 'Unknown Connection'} (${shortId})`;

                              switch (t) {
                                case 'oauth':
                                  return `${md?.user?.name || md?.user?.email || 'Unknown User'} (${shortId})`;
                                case 'secret_sharing':
                                  return `${connection.user_service_connections.name || 'Database Connection'} (${shortId})`;
                                case 'embedded_wallet': {
                                  const walletName = md?.name || connection.user_service_connections.name || 'Wallet Connection';
                                  return `${walletName} (${shortId})`;
                                }
                                default:
                                  return `${connection.user_service_connections.name || 'Unknown Connection'} (${shortId})`;
                              }
                            })()}
                          </p>
                        </div>

                        {/* Ready Indicator */}
                        {(() => {
                          console.log("connection scopes", connection.user_service_connections.scopes);
                          console.log("required scopes", requiredScopes);
                          const connectionScopes = connection.user_service_connections.scopes || [];
                          const requiredScopesArray = Array.isArray(requiredScopes) ? requiredScopes : [];

                          // Check if all required scopes are covered
                          const hasAllRequiredScopes = requiredScopesArray.every((requiredScope) => {
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

                          if (hasAllRequiredScopes) {
                            return (
                              <Badge className="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium">
                                Ready
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      <p className="text-[13px] text-primary-400 mb-2">
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

                      <div className="flex flex-wrap gap-1">
                        {connection.user_service_connections.scopes?.map((scope: string) => (
                          <Badge key={scope} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                            {getScopeDisplayName(scope)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <Button
            onClick={() => onConnectNewAccount(serviceName, requiredScopes)}
            variant="outline"
            className="w-full rounded-[6px]"
            disabled={pendingConnect}
          >
            {pendingConnect ? 'Connecting...' : `Connect a new ${serviceName} account`}
          </Button>

          {serviceConnections.length === 0 && (
            <p className="text-[13px] text-primary-300 italic mt-3">
              No {serviceName} accounts connected yet.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function McpDeployDialog({
  package: pkg,
  trigger,
  open,
  onOpenChange
}: McpDeployDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Permission[]>>({});
  const [selectedConnections, setSelectedConnections] = useState<Record<string, string>>({});
  const [deploymentName, setDeploymentName] = useState(`${pkg.name} deployment`);
  const [connectingService, setConnectingService] = useState<string | null>(null);

  const deployMutation = useDeployPackageMutation();
  const createServiceConnection = useCreateServiceConnectionMutation();
  const createSecretSharing = useCreateSecretSharingMutation();
  const createWallet = useCreateWalletMutation();
  const { isAuthenticated } = useAuth();
  const { data: user } = useQuery(userQueries.meOptions(isAuthenticated));
  const { data: authScopes } = useSuspenseQuery(packageQueries.authScopesOptions(pkg.packageId));

  const { data: allUserAuth } = useQuery(hubQueries.userAuthOptions(isAuthenticated));
  const { data: authMethods } = useSuspenseQuery(hubQueries.authMethodsOptions());

  const userAuth = allUserAuth?.filter((connection: any) => {
    const allowedServices = Object.keys(authScopes?.serviceClientMap || {});
    return allowedServices.includes(connection.service_clients.name);
  }) || [];

  const handleDeploy = async () => {
    const requiredServices = Object.keys(authScopes?.serviceClientMap || {});
    const missingServices = requiredServices.filter(service => !selectedConnections[service]);

    if (missingServices.length > 0) {
      toast.error(`Please select connections for: ${missingServices.join(', ')}`);
      return;
    }

    const servicesWithScopes = requiredServices.filter(service => {
      const mcpRequiredScopes = authScopes?.serviceClientMap?.[service] || [];
      return mcpRequiredScopes.length > 0;
    });

    const servicesWithoutPermissions = servicesWithScopes.filter(
      service => !selectedPermissions[service] || selectedPermissions[service].length === 0
    );

    if (servicesWithoutPermissions.length > 0) {
      toast.error(`Please select permissions for: ${servicesWithoutPermissions.join(', ')}`);
      return;
    }

    try {
      const allScopes = Object.values(selectedPermissions).flatMap(permissions =>
        permissions.map(permission => permission.id)
      );

      await deployMutation.mutateAsync({
        packageId: pkg.packageId,
        version: pkg.latestVersion,
        url: `${pkg?.url?.replace(/\/$/, '')}/mcp`,
        scopes: allScopes,
        authData: {},
        connectionIds: Object.values(selectedConnections),
      });

      // Show success message
      toast.success('Package deployed successfully!');
    } catch (error: any) {
      // Show error message
      const errorMessage = error?.message || 'Deployment failed. Please try again.';
      toast.error(errorMessage);
      console.error('Deployment error:', error);
    }
  };

  const handleClose = () => {
    onOpenChange?.(false);
    setTimeout(() => {
      setSelectedPermissions({});
      setSelectedConnections({});
      deployMutation.reset();
    }, 300);
  };

  const handlePermissionSelect = useCallback((serviceName: string, permissions: Permission[]) => {
    setSelectedPermissions(prev => ({ ...prev, [serviceName]: permissions }));
  }, []);

  const handleConnectionSelect = (serviceName: string, connectionId: string) => {
    setSelectedConnections(prev => ({
      ...prev,
      [serviceName]: connectionId
    }));
  };

  const handleConnectNewAccount = useCallback((serviceName: string, requiredScopes: string[]) => {
    const serviceAuthMethod = authMethods?.find((method: any) => method.name === serviceName);

    if (!serviceAuthMethod) {
      toast.error(`Auth method not found for ${serviceName}`);
      return;
    }

    setConnectingService(serviceName);
  }, [authMethods]);

  const isPending = deployMutation.isPending;
  const isSuccess = deployMutation.isSuccess;
  const isError = deployMutation.isError;

  const renderDeployForm = () => (
    <div className="flex flex-col px-4">
      {/* Services and Permissions */}
      <div className="space-y-3 overflow-y-scroll">
        <ScrollArea className="max-h-64">
          {authScopes?.serviceClients?.map((serviceClient: any) => (
            <div key={serviceClient.name}>
              <ServiceSection
                serviceName={serviceClient.name}
                serviceClient={serviceClient}
                requiredScopes={authScopes?.serviceClientMap?.[serviceClient.name] || []}
                userAuth={userAuth}
                authScopes={authScopes}
                selectedPermissions={selectedPermissions}
                onPermissionSelect={handlePermissionSelect}
                selectedConnections={selectedConnections}
                onConnectionSelect={handleConnectionSelect}
                authMethods={authMethods}
                createServiceConnection={createServiceConnection}
                createSecretSharing={createSecretSharing}
                createWallet={createWallet}
                onConnectNewAccount={handleConnectNewAccount}
              />
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );

  const renderStatusVisual = () => {
    let statusColor, statusIcon, statusText;

    if (isPending) {
      statusColor = "primary-600/20";
      statusIcon = <Loader2 className="size-3 animate-spin" />;
      statusText = "Deploying";
    } else if (isSuccess) {
      statusColor = "success-600/20";
      statusIcon = <CheckCircle className="size-3" />;
      statusText = "Deployed";
    } else if (isError) {
      statusColor = "warning-600/20";
      statusIcon = <AlertCircle className="size-3" />;
      statusText = "Failed";
    }

    return (
      <div className="w-full flex flex-col justify-center items-center mt-8 mb-12 text-[18px]">
        <div className="flex flex-col text-center mb-8">
          <h3 className="flex items-center justify-center gap-2">
            {isPending ? 'Deploying' : isSuccess ? 'Deployed' : 'Deploy Failed'}
            <div className="size-[18px] bg-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
              {pkg.name.charAt(0).toUpperCase()}
            </div>
            {pkg.name}
          </h3>
          <span className="text-sm text-primary-400">
            {isPending ? 'Setting up your MCP deployment...' :
              isSuccess ? 'Your MCP package is now live!' :
                'Deployment encountered an error'}
          </span>
        </div>

        <div className="flex items-center justify-center w-full relative max-w-[294px]">
          <div className="flex z-20 w-full items-center justify-between">
            {/* User Avatar */}
            <Avatar className="size-14 rounded-[6px]">
              <AvatarImage src={user?.profileImageUrl} alt={user?.name || 'User'} />
              <AvatarFallback className="text-lg font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>

            <div className={`bg-${statusColor} w-full h-0.5`} />

            {/* Status Indicator */}
            <div className={`h-fit text-xs border flex items-center gap-1 rounded-[6px] p-1 ${isPending ? 'border-primary-600/15 text-primary-400 bg-primary-50' :
              isSuccess ? 'border-success-600/15 text-success-600 bg-success-50' :
                'border-warning-600/15 text-warning-600 bg-warning-50'
              }`}>
              {statusIcon}
              {statusText}
            </div>

            <div className={`bg-${statusColor} w-full h-0.5`} />

            {/* Package Avatar */}
            <Avatar className="size-14 rounded-[6px]">
              <AvatarImage src={pkg.iconUrl || undefined} alt={pkg.name} />
              <AvatarFallback className="text-lg font-bold">
                {pkg.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    );
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="gap-2">
      Deploy
    </Button>
  );

  const requiredServices = Object.keys(authScopes?.serviceClientMap || {});

  const servicesWithScopes = requiredServices.filter(service => {
    const mcpRequiredScopes = authScopes?.serviceClientMap?.[service] || [];
    return mcpRequiredScopes.length > 0;
  });

  const isFormValid = requiredServices.every(service => selectedConnections[service]) &&
    servicesWithScopes.every(service => selectedPermissions[service]?.length > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="w-full max-w-[520px] rounded-[12px] border-primary-100 p-0">
        <AlertDialogHeader className="border-b border-b-primary-100 px-4 py-3">
          <AlertDialogTitle className="font-normal text-base text-primary-400">
            Deploy {pkg.name}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="w-full">
          <div className="flex items-center justify-between px-4 pt-4">
            <div className="flex">
              <Avatar className="rounded-lg size-10">
                <AvatarImage src={user?.profileImageUrl} alt={user?.name || 'User'} />
                <AvatarFallback className="rounded-sm">
                  {user ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <Avatar className="-ml-3 rounded-lg size-10 bg-blue-400">
                <AvatarImage src={pkg.iconUrl ?? ""} alt={pkg.name} />
                <AvatarFallback className="rounded-sm text-white font-bold">
                  {pkg.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2 flex flex-col">
                <span className="text-primary-800 text-sm">{user?.name || 'User'}</span>
                <span className="text-primary-300 text-xs">{user?.email || 'user@example.com'}</span>
              </div>
            </div>
            {/* <div className="rounded-md border border-primary-300 p-1">
              <RefreshCcw className="size-4 text-primary-300" />
            </div> */}
          </div>

          {/* Deployment Name */}
          <div className="flex flex-col space-y-1.5 mt-6 px-4 text-[13px] text-primary-400">
            <Label htmlFor="deployment_name">Deployment Name</Label>
            <Input
              id="deployment_name"
              type="text"
              value={deploymentName}
              onChange={(e) => setDeploymentName(e.target.value)}
              placeholder={`${pkg.name} deployment`}
              disabled={isPending || isSuccess || isError}
            />
          </div>

          <div className="border-t border-t-primary-200 border-dashed my-6" />

          {/* Main Content Area - Always present with consistent structure */}
          <div className="min-h-[200px]">
            {(isPending || isSuccess || isError) ? (
              renderStatusVisual()
            ) : (
              <div className="flex flex-col">
                <div className="mb-4 flex flex-col px-4">
                  <span>Configure Deployment</span>
                  <span className="text-[13px] text-primary-300">
                    Set up your MCP server connection and permissions
                  </span>
                </div>
                {renderDeployForm()}
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter className="flex w-full items-center justify-between rounded-b-[12px] border-t border-t-primary-100 bg-primary-25 px-4 py-2 sm:justify-end">
          {isSuccess ? (
            <Button onClick={handleClose} className="gap-2">
              <X className="size-4" />
              Close
            </Button>
          ) : isError ? (
            <AlertDialogFooter className="flex w-full items-center rounded-b-[12px] bg-primary-25 px-4 py-1 sm:justify-end">
              <Button onClick={handleClose}>
                Close
              </Button>
            </AlertDialogFooter>
          ) : !isPending ? (
            <div className="w-full flex items-center justify-between">
              <AlertDialogCancel className="bg-primary-50">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="inset-shadow-search-btn"
                onClick={(e) => {
                  e.preventDefault();
                  handleDeploy();
                }}
                disabled={!isFormValid}
              >
                Deploy Package
              </AlertDialogAction>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Deploying...
            </div>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>

      {/* Auth Method Dialog for connecting new accounts */}
      {connectingService && authMethods && (
        <AuthMethodDialog
          method={authMethods.find((method: any) => method.name === connectingService)}
          open={!!connectingService}
          onOpenChange={(open) => {
            if (!open) {
              setConnectingService(null);
            }
          }}
        />
      )}
    </AlertDialog>
  );
}
