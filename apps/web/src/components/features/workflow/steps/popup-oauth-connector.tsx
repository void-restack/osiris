import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link2, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionSelector } from '@/components/ui/permission-selector';
import { useCreateServiceConnectionMutation } from '@/lib/mutations';
import { useQueryClient } from '@tanstack/react-query';
import { hubQueries } from '@/lib/queries';
import { toast } from 'sonner';
import { transformScopeDefinitions } from '@/lib/scope-utils';
import { getScopeDisplayName } from '@/lib/scope-definitions';
import type { Permission } from '../types';

interface SmartOAuthConnectorProps {
    serviceName: string;
    serviceMethod: any;
    requiredScopes: string[];
    onConnectionSuccess?: () => void;
    onCancel?: () => void;
}

type ConnectionStatus = 'idle' | 'connecting' | 'success' | 'error';

export function SmartOAuthConnector({
    serviceName,
    serviceMethod,
    requiredScopes,
    onConnectionSuccess,
    onCancel
}: PopupOAuthConnectorProps) {
    const [selectedScopes, setSelectedScopes] = useState<Permission[]>([]);
    const [connectionName, setConnectionName] = useState(`${serviceName} connection`);
    const [status, setStatus] = useState<ConnectionStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [newConnectionId, setNewConnectionId] = useState<string | null>(null);

    const createServiceConnection = useCreateServiceConnectionMutation();
    const queryClient = useQueryClient();
    const popupRef = useRef<Window | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Transform scope definitions to permissions
    const availablePermissions = useMemo(() => {
        if (!serviceMethod.scopeDefinitions) return [];

        const scopeDefinitions = transformScopeDefinitions(serviceName, serviceMethod.scopeDefinitions);
        return Object.entries(scopeDefinitions).map(([scope, label]) => ({
            id: scope,
            label: getScopeDisplayName(scope) || String(label)
        }));
    }, [serviceName, serviceMethod.scopeDefinitions]);

    // Pre-select required scopes
    const initialSelectedScopes = useMemo(() => {
        return availablePermissions.filter(permission =>
            requiredScopes.some(requiredScope => {
                const scopeWithoutPrefix = requiredScope.startsWith(`${serviceName}:`)
                    ? requiredScope.replace(`${serviceName}:`, '')
                    : requiredScope;
                return permission.id === requiredScope || permission.id === scopeWithoutPrefix;
            })
        );
    }, [availablePermissions, requiredScopes, serviceName]);

    // Set initial scopes when available
    useEffect(() => {
        if (initialSelectedScopes.length > 0 && selectedScopes.length === 0) {
            setSelectedScopes(initialSelectedScopes);
        }
    }, [initialSelectedScopes, selectedScopes.length]);

    // Cleanup popup and polling on unmount
    useEffect(() => {
        return () => {
            if (popupRef.current && !popupRef.current.closed) {
                popupRef.current.close();
            }
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    // Start polling for OAuth completion
    const startPolling = useCallback(() => {
        pollIntervalRef.current = setInterval(() => {
            if (popupRef.current?.closed) {
                // Popup was closed, check if OAuth completed successfully
                clearInterval(pollIntervalRef.current!);
                pollIntervalRef.current = null;

                // Poll the auth endpoint to check for new connections
                checkForNewConnection();
            }
        }, 1000);
    }, []);

    const checkForNewConnection = useCallback(async () => {
        try {
            // Invalidate and refetch user auth data
            await queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() });

            // Wait a moment for the query to settle
            setTimeout(() => {
                const userAuth = queryClient.getQueryData(hubQueries.userAuth().queryKey);

                // Check if we have a new connection for this service
                const serviceConnections = Array.isArray(userAuth)
                    ? userAuth.filter((connection: any) =>
                        connection.service_clients?.name === serviceName
                    )
                    : [];

                // Find the most recent connection (assume it's the one we just created)
                const latestConnection = serviceConnections
                    .sort((a: any, b: any) =>
                        new Date(b.user_service_connections.createdAt || 0).getTime() -
                        new Date(a.user_service_connections.createdAt || 0).getTime()
                    )[0];

                if (latestConnection && latestConnection.user_service_connections.id !== newConnectionId) {
                    setNewConnectionId(latestConnection.user_service_connections.id);
                    setStatus('success');
                    toast.success(`${serviceName} account connected successfully!`);
                    onConnectionSuccess?.();
                } else {
                    setStatus('error');
                    setError('Connection was not completed or failed');
                    toast.error('OAuth connection was cancelled or failed');
                }
            }, 2000);
        } catch (error) {
            console.error('Error checking for new connection:', error);
            setStatus('error');
            setError('Failed to verify connection');
            toast.error('Failed to verify OAuth connection');
        }
    }, [serviceName, queryClient, newConnectionId, onConnectionSuccess]);

    const handleConnect = useCallback(async () => {
        if (selectedScopes.length === 0) {
            toast.error('Please select at least one permission');
            return;
        }

        try {
            setStatus('connecting');
            setError(null);

            // Store workflow dialog state before OAuth redirect
            localStorage.setItem('workflow-dialog-was-open', 'true');
            localStorage.setItem('workflow-dialog-return-url', window.location.pathname + window.location.search);
            localStorage.setItem('oauth-service-connecting', serviceName);

            toast.info('Redirecting to OAuth. You\'ll return to this dialog after authorization.');

            // Use regular OAuth flow (will redirect)
            await createServiceConnection.mutateAsync({
                name: connectionName,
                serviceClientName: serviceName,
                scopes: selectedScopes.map(scope => scope.id),
            });

        } catch (error: any) {
            console.error('OAuth connection error:', error);
            setStatus('error');
            setError(error?.message || 'Failed to initiate connection');
            toast.error(error?.message || 'Failed to initiate connection');
        }
    }, [selectedScopes, connectionName, serviceName, createServiceConnection]);

    const handleRetry = useCallback(() => {
        setStatus('idle');
        setError(null);
        setNewConnectionId(null);
    }, []);

    const renderStatusContent = () => {
        switch (status) {
            case 'connecting':
                return (
                    <div className="text-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
                        <h4 className="text-sm font-medium text-blue-800 mb-2">
                            Connecting to {serviceName}...
                        </h4>
                        <p className="text-xs text-blue-600">
                            Complete the authorization in the popup window
                        </p>
                    </div>
                );

            case 'success':
                return (
                    <div className="text-center py-6">
                        <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-3" />
                        <h4 className="text-sm font-medium text-green-800 mb-2">
                            {serviceName} Connected Successfully!
                        </h4>
                        <p className="text-xs text-green-600 mb-4">
                            Your account is now connected and ready to use
                        </p>
                        <Button
                            onClick={() => onCancel?.()}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                        >
                            Done
                        </Button>
                    </div>
                );

            case 'error':
                return (
                    <div className="text-center py-6">
                        <AlertCircle className="h-8 w-8 mx-auto text-red-600 mb-3" />
                        <h4 className="text-sm font-medium text-red-800 mb-2">
                            Connection Failed
                        </h4>
                        <p className="text-xs text-red-600 mb-4">
                            {error || 'Something went wrong during the connection process'}
                        </p>
                        <div className="flex gap-2 justify-center">
                            <Button
                                onClick={handleRetry}
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-700"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={() => onCancel?.()}
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="connection-name" className="text-xs text-amber-700">
                                    Connection Name
                                </Label>
                                <Input
                                    id="connection-name"
                                    value={connectionName}
                                    onChange={(e) => setConnectionName(e.target.value)}
                                    className="text-sm border-amber-200 focus:border-amber-300"
                                    placeholder={`${serviceName} connection`}
                                />
                            </div>

                            {availablePermissions.length > 0 && (
                                <div>
                                    <Label className="text-xs text-amber-700 mb-2 block">
                                        Permissions to Grant
                                    </Label>
                                    <PermissionSelector
                                        context="popup-oauth"
                                        key={`popup-oauth-${serviceName}`}
                                        permissions={availablePermissions}
                                        placeholder={`Select ${serviceName} permissions...`}
                                        onSelectionChange={setSelectedScopes}
                                        initialSelected={initialSelectedScopes}
                                    />
                                    <p className="text-xs text-amber-600 mt-1">
                                        Required permissions are pre-selected. You can add more if needed.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleConnect}
                                disabled={createServiceConnection.isPending || selectedScopes.length === 0}
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                                size="sm"
                            >
                                <Link2 className="h-4 w-4 mr-1" />
                                Connect {serviceName}
                            </Button>

                            {onCancel && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCancel}
                                    className="border-amber-200 text-amber-700 hover:bg-amber-100"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="text-xs text-amber-600 bg-amber-100 p-2 rounded">
                            <strong>Note:</strong> A popup window will open for authorization.
                            Please complete the process and return here.
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h4 className="text-sm font-medium text-amber-800">
                        Connect {serviceName} Account
                    </h4>
                    <p className="text-xs text-amber-600">
                        {status === 'idle'
                            ? `Add or upgrade your ${serviceName} account with additional permissions`
                            : ''
                        }
                    </p>
                </div>
            </div>

            {renderStatusContent()}
        </div>
    );
}
