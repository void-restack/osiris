import { hubQueries, packageQueries, userQueries } from '@/lib/queries'
import { useCreateServiceConnectionMutation, useDeployPackageMutation, useAuthorizeOsirisMutation } from '@/lib/mutations'
import { isAuthenticated } from '@/lib/auth-optimized'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PermissionSelector, type Permission } from '@/components/ui/permission-selector'
import { cn } from '@/lib/utils'
// import z from 'zod'
import { PolicyBuilder } from '@/components/rule-builder/index'

// TODO: search params validation and integration
//
// const OauthSeachSchema = z.object({
//   clientId: z.string().optional(),
//   redirect_uri: z.string().optional(),
//   state: z.string().optional(),
//   scope: z.string().optional(),
//   response_type: z.string().optional(),
//   package_id: z.string().optional(),
// })

// type OAuthSearchParams = z.infer<typeof OauthSeachSchema>

export const Route = createFileRoute('/oauth/consent')({
  component: RouteComponent,
  beforeLoad: () => {
    const authenticated = isAuthenticated();
    if (!authenticated) {
      // Redirect to login if not authenticated
      throw new Error('Authentication required for OAuth consent');
    }
    return { authenticated };
  },
})

function RouteComponent() {
  const clientId = '5940d857-72c2-419f-a2d7-512df8afb2b0'
  const redirect_uri = 'http://localhost:3000/osiris/callback'
  const state = ''
  const scopes = ['osiris:auth']
  const response_type = ''
  const package_id = '58583b9f-738e-4db2-9384-9dafea4c0a10'

  const [selectedDeploymentAction, setSelectedDeploymentAction] = useState<'new' | 'existing'>('new')
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>('')
  const [selectedAuthConnections, setSelectedAuthConnections] = useState<Record<string, string>>({})
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Permission[]>>({})
  const [policyJson, setPolicyJson] = useState<string>('{\n  "allow": [],\n  "deny": []\n}')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API queries
  const { data: packageDetails } = useSuspenseQuery(packageQueries.detailOptions(package_id as string))
  const { data: authScopes } = useSuspenseQuery(packageQueries.authScopesOptions(package_id as string))
  const { data: userInfo } = useSuspenseQuery(userQueries.meOptions(isAuthenticated()))

  let { data: userAuthConnections } = useSuspenseQuery(hubQueries.userAuthOptions(isAuthenticated()))
  const filteredUserAuthConnections = userAuthConnections?.filter((connection: any) => {
    const allowed = Object.keys(authScopes.serviceClientMap)
    return allowed.includes(connection.service_clients.name)
  })
  userAuthConnections = filteredUserAuthConnections

  const { data: allUserDeployments } = useSuspenseQuery(packageQueries.userDeploymentsOptions())
  const existingPackageDeployments = allUserDeployments?.filter(
    (deployment: any) => deployment.package.packageId === package_id
  ) || []

  // Mutations
  const createServiceConnectionMutation = useCreateServiceConnectionMutation()
  const deployPackageMutation = useDeployPackageMutation()
  const authorizeOsirisMutation = useAuthorizeOsirisMutation()

  // Event Handlers
  const handleDeploymentActionChange = (action: 'new' | 'existing') => {
    setSelectedDeploymentAction(action)
    if (action === 'new') {
      setSelectedDeploymentId('')
    }
  }

  const handleAuthConnectionSelect = useCallback((serviceName: string, connectionId: string) => {
    setSelectedAuthConnections(prev => ({ ...prev, [serviceName]: connectionId }))
  }, [])

  const handlePermissionSelect = useCallback((serviceName: string, permissions: Permission[]) => {
    setSelectedPermissions(prev => ({ ...prev, [serviceName]: permissions }))
  }, [])

  const handleConnectNewAccount = useCallback((serviceName: string, requiredScopes: string[]) => {
    const permissionsToUse = selectedPermissions[serviceName]?.length > 0
      ? selectedPermissions[serviceName].map(p => p.id)
      : requiredScopes.map(scope =>
        scope.startsWith(`${serviceName}:`) ? scope.replace(`${serviceName}:`, '') : scope
      )

    createServiceConnectionMutation.mutate({
      name: `${serviceName} connection for ${packageDetails?.name}`,
      serviceClientName: serviceName,
      scopes: permissionsToUse,
      redirectUri: window.location.href
    })
  }, [selectedPermissions, packageDetails, createServiceConnectionMutation])

  const handleAllowConsent = async () => {
    // Validate deployment selection
    if (existingPackageDeployments.length > 0 && selectedDeploymentAction === 'existing' && !selectedDeploymentId) {
      setError('Please select an existing deployment')
      return
    }

    // Validate auth connections
    const requiredServices = Object.keys(authScopes?.serviceClientMap || {})
    const selectedServices = Object.keys(selectedAuthConnections)
    const missingServices = requiredServices.filter(service => !selectedServices.includes(service))

    if (missingServices.length > 0) {
      setError(`Please select accounts for: ${missingServices.join(', ')}`)
      return
    }

    // Validate permissions
    const servicesWithoutPermissions = selectedServices.filter(
      service => !selectedPermissions[service] || selectedPermissions[service].length === 0
    )

    if (servicesWithoutPermissions.length > 0) {
      setError(`Please select permissions for: ${servicesWithoutPermissions.join(', ')}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let deploymentId = selectedDeploymentId

      if (selectedDeploymentAction === 'new') {
        const selectedScopes = Object.entries(selectedPermissions).flatMap(([serviceName, permissions]) =>
          permissions.map(permission => `${serviceName}:${permission.id}`)
        )

        // Parse policy for deployment
        let policyObject = {}
        try {
          policyObject = JSON.parse(policyJson)
        } catch (e) {
          setError('Invalid policy JSON format')
          return
        }

        const deploymentResult = await deployPackageMutation.mutateAsync({
          packageId: package_id,
          version: packageDetails?.latestVersion || '1.0.0',
          url: "https://osirislabs.xyz",
          scopes: selectedScopes,
          authData: {},
          connectionIds: Object.values(selectedAuthConnections),
          // policy: policyObject
        })

        deploymentId = deploymentResult.deployment.deploymentId
      }

      const authResult = await authorizeOsirisMutation.mutateAsync({
        clientId: clientId,
        redirectUri: redirect_uri,
        responseType: 'code',
        scopes: scopes,
        state: state || '',
        deploymentId: deploymentId
      })



    } catch (error) {
      setError('Authorization failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDenyConsent = () => {

  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto mt-8 max-w-[496px] w-full">
        {/* Error state */}
        {(error || createServiceConnectionMutation.error || deployPackageMutation.error || authorizeOsirisMutation.error) && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-[6px]">
            <p className="text-danger-800 text-sm">
              {error ||
                createServiceConnectionMutation.error?.message ||
                deployPackageMutation.error?.message ||
                authorizeOsirisMutation.error?.message}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="pb-6 text-center mb-6">
          <h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
            OAuth Authorization
          </h2>
          <span className="text-primary-300 text-sm">
            <strong>{packageDetails?.name}</strong> is requesting access to your accounts
          </span>
        </div>

        {/* Package Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="size-12 rounded-[6px] bg-purple-300 flex items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
                {packageDetails?.name?.charAt(0) || 'P'}
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-primary-800">{packageDetails?.name}</CardTitle>
                <p className="text-[13px] text-primary-300 mt-1">{packageDetails?.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-primary-400">
                  <span>v{packageDetails?.latestVersion}</span>
                  <span>•</span>
                  <span>{packageDetails?.metadata?.author}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Deployment Selection */}
        {existingPackageDeployments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-primary-800">Deployment Options</CardTitle>
              <p className="text-[13px] text-primary-300 mt-1">
                You have previously deployed this package. Choose how to proceed:
              </p>
            </CardHeader>
            <CardContent>
              <ToggleGroup
                className="rounded-[6px] bg-primary-50 p-[2px] w-full"
                type="single"
                value={selectedDeploymentAction}
                onValueChange={(value: 'new' | 'existing') => value && handleDeploymentActionChange(value)}
              >
                <ToggleGroupItem
                  value="new"
                  className={cn(
                    "flex-1 justify-start hover:!bg-white/90 data-[state=on]:!bg-white",
                    "!bg-transparent data-[state=on]:!bg-white"
                  )}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">Create new deployment</div>
                    <div className="text-xs text-primary-400">Fresh deployment with new settings</div>
                  </div>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="existing"
                  className={cn(
                    "flex-1 justify-start hover:!bg-white/90 data-[state=on]:!bg-white",
                    "!bg-transparent data-[state=on]:!bg-white"
                  )}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">Use existing deployment</div>
                    <div className="text-xs text-primary-400">Reuse a configured deployment</div>
                  </div>
                </ToggleGroupItem>
              </ToggleGroup>

              {selectedDeploymentAction === 'existing' && (
                <div className="mt-6 p-4 bg-primary-25 rounded-[6px] border border-primary-100">
                  <p className="text-sm font-medium text-primary-800 mb-3">Select existing deployment:</p>
                  <div className="space-y-3">
                    {existingPackageDeployments.map((deployment: any) => (
                      <label key={deployment.deployment.deploymentId} className="flex items-start space-x-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="existingDeployment"
                          value={deployment.deployment.deploymentId}
                          checked={selectedDeploymentId === deployment.deployment.deploymentId}
                          onChange={(e) => setSelectedDeploymentId(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1 p-3 border border-primary-100 rounded-[6px] group-hover:border-primary-200 transition-colors">
                          <div className="text-sm font-medium text-primary-800">
                            {deployment.deployment.name || `Deployment ${deployment.deployment.deploymentId.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-primary-400 flex items-center gap-2 mt-1">
                            <span>{new Date(deployment.deployment.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{deployment.deployment.status}</span>
                            <span>•</span>
                            <span>{deployment.deployment.scopes.length} scopes</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {deployment.deployment.scopes.slice(0, 3).map((scope: string) => (
                              <Badge key={scope} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                                {scope.includes(':') ? scope.split(':')[1] : scope}
                              </Badge>
                            ))}
                            {deployment.deployment.scopes.length > 3 && (
                              <Badge className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                                +{deployment.deployment.scopes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Auth Connections by Service */}
        <div className="space-y-6">
          {Object.entries(authScopes?.serviceClientMap || {}).map(([serviceName, requiredScopes]) => {
            const serviceConnections = userAuthConnections?.filter(
              (connection: any) => connection.service_clients.name === serviceName
            ) || []

            // Default scope definitions for consistent mapping
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

            const permissions = useMemo(() => {
              const mappedPermissions = (requiredScopes as string[]).map((scope: string) => {
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
            }, [serviceName, requiredScopes, selectedPermissions])

            const handleServicePermissionSelect = useCallback((permissions: Permission[]) => {
              handlePermissionSelect(serviceName, permissions)
            }, [serviceName, handlePermissionSelect])

            const initialSelected = useMemo(() => {
              return selectedPermissions[serviceName] || []
            }, [selectedPermissions, serviceName])

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
                              onChange={() => handleAuthConnectionSelect(
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

                  {/* Connect New Account Button */}
                  <Button
                    onClick={() => handleConnectNewAccount(serviceName, requiredScopes as string[])}
                    variant="outline"
                    className="w-full rounded-[6px]"
                    disabled={createServiceConnectionMutation.isPending}
                  >
                    {createServiceConnectionMutation.isPending
                      ? 'Connecting...'
                      : `Connect a new ${serviceName} account`
                    }
                  </Button>

                  {serviceConnections.length === 0 && (
                    <p className="text-[13px] text-primary-300 italic mt-3">
                      No {serviceName} accounts connected yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Policy Builder Section */}
        {selectedDeploymentAction === 'new' && (
          <Card className="mb-6 border-primary-100">
            <CardHeader>
              <CardTitle className="text-primary-800">Access Policies</CardTitle>
              <p className="text-[13px] text-primary-300 mt-1">
                Define access rules and constraints for this deployment
              </p>
            </CardHeader>
            <CardContent>
              <PolicyBuilder
                value={policyJson}
                onChange={setPolicyJson}
              />
            </CardContent>
          </Card>
        )}

        {/* Summary Section */}
        <Card className="mb-6 border-primary-100">
          <CardHeader>
            <CardTitle className="text-primary-800">Authorization Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-400">Package:</span>
                <span className="text-primary-800 font-medium">{packageDetails?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-400">Version:</span>
                <span className="text-primary-800">v{packageDetails?.latestVersion}</span>
              </div>
              {existingPackageDeployments.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-primary-400">Deployment:</span>
                  <span className="text-primary-800 capitalize">
                    {selectedDeploymentAction === 'new' ? 'New deployment' :
                      selectedDeploymentId ? 'Existing deployment' : 'Not selected'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-primary-400">Auth Methods:</span>
                <span className="text-primary-800">
                  {Object.keys(selectedAuthConnections).length > 0
                    ? Object.keys(selectedAuthConnections).join(', ')
                    : 'None selected'
                  }
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-primary-400">Selected Permissions:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(selectedPermissions).flatMap(([serviceName, permissions]) =>
                    permissions.map((permission, index) => (
                      <Badge key={`${serviceName}-${permission.id}-${index}`} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                        {serviceName}: {permission.label}
                      </Badge>
                    ))
                  )}
                  {Object.keys(selectedPermissions).length === 0 && (
                    <span className="text-primary-400 text-xs italic">No permissions selected yet</span>
                  )}
                </div>
              </div>
              {selectedDeploymentAction === 'new' && (
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

        {/* Action buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleAllowConsent}
            disabled={isLoading || deployPackageMutation.isPending || authorizeOsirisMutation.isPending}
            className="flex-1 bg-success-600 hover:bg-success-700 rounded-[6px]"
            size="lg"
          >
            {(isLoading || deployPackageMutation.isPending || authorizeOsirisMutation.isPending) ? 'Processing...' : 'Allow'}
          </Button>
          <Button
            onClick={handleDenyConsent}
            variant="outline"
            className="flex-1 rounded-[6px]"
            size="lg"
          >
            Deny
          </Button>
        </div>
      </div>
    </div>
  )
}
