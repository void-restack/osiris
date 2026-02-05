import { hubQueries, packageQueries, userQueries } from '@/lib/queries'
import {
  useCreateServiceConnectionMutation,
  useCreateSecretSharingMutation,
  useCreateWalletMutation,
  useDeployPackageMutation,
  useAuthorizeFrontendMutation,
  useLoginMutation
} from '@/lib/mutations'
import { useAppStore } from '@/lib/store'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PermissionSelector, type Permission } from '@/components/ui/permission-selector'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckIcon, AlertCircleIcon, ChevronDownIcon, InfoIcon, SearchIcon, Github } from 'lucide-react'
import PolicyBuilder from '@/components/policy-builder'
import { AuthMethodDialog } from '@/components/features/authhub/auth-method-dialog'
import { getAuthState } from '@/lib/auth-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SERVICES_PRESERVE_FULL_SCOPE, transformScopeDefinitions } from '@/lib/scope-utils'
import { getScopeDisplayName } from '@/lib/scope-definitions'

export const Route = createFileRoute('/oauth/consent')({
  loader: async ({ context: { queryClient } }) => {
    const auth = await getAuthState(queryClient)
    return { auth }
  },
  component: RouteComponent,
})

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

const BASE_CONNECTION_SCOPES = ['osiris:auth', 'osiris:auth:action']

function buildConnectionIdsAndScopes(
  selectedAuthConnections: Record<string, string>,
  selectedPermissions: Record<string, Permission[]>,
  userAuthConnections: any[]
): { connectionIds: string[]; connectionScopes: Record<string, string[]> } {
  const connectionIds: string[] = []
  const connectionScopes: Record<string, string[]> = {}
  for (const [serviceName, userConnId] of Object.entries(selectedAuthConnections)) {
    if (!userConnId) continue
    const connection = userAuthConnections.find(
      (c: any) => c.service_clients?.name === serviceName && c.user_service_connections?.id === userConnId
    )
    if (!connection?.service_clients?.clientId) continue
    const serviceClientId = connection.service_clients.clientId
    connectionIds.push(serviceClientId)
    const serviceScopes = selectedPermissions[serviceName]?.map((p) => p.id) || []
    connectionScopes[serviceClientId] = [...BASE_CONNECTION_SCOPES, ...serviceScopes]
  }
  return { connectionIds, connectionScopes }
}

function buildConnectionIdsAndScopesFromProfile(
  authScopes: { serviceClientMap?: Record<string, string[]> } | null | undefined,
  userAuthConnections: any[],
  packageScopes: string[] = []
): { connectionIds: string[]; connectionScopes: Record<string, string[]> } {
  const connectionIds: string[] = []
  const connectionScopes: Record<string, string[]> = {}
  const requiredServices = Object.keys(authScopes?.serviceClientMap || {})
  for (const serviceName of requiredServices) {
    const connection = userAuthConnections.find(
      (c: any) => c.service_clients?.name === serviceName
    )
    if (!connection?.service_clients?.clientId) continue
    const serviceClientId = connection.service_clients.clientId
    connectionIds.push(serviceClientId)
    connectionScopes[serviceClientId] = [...BASE_CONNECTION_SCOPES, ...packageScopes]
  }
  return { connectionIds, connectionScopes }
}

function ConnectionItem({
  connection,
  serviceName,
  permissions,
  ok
}: {
  connection: any
  serviceName: string
  permissions: any[]
  ok: boolean
}) {
  // Extract the appropriate display name based on connection type
  const getDisplayName = () => {
    const connectionData = connection.user_service_connections
    const serviceType = connection.service_clients?.type

    // For OAuth connections, try to get user info from metadata
    if (serviceType === 'oauth' && connectionData.metadata?.user) {
      return connectionData.metadata.user.email ||
        connectionData.metadata.user.name ||
        connectionData.name ||
        'OAuth Account'
    }

    // For embedded wallet connections, show wallet address
    if (serviceType === 'embedded_wallet' && connectionData.metadata?.accounts?.addresses?.[0]?.address) {
      const address = connectionData.metadata.accounts.addresses[0].address
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    // For secret sharing connections, show the connection name
    if (serviceType === 'secret_sharing') {
      return connectionData.name || 'Secret Connection'
    }

    // Fallback to connection name or service type
    return connectionData.name ||
      connectionData.metadata?.name ||
      `${serviceName} Account`
  }

  // Extract the connection type description
  const getConnectionType = () => {
    const serviceType = connection.service_clients?.type
    if (serviceType === 'oauth') {
      return 'OAuth Account'
    } else if (serviceType === 'embedded_wallet') {
      return 'Wallet'
    } else if (serviceType === 'secret_sharing') {
      return 'Secret Sharing'
    }
    return 'Connection'
  }

  const displayName = getDisplayName()
  const connectionType = getConnectionType()

  return (
    <label className="cursor-pointer group block">
      <div
        className={cn(
          'relative p-4 border rounded-lg transition-all duration-200 flex items-center space-x-3',
          ok
            ? 'border-success-200 bg-success-25 group-hover:border-success-300 group-hover:shadow-sm'
            : 'border-primary-100 bg-primary-25 opacity-75 group-hover:border-primary-200'
        )}
      >
        <RadioGroupItem value={connection.user_service_connections.id} className="flex-shrink-0" />
        <div className="flex items-center space-x-3 flex-1">
          {/* <Avatar className="h-8 w-8">
            <AvatarImage src={connection.service_clients?.iconUrl} />
            <AvatarFallback className="text-xs bg-purple-300 text-white">
              {serviceName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar> */}
          <div className="flex-1">
            <p className={cn('text-sm font-medium', ok ? 'text-success-800' : 'text-primary-600')}>
              {displayName}
            </p>
            <p className={cn('text-xs capitalize', ok ? 'text-success-600' : 'text-primary-400')}>
              {connectionType}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {ok ? (
            <div className="flex items-center space-x-1">
              <CheckIcon className="h-4 w-4 text-success-600" />
              <span className="text-xs font-medium text-success-700">Ready</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <AlertCircleIcon className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">Missing scopes</span>
            </div>
          )}

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
                  const clean = scope.replace(`${serviceName}:`, '')
                  const match = permissions.find((p) => p.id === clean || p.id === scope)
                  return (
                    <div key={scope} className="flex items-center justify-between p-3 bg-primary-25 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-primary-800">{match?.label || clean}</p>
                        <p className="text-xs text-primary-500">{clean}</p>
                      </div>
                      <CheckIcon className="h-4 w-4 text-success-600" />
                    </div>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </label>
  )
}

function ServiceConsentSection({
  serviceName,
  requiredScopes,
  userAuthConnections,
  authMethods,
  selectedPermissions,
  onPermissionSelect,
  selectedAuthConnections,
  onAuthConnectionSelect,
  isDisabledByDeployment,
  selectedDeploymentDetails,
  onConnectNewAccount,
  isOpen,
  onToggle
}: {
  serviceName: string
  requiredScopes: string[]
  userAuthConnections: any[]
  authMethods: any[]
  selectedPermissions: Record<string, Permission[]>
  onPermissionSelect: (serviceName: string, permissions: Permission[]) => void
  selectedAuthConnections: Record<string, string>
  onAuthConnectionSelect: (serviceName: string, id: string) => void
  isDisabledByDeployment: boolean
  selectedDeploymentDetails: any | null
  onConnectNewAccount: (serviceName: string, requiredScopes: string[]) => void
  isOpen: boolean
  onToggle: (open: boolean) => void
}) {
  const serviceConnections = useMemo(
    () => userAuthConnections.filter((c: any) => c.service_clients.name === serviceName),
    [userAuthConnections, serviceName]
  )

  const permissions = useMemo(
    () => getPermissionsForService(serviceName, requiredScopes, authMethods),
    [serviceName, requiredScopes, authMethods]
  )

  const initialSelected = useMemo(
    () => selectedPermissions[serviceName] || [],
    [selectedPermissions, serviceName]
  )

  const connectionsWithStatus = useMemo(
    () => serviceConnections.map(connection => ({
      ...connection,
      hasRequiredScopes: hasAllRequiredScopes(connection, requiredScopes as string[], serviceName, authMethods)
    })),
    [serviceConnections, requiredScopes, serviceName, authMethods]
  )

  const sortedServiceConnections = useMemo(
    () => connectionsWithStatus.sort((a, b) => Number(b.hasRequiredScopes) - Number(a.hasRequiredScopes)),
    [connectionsWithStatus]
  )

  const handleAuthConnectionChange = useCallback(
    (value: string) => onAuthConnectionSelect(serviceName, value),
    [onAuthConnectionSelect, serviceName]
  )

  const handleConnectClick = useCallback(
    () => onConnectNewAccount(serviceName, requiredScopes),
    [onConnectNewAccount, serviceName, requiredScopes]
  )

  const handleServicePermissionSelect = useCallback((selectedPermissions: Permission[]) => {
    onPermissionSelect(serviceName, selectedPermissions)
  }, [onPermissionSelect, serviceName])

  const serviceAuthMethod = authMethods?.find((method: any) => method.name === serviceName)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
    >
      <Card
        className={cn(
          'border-primary-100 transition-all duration-200 rounded-xl overflow-hidden',
          isDisabledByDeployment ? 'bg-gray-50 border-gray-200 opacity-75' : 'hover:bg-primary-25 hover:border-primary-200'
        )}
      >
        <CollapsibleTrigger asChild>
          <div className={cn('w-full', isDisabledByDeployment ? 'cursor-not-allowed' : 'cursor-pointer')}>
            <CardHeader className="transition-colors">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={authMethods.find((m: any) => m.name === serviceName)?.iconUrl} />
                    <AvatarFallback className="bg-purple-300 text-white font-bold text-sm capitalize">
                      {serviceName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="p-0 flex items-start flex-col">
                    <h3 className={cn('text-base font-medium', isDisabledByDeployment ? 'text-gray-500' : 'text-gray-900')}>
                      {serviceName[0].toUpperCase() + serviceName.slice(1)} Account
                      {isDisabledByDeployment && ' (From Deployment)'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {isDisabledByDeployment
                        ? 'Using connections from selected deployment'
                        : serviceConnections.length > 0
                          ? `${serviceConnections.length} account${serviceConnections.length > 1 ? 's' : ''} connected`
                          : 'Select an existing account or connect a new one'}
                    </p>
                  </div>
                </div>
                <ChevronDownIcon className={cn('h-5 w-5 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')} />
              </div>
            </CardHeader>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="min-h-0">
            <CardContent className="pt-0 pb-6 space-y-6">
              {isDisabledByDeployment && selectedDeploymentDetails && (
                <div className="py-4 px-4 bg-blue-25 rounded-lg border border-blue-100 space-y-3">
                  <div>
                    <p className="text-sm text-blue-600 mb-2">
                      Using connections from: <strong>{selectedDeploymentDetails.name || `Deployment ${selectedDeploymentDetails.deploymentId.slice(0, 8)}`}</strong>
                    </p>
                    <p className="text-xs text-blue-400">This deployment already has configured connections. Account selection is disabled.</p>
                  </div>
                </div>
              )}

              {/* Permission Selector - Only for OAuth and when not using deployment */}
              {!isDisabledByDeployment && serviceAuthMethod?.type === 'oauth' && permissions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-primary-800 mb-3">Select permissions to grant:</p>
                  <PermissionSelector
                    context="oauth-consent"
                    key={`oauth-consent-${serviceName}`}
                    permissions={permissions}
                    placeholder={`Search ${serviceName} permissions...`}
                    onSelectionChange={handleServicePermissionSelect}
                    initialSelected={initialSelected}
                  />
                </div>
              )}

              {!isDisabledByDeployment && serviceConnections.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-primary-800 mb-4">Your connected accounts:</p>
                  <RadioGroup
                    value={selectedAuthConnections[serviceName] || ''}
                    onValueChange={handleAuthConnectionChange}
                    className="space-y-2"
                  >
                    {sortedServiceConnections.map((connection: any) => (
                      <ConnectionItem
                        key={connection.user_service_connections.id}
                        connection={connection}
                        serviceName={serviceName}
                        permissions={permissions}
                        ok={connection.hasRequiredScopes}
                      />
                    ))}
                  </RadioGroup>
                </div>
              )}

              {!isDisabledByDeployment && (
                <div className="space-y-3">
                  <Button
                    onClick={handleConnectClick}
                    variant="outline"
                    className="w-full rounded-lg border-dashed border-2 border-primary-200 bg-primary-25 hover:bg-primary-50 hover:border-primary-300 text-primary-700 h-12"
                    type="button"
                  >
                    + {`Connect a new ${serviceName === 'google' ? 'Google' : serviceName} account`}
                  </Button>

                  {serviceConnections.length === 0 && (
                    <div className="text-center py-6 px-4 bg-primary-25 rounded-lg border border-primary-100">
                      <p className="text-sm text-primary-600 mb-2">
                        No {serviceName === 'google' ? 'Google' : serviceName} accounts connected yet
                      </p>
                      <p className="text-xs text-primary-400">Connect an account to proceed with authorization</p>
                    </div>
                  )}
                </div>
              )}


            </CardContent>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function RouteComponent() {
  const { client_id, redirect_uri, state, scopes, scope, response_type, package_id, type, resource } = Route.useSearch()
  const { auth } = Route.useLoaderData() as { auth: { isAuthenticated: boolean; user: any | null } }
  const isAuthenticated = auth.isAuthenticated
  const scopeParam = scopes ?? scope
  const scopesArray = (scopeParam && typeof scopeParam === 'string') ? scopeParam.split(/\s+/).filter(Boolean) : []

  const isWalletOnlyFlow = !package_id && scopesArray.includes('osiris:auth:wallet')

  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>('')
  const [selectedAuthConnections, setSelectedAuthConnections] = useState<Record<string, string>>({})
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Permission[]>>({})
  const [policyJson, setPolicyJson] = useState<string>('{\n  "allow": [{}],\n  "deny": []\n}');
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deploymentSearchOpen, setDeploymentSearchOpen] = useState(false)
  const [deploymentSearchQuery, setDeploymentSearchQuery] = useState('')
  const [deploymentPage, setDeploymentPage] = useState(1)
  const deploymentLimit = 5

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const loginMutation = useLoginMutation()

  const { data: packageDetails, error: packageError } = useQuery({
    ...packageQueries.detailOptions(package_id as string),
    enabled: !isWalletOnlyFlow && !!package_id
  })
  const { data: authScopes, error: authScopesError } = useQuery({
    ...packageQueries.authScopesOptions(package_id as string),
    enabled: !isWalletOnlyFlow && !!package_id
  })
  const { data: authMethods, error: authMethodsError } = useQuery(hubQueries.authMethodsOptions())

  const { data: oauthClient, error: oauthClientError } = useQuery({
    ...hubQueries.oauthClientOptions(client_id as string),
    enabled: isWalletOnlyFlow && !!client_id
  })

  const { data: userInfo, error: userError } = useQuery(userQueries.meOptions(true))
  const { selectedProfileId } = useAppStore();
  const { data: rawUserAuthConnections, error: authError } = useQuery(hubQueries.userAuthOptions(true, selectedProfileId || undefined))
  const { data: existingPackageDeploymentsResponse, error: deploymentError } = useQuery({
    ...packageQueries.userDeploymentsForPackageOptions(package_id as string, {
      page: deploymentPage,
      limit: deploymentLimit
    }),
    enabled: !isWalletOnlyFlow && !!package_id
  })

  // Initialize open sections when auth scopes are loaded
  useEffect(() => {
    if (isAuthenticated && authScopes?.serviceClientMap && Object.keys(openSections).length === 0) {
      const keys = Object.keys(authScopes.serviceClientMap)
      const initialSections = keys.reduce((acc, key) => {
        acc[key] = true
        return acc
      }, {} as Record<string, boolean>)
      setOpenSections(initialSections)
    }
  }, [isAuthenticated, authScopes?.serviceClientMap, openSections])

  const userAuthConnections = rawUserAuthConnections?.filter((connection: any) => {
    if (isWalletOnlyFlow) {
      return connection.service_clients?.type === 'embedded_wallet'
    } else {
      const allowed = Object.keys(authScopes?.serviceClientMap || {})
      return allowed.includes(connection.service_clients?.name)
    }
  }) || []

  const existingPackageDeployments = Array.isArray(existingPackageDeploymentsResponse) ? existingPackageDeploymentsResponse : []
  const deploymentPagination = null

  const createServiceConnectionMutation = useCreateServiceConnectionMutation()
  const createSecretSharingMutation = useCreateSecretSharingMutation()
  const createWalletMutation = useCreateWalletMutation()
  const deployPackageMutation = useDeployPackageMutation()
  const authorizeFrontendMutation = useAuthorizeFrontendMutation()

  useEffect(() => {
    if (createServiceConnectionMutation.error) {
      toast.error(createServiceConnectionMutation.error.message || 'Failed to create service connection');
    }
  }, [createServiceConnectionMutation.error]);

  useEffect(() => {
    if (createSecretSharingMutation.error) {
      toast.error(createSecretSharingMutation.error.message || 'Failed to create secret sharing connection');
    }
  }, [createSecretSharingMutation.error]);

  useEffect(() => {
    if (createWalletMutation.error) {
      toast.error(createWalletMutation.error.message || 'Failed to create wallet');
    }
  }, [createWalletMutation.error]);

  useEffect(() => {
    if (deployPackageMutation.error) {
      toast.error(deployPackageMutation.error.message || 'Failed to deploy package');
    }
  }, [deployPackageMutation.error]);

  useEffect(() => {
    if (authorizeFrontendMutation.error) {
      toast.error(authorizeFrontendMutation.error.message || 'Authorization failed');
    }
  }, [authorizeFrontendMutation.error]);

  useEffect(() => {
    if (authorizeFrontendMutation.error) {
      toast.error(authorizeFrontendMutation.error.message || 'Frontend authorization failed');
    }
  }, [authorizeFrontendMutation.error]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  const handleGithubLogin = useCallback(() => {
    loginMutation.mutate({
      provider: 'github',
      redirectUri: window.location.href.toString(),
    })
  }, [loginMutation])

  const handleGoogleLogin = useCallback(() => {
    loginMutation.mutate({
      provider: 'google',
      redirectUri: window.location.href.toString(),
    })
  }, [loginMutation])

  const handleDeselectDeployment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDeploymentId('')
  }, [])

  // Filter deployments based on search query
  const filteredDeployments = useMemo(() => {
    if (!deploymentSearchQuery.trim()) return existingPackageDeployments;

    // Ensure existingPackageDeployments is an array
    const deployments = Array.isArray(existingPackageDeployments) ? existingPackageDeployments : [];

    return deployments.filter((deployment: any) => {
      const deploymentName = deployment.name || `Deployment ${deployment.deploymentId.slice(0, 8)}`;
      return deploymentName.toLowerCase().includes(deploymentSearchQuery.toLowerCase());
    });
  }, [existingPackageDeployments, deploymentSearchQuery]);

  // Get selected deployment details
  const selectedDeploymentDetails = useMemo(() => {
    if (!selectedDeploymentId) return null;

    // Ensure existingPackageDeployments is an array
    const deployments = Array.isArray(existingPackageDeployments) ? existingPackageDeployments : [];

    return deployments.find((dep: any) => dep.deploymentId === selectedDeploymentId) || null;
  }, [selectedDeploymentId, existingPackageDeployments]);

  const toggleSection = (serviceName: string, open: boolean) => {
    setOpenSections((prev) => ({
      ...prev,
      [serviceName]: open,
    }))
  }

  const handleAuthConnectionSelect = useCallback((serviceName: string, connectionId: string) => {
    setSelectedAuthConnections((prev) => ({ ...prev, [serviceName]: connectionId }))
  }, [])

  const handlePermissionSelect = useCallback((serviceName: string, permissions: Permission[]) => {
    setSelectedPermissions((prev) => ({ ...prev, [serviceName]: permissions }))
  }, [])

  const handleDeploymentChange = useCallback((value: string) => {
    if (value === selectedDeploymentId) {
      setSelectedDeploymentId('')
    } else {
      setSelectedDeploymentId(value)
    }
  }, [selectedDeploymentId])

  const handleConnectNewAccount = useCallback(
    (serviceName: string, requiredScopes: string[]) => {
      const serviceAuthMethod = authMethods?.find((method: any) => method.name === serviceName)
      if (!serviceAuthMethod) {
        toast.error(`Auth method not found for ${serviceName}`)
        return
      }
      setAuthDialogOpen(true)
      setSelectedAuthMethod(serviceAuthMethod)
    },
    [authMethods]
  )

  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<any>(null)
  const queryClient = useQueryClient()

  const handleConnectionCreated = useCallback((connectionId: string, serviceName: string) => {
    // Invalidate and refetch user auth connections
    queryClient.invalidateQueries({ queryKey: hubQueries.userAuth() })
    // Select the newly created connection
    if (isWalletOnlyFlow && selectedAuthMethod?.type === 'embedded_wallet') {
      setSelectedAuthConnections({ wallet: connectionId })
    } else if (!isWalletOnlyFlow && serviceName) {
      setSelectedAuthConnections((prev) => ({ ...prev, [serviceName]: connectionId }))
    }
  }, [queryClient, isWalletOnlyFlow, selectedAuthMethod])

  const handleAllowConsent = async () => {
    setIsLoading(true)

    try {
      if (isWalletOnlyFlow) {
        // New wallet-only flow - skip deployment and directly authorize
        if (Object.keys(selectedAuthConnections).length === 0) {
          setError('Please select a wallet connection')
          setIsLoading(false)
          return
        }

        // Direct authorization for wallet-only flow
        const { connectionIds: walletConnectionIds, connectionScopes: walletConnectionScopes } =
          buildConnectionIdsAndScopes(selectedAuthConnections, selectedPermissions, userAuthConnections)
        const authResultFrontend = await authorizeFrontendMutation.mutateAsync({
          clientId: client_id,
          redirectUri: redirect_uri,
          responseType: response_type ?? 'code',
          scopes: scopesArray,
          state: String(state) || '',
          ...(resource != null && { resource: String(resource) }),
          ...(selectedProfileId != null && { profileId: selectedProfileId }),
          connectionIds: walletConnectionIds,
          connectionScopes: walletConnectionScopes,
        })

        const url = new URL(authResultFrontend.url)
        // Add wallet connection info to the redirect
        url.searchParams.set(
          'wallet_connections',
          JSON.stringify([
            {
              connectionId: Object.values(selectedAuthConnections)[0],
              policy: { allow: [{}], deny: [] }, // Default policy for wallet-only flow
            },
          ])
        )
        window.location.href = url.toString()
        return
      }

      // Original package flow
      if (!selectedDeploymentId) {
        const requiredServices = Object.keys(authScopes?.serviceClientMap || {})
        const selectedServices = Object.keys(selectedAuthConnections)
        const missingServices = requiredServices.filter((service) => !selectedServices.includes(service))
        if (missingServices.length > 0) {
          setError(`Please select accounts for: ${missingServices.join(', ')}`)
          setIsLoading(false)
          return
        }
        const servicesWithoutPermissions = selectedServices.filter((service) => {
          const serviceAuthMethod = authMethods?.find((method: any) => method.name === service)
          if (serviceAuthMethod?.type === 'oauth') {
            return !selectedPermissions[service] || selectedPermissions[service].length === 0
          }
          return false
        })
        if (servicesWithoutPermissions.length > 0) {
          setError(`Please select permissions for: ${servicesWithoutPermissions.join(', ')}`)
          setIsLoading(false)
          return
        }
      }

      let deploymentId = selectedDeploymentId
      if (!selectedDeploymentId) {
        const selectedScopes = Object.entries(selectedPermissions).flatMap(([serviceName, permissions]) =>
          permissions.map((permission) => `${serviceName}:${permission.id}`)
        )

        let policyObject: any = {}
        try {
          policyObject = JSON.parse(policyJson)
          const hasAllowRules = policyObject?.allow && Array.isArray(policyObject.allow) && policyObject.allow.length > 0
          const hasDenyRules = policyObject?.deny && Array.isArray(policyObject.deny) && policyObject.deny.length > 0
          if (!hasAllowRules && !hasDenyRules) {
            policyObject = { allow: [{}], deny: [] }
          }
        } catch {
          setError('Invalid policy JSON format')
          setIsLoading(false)
          return
        }

        // Create serviceConnections array with connectionId and scopes for each service
        const serviceConnections = Object.entries(selectedAuthConnections)
          .filter(([serviceName, connectionId]) => connectionId)
          .map(([serviceName, connectionId]) => {
            const authMethod = authMethods?.find((method: any) => method.name === serviceName);
            const isEmbeddedWallet = authMethod?.type === 'embedded_wallet';

            return {
              connectionId: connectionId,
              ...(isEmbeddedWallet
                ? { policy: policyObject }
                : { scopes: selectedPermissions[serviceName]?.map(permission => permission.id) || [] }
              )
            };
          });

        const deploymentResult = await deployPackageMutation.mutateAsync({
          packageId: package_id as string,
          version: packageDetails?.latestVersion || '1.0.0',
          url: `${packageDetails?.url?.replace(/\/$/, '')}/mcp`,
          authData: {},
          serviceConnections: serviceConnections,
        })

        deploymentId = deploymentResult.deployment.deploymentId
      }

      const mcpRedirectUri = new URL(packageDetails?.url as string)
      mcpRedirectUri.pathname = mcpRedirectUri.pathname.replace(/\/$/, '') + '/osiris/callback'

      if (type === 'agent') {
        let { connectionIds: agentConnectionIds, connectionScopes: agentConnectionScopes } =
          buildConnectionIdsAndScopes(selectedAuthConnections, selectedPermissions, userAuthConnections)
        if (agentConnectionIds.length === 0 && authScopes?.serviceClientMap && userAuthConnections.length > 0) {
          const fromProfile = buildConnectionIdsAndScopesFromProfile(
            authScopes,
            userAuthConnections,
            [...scopesArray, 'osiris:auth:read', 'osiris:auth:action']
          )
          agentConnectionIds = fromProfile.connectionIds
          agentConnectionScopes = fromProfile.connectionScopes
        }
        const authResultOsiris = await authorizeFrontendMutation.mutateAsync({
          clientId: packageDetails?.clientId,
          redirectUri: mcpRedirectUri.toString(),
          responseType: 'code',
          scopes: [...scopesArray, "osiris:auth:read", "osiris:auth:action"],
          state: deploymentId || '',
          deploymentId: deploymentId,
          ...(resource != null && { resource: String(resource) }),
          ...(selectedProfileId != null && { profileId: selectedProfileId }),
          connectionIds: agentConnectionIds,
          connectionScopes: agentConnectionScopes,
        })

        const url = new URL(authResultOsiris.url)
        const res = await fetch(url.toString())
        if (res.status !== 200) {
          throw new Error('Failed to authorize')
        }
      }

      let { connectionIds: packageConnectionIds, connectionScopes: packageConnectionScopes } =
        buildConnectionIdsAndScopes(selectedAuthConnections, selectedPermissions, userAuthConnections)
      if (packageConnectionIds.length === 0 && authScopes?.serviceClientMap && userAuthConnections.length > 0) {
        const fromProfile = buildConnectionIdsAndScopesFromProfile(
          authScopes,
          userAuthConnections,
          scopesArray
        )
        packageConnectionIds = fromProfile.connectionIds
        packageConnectionScopes = fromProfile.connectionScopes
      }
      const authResultFrontend = await authorizeFrontendMutation.mutateAsync({
        clientId: client_id,
        redirectUri: redirect_uri,
        responseType: response_type ?? 'code',
        scopes: scopesArray,
        state: String(state) || '',
        ...(resource != null && { resource: String(resource) }),
        ...(selectedProfileId != null && { profileId: selectedProfileId }),
        connectionIds: packageConnectionIds,
        connectionScopes: packageConnectionScopes,
      })
      const url = new URL(authResultFrontend.url)
      url.searchParams.set(
        'deployments',
        JSON.stringify([
          {
            packageId: package_id,
            deploymentId: deploymentId,
          },
        ])
      )
      window.location.href = url.toString()
    } catch {
      setError('Authorization failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDenyConsent = () => {
    const url = new URL(redirect_uri as string)
    url.searchParams.set('error', 'access_denied')
    window.location.href = url.toString()
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 flex-col bg-primary-25 h-full min-h-screen">
        <div className="mx-auto py-8 max-w-[520px] w-full px-4 space-y-6">
          <div className="text-center py-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {isWalletOnlyFlow
                ? `${oauthClient?.name || 'Application'} wants to access your wallet.`
                : `${packageDetails?.name} wants to access your Authentication Hub.`
              }
            </h1>
            <p className="text-sm text-gray-600">Sign in with your account to continue</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                {isWalletOnlyFlow ? (
                  <div className="size-12 rounded-[6px] bg-purple-300 flex items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
                    {oauthClient?.name?.charAt(0) || 'A'}
                  </div>
                ) : (
                  <>
                    {packageDetails?.iconUrl ? (
                      <img src={packageDetails.iconUrl} alt={`${packageDetails.name} icon`} className="size-12 rounded-[6px] shadow-xl object-cover" />
                    ) : (
                      <div className="size-12 rounded-[6px] bg-purple-300 flex items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
                        {packageDetails?.name?.charAt(0) || 'P'}
                      </div>
                    )}
                  </>
                )}
                <div className="flex flex-col">
                  <CardTitle className="text-primary-800">
                    {isWalletOnlyFlow ? oauthClient?.name : packageDetails?.name}
                  </CardTitle>
                  <p className="text-[13px] text-primary-300 mt-1">
                    {isWalletOnlyFlow
                      ? (oauthClient?.metadata?.description || 'Wallet Access Application')
                      : packageDetails?.shortDescription
                    }
                  </p>
                  {isWalletOnlyFlow ? (
                    <div className="flex items-center gap-3 mt-2 text-xs text-primary-400">
                      <span>Client ID: {oauthClient?.clientId?.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>Created: {oauthClient?.createdAt ? new Date(oauthClient.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-2 text-xs text-primary-400">
                      <span>v{packageDetails?.latestVersion}</span>
                      <span>•</span>
                      <span>{packageDetails?.metadata?.author}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-primary-100">
            <CardHeader>
              <CardTitle className="text-primary-800">Create an Account</CardTitle>
              <p className="text-[13px] text-primary-300 mt-1">Sign up with one of the following providers to continue</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGithubLogin}
                disabled={loginMutation.isPending}
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-[6px] flex items-center justify-center gap-3"
                size="lg"
              >
                <Github className="h-5 w-5" />
                {loginMutation.isPending ? 'Connecting...' : 'Continue with GitHub'}
              </Button>

              <Button
                onClick={handleGoogleLogin}
                disabled={loginMutation.isPending}
                variant="outline"
                className="w-full h-12 border-gray-300 hover:bg-gray-50 rounded-[6px] flex items-center justify-center gap-3"
                size="lg"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {loginMutation.isPending ? 'Connecting...' : 'Continue with Google'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-blue-25">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <InfoIcon className="h-8 w-8 text-blue-500 mx-auto" />
                <h3 className="text-sm font-medium text-blue-800">Account Required</h3>
                <p className="text-xs text-blue-600">You need to create an account on Osiris to authorize third-party applications to access your Authentication Hub.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-primary-25 h-full min-h-screen">
      <div className="mx-auto py-8 max-w-[520px] w-full px-4 space-y-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {isWalletOnlyFlow
              ? `${oauthClient?.name || 'Application'} wants to access your wallet.`
              : `${packageDetails?.name} wants to access your Authentication Hub.`
            }
          </h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              {isWalletOnlyFlow ? (
                <div className="size-12 rounded-[6px] bg-purple-300 flex shrink-0 items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
                  {oauthClient?.name?.charAt(0) || 'A'}
                </div>
              ) : (
                <>
                  {packageDetails?.iconUrl ? (
                    <img src={packageDetails.iconUrl} alt={`${packageDetails.name} icon`} className="size-12 shrink-0 rounded-[6px] shadow-xl object-cover" />
                  ) : (
                    <div className="size-12 rounded-[6px] bg-purple-300 flex shrink-0 items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
                      {packageDetails?.name?.charAt(0) || 'P'}
                    </div>
                  )}
                </>
              )}
              <div className="flex flex-col">
                <CardTitle className="text-primary-800">
                  {isWalletOnlyFlow ? oauthClient?.name : packageDetails?.name}
                </CardTitle>
                <p className="text-[13px] text-primary-300 mt-1">
                  {isWalletOnlyFlow
                    ? (oauthClient?.metadata?.description || 'Wallet Access Application')
                    : packageDetails?.shortDescription
                  }
                </p>
                {isWalletOnlyFlow ? (
                  <div className="flex items-center gap-3 mt-2 text-xs text-primary-400">
                    <span>Client ID: {oauthClient?.clientId?.slice(0, 8)}...</span>
                    <span>•</span>
                    <span>Created: {oauthClient?.createdAt ? new Date(oauthClient.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-2 text-xs text-primary-400">
                    <span>v{packageDetails?.latestVersion}</span>
                    <span>•</span>
                    <span>{packageDetails?.metadata?.author}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {!isWalletOnlyFlow && existingPackageDeployments.length > 0 && (
          <Collapsible open={deploymentSearchOpen} onOpenChange={setDeploymentSearchOpen}>
            <Card className="border-primary-100 hover:bg-primary-25 hover:border-primary-200 transition-all duration-200 rounded-xl overflow-hidden">
              <CollapsibleTrigger asChild>
                <div className="w-full cursor-pointer">
                  <CardHeader className="transition-colors">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-200 to-primary-300 flex items-center justify-center">
                          <span className="text-primary-800 font-semibold text-sm">D</span>
                        </div>
                        <div className="p-0 flex items-start flex-col">
                          <h3 className="text-base font-medium text-gray-900">Use existing deployment?</h3>
                          <p className="text-sm text-gray-500">
                            {selectedDeploymentId ? (
                              <span className="flex items-center gap-2">
                                <span>Using: {selectedDeploymentDetails?.name || `Deployment ${selectedDeploymentDetails?.deploymentId.slice(0, 8)}`}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleDeselectDeployment}
                                  className="text-primary-600 hover:text-primary-800 h-auto p-0.5 text-xs"
                                >
                                  (deselect)
                                </Button>
                              </span>
                            ) : (
                              `${existingPackageDeployments.length} deployment${existingPackageDeployments.length !== 1 ? 's' : ''} available`
                            )}
                          </p>
                        </div>
                      </div>
                      <ChevronDownIcon className={cn('h-5 w-5 text-gray-400 transition-transform duration-200', deploymentSearchOpen && 'rotate-180')} />
                    </div>
                  </CardHeader>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <div className="min-h-0" onClick={(e) => e.stopPropagation()}>
                  <CardContent className="pt-0 pb-6 space-y-6">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-400" />
                      <Input
                        placeholder="Search deployments..."
                        value={deploymentSearchQuery}
                        onChange={(e) => setDeploymentSearchQuery(e.target.value)}
                        className="pl-10 border-primary-200 focus:border-primary-300"
                      />
                    </div>

                    {filteredDeployments.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-medium text-primary-800">Your deployments:</p>
                          {selectedDeploymentId && (
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDeploymentId('')} className="text-primary-600 hover:text-primary-800 h-auto p-1">
                              Deselect
                            </Button>
                          )}
                        </div>
                        <RadioGroup
                          value={selectedDeploymentId}
                          onValueChange={handleDeploymentChange}
                          className="space-y-3"
                        >
                          {filteredDeployments.map((deployment: any) => {
                            const allScopes = deployment.userServiceConnectionMcpDeployments?.flatMap((conn: any) => conn.scopes || []) || []
                            const uniqueScopes = [...new Set(allScopes)] as string[]
                            const deploymentName = deployment.name || `Deployment ${deployment.deploymentId.slice(0, 8)}`

                            return (
                              <div key={deployment.deploymentId} className="flex items-start space-x-3 p-3 border border-primary-100 rounded-lg hover:border-primary-200 transition-colors">
                                <RadioGroupItem value={deployment.deploymentId} id={deployment.deploymentId} className="mt-1" />
                                <label htmlFor={deployment.deploymentId} className="flex-1 cursor-pointer">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary-200 to-primary-300 flex items-center justify-center flex-shrink-0">
                                      <span className="text-primary-800 font-semibold text-xs">{deploymentName[0]?.toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-primary-800">{deploymentName}</div>
                                      <div className="text-xs text-primary-400 flex items-center gap-2 mt-1">
                                        <span>{new Date(deployment.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="capitalize">{deployment.status}</span>
                                        <span>•</span>
                                        <span>{uniqueScopes.length} scopes</span>
                                        <span>•</span>
                                        <span>{deployment.userServiceConnectionMcpDeployments?.length || 0} connections</span>
                                      </div>
                                      {uniqueScopes.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {uniqueScopes.slice(0, 3).map((scope: string) => (
                                            <Badge key={scope} className="rounded-[4px] bg-primary-100 px-1.5 py-0.5 text-xs text-primary-800">
                                              {scope.includes(':') ? scope.split(':')[1] : scope}
                                            </Badge>
                                          ))}
                                          {uniqueScopes.length > 3 && (
                                            <Badge className="rounded-[4px] bg-primary-100 px-1.5 py-0.5 text-xs text-primary-800">+{uniqueScopes.length - 3}</Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              </div>
                            )
                          })}
                        </RadioGroup>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-primary-400">No deployments found</p>
                      </div>
                    )}
                  </CardContent>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        <div className="space-y-4">
          {isWalletOnlyFlow ? (
            // Wallet-only flow - show embedded wallet connections
            userAuthConnections.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-primary-800 mb-4">Select a wallet connection:</p>
                <RadioGroup
                  value={Object.values(selectedAuthConnections)[0] || ''}
                  onValueChange={(value) => setSelectedAuthConnections({ wallet: value })}
                  className="space-y-2"
                >
                  {userAuthConnections.map((connection: any) => (
                    <ConnectionItem
                      key={connection.user_service_connections.id}
                      connection={connection}
                      serviceName="wallet"
                      permissions={[]}
                      ok={true}
                    />
                  ))}
                </RadioGroup>
                <Button
                  onClick={() => {
                    const walletAuthMethod = authMethods?.find((method: any) => method.type === 'embedded_wallet')
                    if (walletAuthMethod) {
                      setSelectedAuthMethod(walletAuthMethod)
                      setAuthDialogOpen(true)
                    } else {
                      toast.error('Wallet authentication method not found')
                    }
                  }}
                  variant="outline"
                  className="w-full rounded-lg border-dashed border-2 border-primary-200 bg-primary-25 hover:bg-primary-50 hover:border-primary-300 text-primary-700 h-12"
                  type="button"
                >
                  + Create a new wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center py-6 px-4 bg-primary-25 rounded-lg border border-primary-100">
                  <p className="text-sm text-primary-600 mb-2">No wallet connections found</p>
                  <p className="text-xs text-primary-400">Create a wallet connection to proceed with authorization</p>
                </div>
                <Button
                  onClick={() => {
                    const walletAuthMethod = authMethods?.find((method: any) => method.type === 'embedded_wallet')
                    if (walletAuthMethod) {
                      setSelectedAuthMethod(walletAuthMethod)
                      setAuthDialogOpen(true)
                    } else {
                      toast.error('Wallet authentication method not found')
                    }
                  }}
                  variant="outline"
                  className="w-full rounded-lg border-dashed border-2 border-primary-200 bg-primary-25 hover:bg-primary-50 hover:border-primary-300 text-primary-700 h-12"
                  type="button"
                >
                  + Create a new wallet
                </Button>
              </div>
            )
          ) : (
            // Original package flow
            Object.entries(authScopes?.serviceClientMap || {}).map(([serviceName, requiredScopes]) => (
              <div key={serviceName} onClick={(e) => e.stopPropagation()}>
                <ServiceConsentSection
                  serviceName={serviceName}
                  requiredScopes={requiredScopes as string[]}
                  userAuthConnections={userAuthConnections}
                  authMethods={authMethods || []}
                  selectedPermissions={selectedPermissions}
                  onPermissionSelect={handlePermissionSelect}
                  selectedAuthConnections={selectedAuthConnections}
                  onAuthConnectionSelect={handleAuthConnectionSelect}
                  isDisabledByDeployment={!!selectedDeploymentId}
                  selectedDeploymentDetails={selectedDeploymentDetails}
                  onConnectNewAccount={handleConnectNewAccount}
                  isOpen={openSections[serviceName] || false}
                  onToggle={(open) => toggleSection(serviceName, open)}
                />
              </div>
            ))
          )}
        </div>

        {((!selectedDeploymentId &&
          Object.entries(authScopes?.serviceClientMap || {}).some(([serviceName]) => {
            const method = authMethods?.find((m: any) => m.name === serviceName)
            return method?.type === 'embedded_wallet'
          })) && !isWalletOnlyFlow) && (
            <Card className="border-primary-100">
              <CardHeader>
                <CardTitle className="text-primary-800">Access Policies</CardTitle>
                <p className="text-[13px] text-primary-300 mt-1">Define access rules and constraints for wallet operations</p>
              </CardHeader>
              <CardContent>
                {/* Policy Status Message */}
                {(() => {
                  try {
                    const policy = JSON.parse(policyJson);
                    const isAllowAll = policy.allow?.some((rule: any) => Object.keys(rule).length === 0);
                    return isAllowAll ? (
                      <div className="p-3 bg-blue-25 border border-blue-200 rounded-lg mb-4">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Current Policy:</span> Allows all wallet operations
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          The policy currently grants unrestricted access. Modify below to add restrictions.
                        </p>
                      </div>
                    ) : null;
                  } catch {
                    return null;
                  }
                })()}

                <PolicyBuilder value={policyJson} onChange={setPolicyJson} />
              </CardContent>
            </Card>
          )}

        <Card className="border-primary-100">
          <CardHeader>
            <CardTitle className="text-primary-800">Authorization Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-400">{isWalletOnlyFlow ? 'Application:' : 'Package:'}</span>
                <span className="text-primary-800 font-medium">
                  {isWalletOnlyFlow ? oauthClient?.name : packageDetails?.name}
                </span>
              </div>
              {!isWalletOnlyFlow && (
                <>
                  <div className="flex justify-between">
                    <span className="text-primary-400">Version:</span>
                    <span className="text-primary-800">v{packageDetails?.latestVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-400">Deployment:</span>
                    <span className="text-primary-800 capitalize">
                      {selectedDeploymentId
                        ? `Using: ${selectedDeploymentDetails?.name || `Deployment ${selectedDeploymentDetails?.deploymentId.slice(0, 8)}`}`
                        : 'New deployment'}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-primary-400">{isWalletOnlyFlow ? 'Wallet Connection:' : 'Auth Methods:'}</span>
                <span className="text-primary-800">
                  {isWalletOnlyFlow
                    ? (Object.values(selectedAuthConnections)[0] ? 'Selected' : 'None selected')
                    : (Object.keys(selectedAuthConnections).length > 0 ? Object.keys(selectedAuthConnections).join(', ') : 'None selected')
                  }
                </span>
              </div>
              {!isWalletOnlyFlow && (
                <div className="flex justify-between">
                  <span className="text-primary-400">Policy Rules:</span>
                  <span className="text-primary-800">
                    {(() => {
                      try {
                        const policy = JSON.parse(policyJson)
                        const allowCount = policy.allow?.length || 0
                        const denyCount = policy.deny?.length || 0
                        return `${allowCount} allow, ${denyCount} deny`
                      } catch {
                        return 'Invalid policy'
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 pt-2">
          <Button
            onClick={handleAllowConsent}
            disabled={isLoading || deployPackageMutation.isPending || authorizeFrontendMutation.isPending}
            className="flex-1 bg-success-600 hover:bg-success-700 rounded-[6px]"
            size="lg"
            type="button"
          >
            {isLoading || deployPackageMutation.isPending || authorizeFrontendMutation.isPending ? 'Processing...' : 'Allow'}
          </Button>
          <Button onClick={handleDenyConsent} variant="outline" className="flex-1 rounded-[6px]" size="lg" type="button">
            Deny
          </Button>
        </div>
      </div>

      {selectedAuthMethod && (
        <AuthMethodDialog
          method={selectedAuthMethod}
          open={authDialogOpen}
          onOpenChange={(open) => {
            setAuthDialogOpen(open)
            if (!open) setSelectedAuthMethod(null)
          }}
          mode="connect"
          onSuccess={handleConnectionCreated}
        />
      )}
    </div>
  )
}