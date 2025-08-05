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
import { PermissionSelector, type Permission } from "@/components/ui/permission-selector";
import { userQueries, hubQueries, packageQueries } from "@/lib/queries";
import { useDeployPackageMutation } from "@/lib/mutations";
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

  const deployMutation = useDeployPackageMutation();
  const { data: user } = useSuspenseQuery(userQueries.meOptions(isAuthenticated()));
  const { data: authScopes } = useSuspenseQuery(packageQueries.authScopesOptions(pkg.packageId));
  const { data: allUserAuth } = useSuspenseQuery(hubQueries.userAuthOptions(isAuthenticated()));

  // Filter user auth connections to only show relevant services
  const userAuth = allUserAuth?.filter((connection: any) => {
    const allowedServices = Object.keys(authScopes?.serviceClientMap || {});
    return allowedServices.includes(connection.service_clients.name);
  }) || [];

  const handleDeploy = async () => {
    // Validate that user selected connections for all required services
    const requiredServices = Object.keys(authScopes?.serviceClientMap || {});
    const missingServices = requiredServices.filter(service => !selectedConnections[service]);

    if (missingServices.length > 0) {
      toast.error(`Please select connections for: ${missingServices.join(', ')}`);
      return;
    }

    // Validate permissions are selected for each service
    const servicesWithoutPermissions = requiredServices.filter(
      service => !selectedPermissions[service] || selectedPermissions[service].length === 0
    );

    if (servicesWithoutPermissions.length > 0) {
      toast.error(`Please select permissions for: ${servicesWithoutPermissions.join(', ')}`);
      return;
    }

    try {
      // Collect all selected permission IDs (already in correct format)
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
    } catch (error) {
      console.error('Deploy error:', error);
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

  const isPending = deployMutation.isPending;
  const isSuccess = deployMutation.isSuccess;
  const isError = deployMutation.isError;

  const renderServiceSection = (serviceName: string, requiredScopes: string[]) => {
    const serviceConnections = userAuth.filter(
      (connection: any) => connection.service_clients.name === serviceName
    );

    // Default scope definitions fallback
    const DEFAULT_SCOPE_DEFINITIONS: Record<string, string> = {
      "read": "Read",
      "write": "Write",
      "admin": "Admin",
      "user": "User",
      "profile": "Profile",
      "email": "Email",
      "openid": "OpenID",
      "offline_access": "Offline Access",
      "full_access": "Full Access",
      "limited_access": "Limited Access"
    };

    // Map scope names for display with improved mapping
    const permissions = useMemo(() => {
      const mappedPermissions = requiredScopes.map(scope => {
        // Use default mapping if available  
        let label = DEFAULT_SCOPE_DEFINITIONS[scope];

        if (!label) {
          // Fallback to existing formatting logic
          label = scope
            .split(/[./]/)
            .pop()
            ?.replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[_-]/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase())
            || scope
        }

        return {
          id: scope,
          label: label
        }
      });



      return mappedPermissions;
    }, [serviceName, requiredScopes, selectedPermissions]);

    const handleServicePermissionSelect = useCallback((permissions: Permission[]) => {
      handlePermissionSelect(serviceName, permissions)
    }, [serviceName, handlePermissionSelect]);

    const initialSelected = useMemo(() => {
      return selectedPermissions[serviceName] || []
    }, [selectedPermissions, serviceName]);

    return (
      <Card key={serviceName} className="border-primary-100 hover:border-primary-200 hover:shadow-md transition-all">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="size-12 rounded-[6px] bg-purple-300 flex items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
              {serviceName.charAt(0)}
            </div>
            <div className="flex flex-col flex-1">
              <CardTitle className="text-primary-800 capitalize">{serviceName} Account</CardTitle>
              <p className="text-[13px] text-primary-300 mt-1">
                Select an existing {serviceName} account or connect a new one
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Permission Selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-primary-800 mb-3">Select permissions to grant:</p>
            <PermissionSelector
              permissions={permissions}
              placeholder={`Search ${serviceName} permissions...`}
              onSelectionChange={handleServicePermissionSelect}
              initialSelected={initialSelected}
            />
          </div>

          {/* Existing Connections */}
          {serviceConnections.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-primary-800 mb-3">Your connected accounts:</p>
              <div className="space-y-3">
                {serviceConnections.map((connection: any) => (
                  <label key={connection.user_service_connections.id} className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name={`auth-${serviceName}`}
                      value={connection.user_service_connections.id}
                      onChange={() => handleConnectionSelect(
                        serviceName,
                        connection.user_service_connections.id
                      )}
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
                          {connection.user_service_connections.metadata?.user?.name || 'Unknown User'}
                        </p>
                      </div>
                      <p className="text-[13px] text-primary-400 mb-2">
                        {connection.user_service_connections.metadata?.user?.email}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {connection.user_service_connections.scopes?.map((scope: string) => (
                          <Badge key={scope} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                            {scope.replace(`${serviceName}:`, '')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {serviceConnections.length === 0 && (
            <p className="text-[13px] text-primary-300 italic mt-3">
              No {serviceName} accounts connected yet.
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDeployForm = () => (
    <div className="flex flex-col px-4">
      {/* Services and Permissions */}
      <div className="space-y-4">
        <ScrollArea className="max-h-64">
          {Object.entries(authScopes?.serviceClientMap || {}).map(([serviceName, requiredScopes]) =>
            renderServiceSection(serviceName, requiredScopes as string[])
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
  const isFormValid = requiredServices.every(service => selectedConnections[service]) &&
    requiredServices.every(service => selectedPermissions[service]?.length > 0);

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
          {/* User + Package Connection Visual */}
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
            <div className="rounded-md border border-primary-300 p-1">
              <RefreshCcw className="size-4 text-primary-300" />
            </div>
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
    </AlertDialog>
  );
}
