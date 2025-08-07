import { useState, useCallback, useMemo } from "react";
import { RefreshCcw, Loader2, Rocket, CheckCircle, AlertCircle, X } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { isAuthenticated } from "@/lib/auth-optimized";
import { getInitials } from "@/lib/utils";
import type { PackageWithUserStatus } from "@/types";

interface McpDeployDialogProps {
  package: PackageWithUserStatus;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  const { data: user } = useSuspenseQuery(userQueries.meOptions(isAuthenticated()));
  const { data: authScopes } = useSuspenseQuery(packageQueries.authScopesOptions(pkg.packageId));
  const { data: allUserAuth } = useSuspenseQuery(hubQueries.userAuthOptions(isAuthenticated()));
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

    // Validate permissions are selected for each service that has scopes
    const servicesWithScopes = requiredServices.filter(service => {
      const serviceAuthMethod = authMethods?.find((method: any) => method.name === service);
      const scopeDefinitions = serviceAuthMethod?.scopeDefinitions || {};
      return Object.keys(scopeDefinitions).length > 0;
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
        url: `https://api.osirislabs.xyz/mcps/${pkg.name}/mcp`,
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
    // Find the auth method for this service
    const serviceAuthMethod = authMethods?.find((method: any) => method.name === serviceName);

    if (!serviceAuthMethod) {
      toast.error(`Auth method not found for ${serviceName}`);
      return;
    }

    // Set the connecting service to show the appropriate dialog
    setConnectingService(serviceName);
  }, [authMethods]);

  const isPending = deployMutation.isPending;
  const isSuccess = deployMutation.isSuccess;
  const isError = deployMutation.isError;

  const renderServiceSection = (serviceName: string, requiredScopes: string[]) => {
    const serviceConnections = userAuth.filter(
      (connection: any) => connection.service_clients.name === serviceName
    );

    const permissions = useMemo(() => {
      const serviceAuthMethod = authMethods?.find((method: any) => method.name === serviceName);
      const scopeDefinitions = serviceAuthMethod?.scopeDefinitions || {};

      // Use the same pattern as other components in the codebase
      return Object.entries(scopeDefinitions).map(([scope, label]) => ({
        id: scope,
        label: label as string
      }));
    }, [serviceName, authMethods]);

    const handleServicePermissionSelect = useCallback((permissions: Permission[]) => {
      handlePermissionSelect(serviceName, permissions)
    }, [serviceName, handlePermissionSelect]);

    const initialSelected = useMemo(() => {
      return selectedPermissions[serviceName] || []
    }, [selectedPermissions, serviceName]);

    return (
      <Accordion type="single" collapsible className="border border-primary-100 rounded-[6px]">
        <AccordionItem value={serviceName} className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3 w-full">
              <div className="size-10 rounded-[6px] bg-purple-300 flex items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
                {serviceName.charAt(0)}
              </div>
              <div className="flex flex-col items-start flex-1">
                <h3 className="text-primary-800 capitalize font-medium">{serviceName} Account</h3>
                <p className="text-[13px] text-primary-300">
                  Select an existing {serviceName} account or connect a new one
                </p>
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

            {/* Existing Connections */}
            {serviceConnections.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-primary-800 mb-3">Your connected accounts:</p>
                <RadioGroup
                  value={selectedConnections[serviceName] || ''}
                  onValueChange={(value) => handleConnectionSelect(serviceName, value)}
                  className="space-y-3"
                >
                  {serviceConnections.map((connection: any) => (
                    <div key={connection.user_service_connections.id} className="flex items-start space-x-3 cursor-pointer group">
                      <RadioGroupItem
                        value={connection.user_service_connections.id}
                        className="mt-1"
                      />
                      <div className="flex-1 p-3 border border-primary-100 rounded-[6px] group-hover:border-primary-200 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-purple-300 text-white">
                              {serviceName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium text-primary-800">
                            {(() => {
                              const metadata = connection.user_service_connections.metadata;
                              const serviceType = connection.service_clients?.type;
                              const connectionId = connection.user_service_connections.id.slice(0, 8);

                              // Handle different metadata structures based on service type
                              switch (serviceType) {
                                case 'oauth':
                                  const oauthName = metadata?.user?.name || metadata?.user?.email || 'Unknown User';
                                  return `${oauthName} (${connectionId})`;
                                case 'secret_sharing':
                                  const dbName = connection.user_service_connections.name || 'Database Connection';
                                  return `${dbName} (${connectionId})`;
                                case 'embedded_wallet':
                                  // Check for wallet address in accounts.addresses[0].address
                                  const walletAddress = metadata?.accounts?.addresses?.[0]?.address;
                                  const walletName = metadata?.name || connection.user_service_connections.name || 'Wallet Connection';
                                  if (walletAddress) {
                                    return `${walletName} (${connectionId})`;
                                  }
                                  // Fallback to metadata name or connection name
                                  return `${walletName} (${connectionId})`;
                                default:
                                  const defaultName = connection.user_service_connections.name || 'Unknown Connection';
                                  return `${defaultName} (${connectionId})`;
                              }
                            })()}
                          </p>
                        </div>
                        <p className="text-[13px] text-primary-400 mb-2">
                          {(() => {
                            const metadata = connection.user_service_connections.metadata;
                            const serviceType = connection.service_clients?.type;

                            switch (serviceType) {
                              case 'oauth':
                                return metadata?.user?.email || metadata?.user?.name || 'No email available';
                              case 'secret_sharing':
                                return 'Database connection';
                              case 'embedded_wallet':
                                // Show truncated address if available
                                const walletAddress = metadata?.accounts?.addresses?.[0]?.address;
                                if (walletAddress) {
                                  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
                                }
                                // Show chains if no address
                                const chains = metadata?.accounts?.chains;
                                if (chains && chains.length > 0) {
                                  return `${chains.length} chain${chains.length > 1 ? 's' : ''}`;
                                }
                                return 'Blockchain wallet';
                              default:
                                return 'Unknown type';
                            }
                          })()}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {connection.user_service_connections.scopes?.map((scope: string) => (
                            <Badge key={scope} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                              {scope.replace(`${serviceName}:`, '')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Connect New Account Button */}
            <Button
              onClick={() => handleConnectNewAccount(serviceName, requiredScopes)}
              variant="outline"
              className="w-full rounded-[6px]"
              disabled={createServiceConnection.isPending || createSecretSharing.isPending || createWallet.isPending}
            >
              {createServiceConnection.isPending || createSecretSharing.isPending || createWallet.isPending
                ? 'Connecting...'
                : `Connect a new ${serviceName} account`
              }
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
  };

  const renderDeployForm = () => (
    <div className="flex flex-col px-4">
      {/* Services and Permissions */}
      <div className="space-y-3 overflow-y-scroll">
        <ScrollArea className="max-h-64">
          {Object.entries(authScopes?.serviceClientMap || {}).map(([serviceName, requiredScopes]) =>
            <div key={serviceName}>
              {renderServiceSection(serviceName, requiredScopes as string[])}
            </div>
          )}
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
      <div className="w-full max-w-md flex flex-col items-center mt-8 mb-12 text-[18px]">
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

        <div className="flex items-center w-full relative max-w-[294px]">
          <div className="flex z-20 w-full items-center justify-between">
            <div className="bg-purple-400 rounded-[6px] size-14"></div>
            <div className={`bg-${statusColor} w-full h-0.5`} />
            <div className={`h-fit text-xs border flex items-center gap-1 rounded-[6px] p-1 ${isPending ? 'border-primary-600/15 text-primary-400 bg-primary-50' :
              isSuccess ? 'border-success-600/15 text-success-600 bg-success-50' :
                'border-warning-600/15 text-warning-600 bg-warning-50'
              }`}>
              {statusIcon}
              {statusText}
            </div>
            <div className={`bg-${statusColor} w-full h-0.5`} />
            <div className="bg-blue-400 rounded-[6px] size-14 flex items-center justify-center text-white text-lg font-bold">
              {pkg.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="gap-2">
      <Rocket className="size-4" />
      Deploy
    </Button>
  );

  const requiredServices = Object.keys(authScopes?.serviceClientMap || {});

  // Only validate permissions for services that have scopes
  const servicesWithScopes = requiredServices.filter(service => {
    const serviceAuthMethod = authMethods?.find((method: any) => method.name === service);
    const scopeDefinitions = serviceAuthMethod?.scopeDefinitions || {};
    return Object.keys(scopeDefinitions).length > 0;
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
                <AvatarImage src={user.profileImageUrl} alt={user.name} />
                <AvatarFallback className="rounded-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Avatar className="-ml-3 rounded-lg size-10 bg-blue-400">
                <AvatarFallback className="rounded-sm text-white font-bold">
                  {pkg.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2 flex flex-col">
                <span className="text-primary-800 text-sm">{user.name}</span>
                <span className="text-primary-300 text-xs">{user.email}</span>
              </div>
            </div>
            {/* <div className="rounded-md border border-primary-300 p-1">
              <RefreshCcw className="size-4 text-primary-300" />
            </div> */}
          </div>

          {/* Deployment Name */}
          {!isPending && !isSuccess && !isError && (
            <div className="flex flex-col space-y-1.5 mt-6 px-4 text-[13px] text-primary-400">
              <Label htmlFor="deployment_name">Deployment Name</Label>
              <Input
                id="deployment_name"
                type="text"
                value={deploymentName}
                onChange={(e) => setDeploymentName(e.target.value)}
                placeholder={`${pkg.name} deployment`}
              />
            </div>
          )}

          <div className="border-t border-t-primary-200 border-dashed my-6" />

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

        {isSuccess ? (
          <AlertDialogFooter className="flex w-full items-center rounded-b-[12px] border-t border-t-primary-100 bg-primary-25 px-4 py-3 sm:justify-end">
            <Button onClick={handleClose} className="gap-2">
              <X className="size-4" />
              Close
            </Button>
          </AlertDialogFooter>
        ) : isError ? (
          <AlertDialogFooter className="flex w-full items-center rounded-b-[12px] border-t border-t-primary-100 bg-primary-25 px-4 py-3 sm:justify-between">
            <Button variant="outline" onClick={() => deployMutation.reset()}>
              Try Again
            </Button>
            <Button onClick={handleClose}>
              Close
            </Button>
          </AlertDialogFooter>
        ) : !isPending ? (
          <AlertDialogFooter className="flex w-full items-center rounded-b-[12px] border-t border-t-primary-100 bg-primary-25 px-4 py-3 sm:justify-between">
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
              <Rocket className="size-4 mr-2" />
              Deploy Package
            </AlertDialogAction>
          </AlertDialogFooter>
        ) : null}
      </AlertDialogContent>

      {/* Auth Method Dialog for connecting new accounts */}
      {connectingService && authMethods && (
        <AuthMethodDialog
          method={authMethods.find((method: any) => method.name === connectingService)!}
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
