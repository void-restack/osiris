import { hubQueries, packageQueries, userQueries } from '@/lib/queries'
import { useCreateServiceConnectionMutation, useCreateSecretSharingMutation, useCreateWalletMutation, useDeployPackageMutation, useAuthorizeOsirisMutation, useAuthorizeFrontendMutation } from '@/lib/mutations'
import { isAuthenticated } from '@/lib/auth-optimized'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PermissionSelector, type Permission } from '@/components/ui/permission-selector'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckIcon, AlertCircleIcon, ChevronDownIcon, InfoIcon } from 'lucide-react'
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
	const clientId = '4fa12cff-5afe-424c-8a01-f98d38576ae6'
	const redirect_uri = 'http://localhost:3001/auth/callback'
	const state = ''
	const scopes = ['osiris:auth']
	const response_type = 'authorization_code'
	const package_id = 'a1dc4fa2-308d-412f-81c0-a9f3d2883338'

	const [selectedDeploymentAction, setSelectedDeploymentAction] = useState<'new' | 'existing'>('new')
	const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>('')
	const [selectedAuthConnections, setSelectedAuthConnections] = useState<Record<string, string>>({})
	const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Permission[]>>({})
	const [policyJson, setPolicyJson] = useState<string>('{\n  "allow": [],\n  "deny": []\n}')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

	// API queries
	const { data: packageDetails } = useSuspenseQuery(packageQueries.detailOptions(package_id as string))
	const { data: authScopes } = useSuspenseQuery(packageQueries.authScopesOptions(package_id as string))
	const { data: userInfo } = useSuspenseQuery(userQueries.meOptions(isAuthenticated()))
	const { data: authMethods } = useSuspenseQuery(hubQueries.authMethodsOptions())

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

	// Initialize all auth sections as open by default
	const authSectionKeys = Object.keys(authScopes?.serviceClientMap || {})
	const initialOpenSections = authSectionKeys.reduce((acc, key) => {
		acc[key] = true
		return acc
	}, {} as Record<string, boolean>)

	// Only set if not already initialized
	if (Object.keys(openSections).length === 0 && authSectionKeys.length > 0) {
		setOpenSections(initialOpenSections)
	}

	// Mutations
	const createServiceConnectionMutation = useCreateServiceConnectionMutation()
	const createSecretSharingMutation = useCreateSecretSharingMutation()
	const createWalletMutation = useCreateWalletMutation()
	const deployPackageMutation = useDeployPackageMutation()
	const authorizeOsirisMutation = useAuthorizeOsirisMutation()
	const authorizeFrontendMutation = useAuthorizeFrontendMutation()

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

	const toggleSection = (serviceName: string, open: boolean) => {
		setOpenSections(prev => ({
		  ...prev,
		  [serviceName]: open
		}));
	}

	const handleConnectNewAccount = useCallback((serviceName: string, requiredScopes: string[]) => {
		// Find the auth method for this service
		const serviceAuthMethod = authMethods?.find((method: any) => method.name === serviceName);

		if (!serviceAuthMethod) {
			toast.error(`Auth method not found for ${serviceName}`);
			return;
		}

		const permissionsToUse = selectedPermissions[serviceName]?.length > 0
			? selectedPermissions[serviceName].map(p => p.id)
			: requiredScopes.map(scope =>
				scope.startsWith(`${serviceName}:`) ? scope.replace(`${serviceName}:`, '') : scope
			);

		// Handle different auth types
		switch (serviceAuthMethod.type) {
			case 'oauth':
				createServiceConnectionMutation.mutate({
					name: `${serviceName} connection for ${packageDetails?.name}`,
					serviceClientName: serviceName,
					scopes: permissionsToUse,
					redirectUri: window.location.href
				});
				break;
			case 'secret_sharing':
				// For secret sharing, we need to show a form dialog
				// For now, we'll use a simple approach - you might want to show a proper dialog
				toast.error('Secret sharing connections require additional configuration. Please use the Auth Hub to create this connection.');
				break;
			case 'embedded_wallet':
				// For embedded wallet, we need to show a wallet configuration dialog
				// For now, we'll use a simple approach - you might want to show a proper dialog
				toast.error('Embedded wallet connections require additional configuration. Please use the Auth Hub to create this connection.');
				break;
			default:
				toast.error(`Unsupported auth type: ${serviceAuthMethod.type}`);
		}
	}, [selectedPermissions, packageDetails, createServiceConnectionMutation, authMethods])

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

			const mcpRedirectUri = new URL(packageDetails?.url)
			mcpRedirectUri.pathname = '/osiris/callback'

			const authResultOsiris = await authorizeOsirisMutation.mutateAsync({
				clientId: packageDetails?.clientId,
				redirectUri: mcpRedirectUri.toString(),
				responseType: 'code',
				scopes: scopes,
				state: deploymentId || '',
				deploymentId: deploymentId
			})

			const authResultFrontend = await authorizeFrontendMutation.mutateAsync({
				clientId: clientId,
				redirectUri: redirect_uri,
				responseType: 'code',
				scopes: scopes,
				state: deploymentId || '',
				deploymentId: deploymentId
			})
			const url = new URL(authResultFrontend.url)
			url.searchParams.set('deployments', JSON.stringify([{
				packageId: package_id,
				deploymentId: deploymentId
			}]))

			window.location.href = url.toString()
		} catch (error) {
			setError('Authorization failed. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const handleDenyConsent = () => {

	}

	// Helper function to check if an account has all required scopes
	const hasAllRequiredScopes = useCallback((connection: any, requiredScopes: string[], serviceName: string) => {
		const connectionScopes = connection.user_service_connections.scopes || []
		const requiredScopesArray = Array.isArray(requiredScopes) ? requiredScopes : []

		return requiredScopesArray.every(requiredScope => {
			// Check various scope formats
			const scopeWithoutPrefix = requiredScope.startsWith(`${serviceName}:`) ? requiredScope.replace(`${serviceName}:`, '') : requiredScope
			const scopeWithPrefix = `${serviceName}:${requiredScope}`

			return connectionScopes.includes(requiredScope) ||
				connectionScopes.includes(scopeWithoutPrefix) ||
				connectionScopes.includes(scopeWithPrefix)
		})
	}, [])

	return (
		<div className="flex flex-1 flex-col bg-primary-25 min-h-[100vh]">
			<div className="mx-auto py-8 max-w-[520px] w-full px-4 space-y-6">
				{/* Error state */}
				{(error || createServiceConnectionMutation.error || deployPackageMutation.error || authorizeOsirisMutation.error) && (
					<div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
						<p className="text-danger-800 text-sm">
							{error ||
								createServiceConnectionMutation.error?.message ||
								deployPackageMutation.error?.message ||
								authorizeOsirisMutation.error?.message}
						</p>
					</div>
				)}

				{/* Header */}
				<div className="text-center py-8">
					<h1 className="text-2xl font-semibold text-gray-900 mb-2">
						{packageDetails?.name} wants to access your Auth Hub.
					</h1>
				</div>

				{/* Package Details Card */}
				<Card>
					<CardHeader>
						<div className="flex items-start gap-3">
							{packageDetails?.iconUrl ? (
								<img
									src={packageDetails.iconUrl}
									alt={`${packageDetails.name} icon`}
									className="size-12 rounded-[6px] shadow-xl object-cover"
								/>
							) : (
								<div className="size-12 rounded-[6px] bg-purple-300 flex items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
									{packageDetails?.name?.charAt(0) || 'P'}
								</div>
							)}
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
					<Card>
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
				<div className="space-y-4">
					{Object.entries(authScopes?.serviceClientMap || {}).map(([serviceName, requiredScopes]) => {
						const serviceConnections = userAuthConnections?.filter(
							(connection: any) => connection.service_clients.name === serviceName
						) || []

						const permissions = useMemo(() => {
							// Find the auth method for this service to get its scope definitions
							const serviceAuthMethod = authMethods?.find((method: any) => method.name === serviceName);
							const scopeDefinitions = serviceAuthMethod?.scopeDefinitions || {};

							// Filter to only show required scopes for this specific authentication
							const requiredScopesArray = Array.isArray(requiredScopes) ? requiredScopes : [];
							const filteredScopeDefinitions = Object.entries(scopeDefinitions).filter(([scope]) => {
								// Check if this scope is required by removing the service prefix
								const scopeWithoutPrefix = scope.startsWith(`${serviceName}:`) ? scope.replace(`${serviceName}:`, '') : scope;
								const scopeWithPrefix = `${serviceName}:${scope}`;
								return requiredScopesArray.includes(scope) ||
									requiredScopesArray.includes(scopeWithoutPrefix) ||
									requiredScopesArray.includes(scopeWithPrefix);
							});

							// Use the same pattern as other components in the codebase
							return filteredScopeDefinitions.map(([scope, label]) => ({
								id: scope,
								label: label as string
							}));
						}, [serviceName, authMethods, requiredScopes])

						const handleServicePermissionSelect = useCallback((permissions: Permission[]) => {
							handlePermissionSelect(serviceName, permissions)
						}, [serviceName, handlePermissionSelect])

						const initialSelected = useMemo(() => {
							return selectedPermissions[serviceName] || []
						}, [selectedPermissions, serviceName])

						const serviceAuthMethod = authMethods?.find((method: any) => method.name === serviceName);
						const isOpen = openSections[serviceName] || false

						return (
							// Key fixes applied:
							<Collapsible
								key={serviceName}
								open={isOpen}
								onOpenChange={(open) => toggleSection(serviceName, open)} // Pass the open state
							>
								<Card className="border-primary-100 hover:bg-primary-25 hover:border-primary-200 transition-all duration-200 rounded-xl overflow-hidden">
									<CollapsibleTrigger asChild>
										<div className="w-full cursor-pointer"> {/* Use div instead of button-like component */}
											<CardHeader className="transition-colors">
												<div className="flex items-center justify-between w-full">
													<div className="flex items-center gap-3">
														{serviceAuthMethod?.iconUrl ? (
															<img
																src={serviceAuthMethod.iconUrl}
																alt={`${serviceName} icon`}
																className="w-10 h-10 rounded-lg object-cover"
															/>
														) : (
															<div className="w-10 h-10 rounded-lg bg-purple-300 flex items-center justify-center text-white font-bold text-sm capitalize">
																{serviceName.charAt(0)}
															</div>
														)}
														<div className='p-0 flex items-start flex-col'>
															<h3 className="text-base font-medium text-gray-900">{serviceName[0].toUpperCase() + serviceName.slice(1)} Account</h3>
															<p className="text-sm text-gray-500">
																{serviceConnections.length > 0
																	? `${serviceConnections.length} account${serviceConnections.length > 1 ? 's' : ''} connected`
																	: 'Select an existing Google account or connect a new one'
																}
															</p>
														</div>
													</div>
													<ChevronDownIcon className={cn(
														"h-5 w-5 text-gray-400 transition-transform duration-200",
														isOpen && "rotate-180"
													)} />
												</div>
											</CardHeader>
										</div>
									</CollapsibleTrigger>

									<CollapsibleContent className='overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'>
										<div className="min-h-0" onClick={(e) => e.stopPropagation()}> {/* Prevent event bubbling */}
											<CardContent className="pt-0 pb-6 space-y-6">
												{/* Permission Selector */}
												<div>
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
													<div>
														<p className="text-sm font-medium text-primary-800 mb-4">Your connected accounts:</p>
														<RadioGroup
															value={selectedAuthConnections[serviceName] || ''}
															onValueChange={(value) => handleAuthConnectionSelect(serviceName, value)}
															className="space-y-2"
														>
															{serviceConnections
																.sort((a: any, b: any) => {
																	const aHasAllScopes = hasAllRequiredScopes(a, requiredScopes as string[], serviceName)
																	const bHasAllScopes = hasAllRequiredScopes(b, requiredScopes as string[], serviceName)
																	return bHasAllScopes ? 1 : aHasAllScopes ? -1 : 0
																})
																.map((connection: any) => {
																	const hasAllScopes = hasAllRequiredScopes(connection, requiredScopes as string[], serviceName)
																	return (
																		<label
																			key={connection.user_service_connections.id}
																			className="cursor-pointer group block"
																			onClick={(e) => e.stopPropagation()} // Prevent bubbling
																		>
																			<div className={cn(
																				"relative p-4 border rounded-lg transition-all duration-200 flex items-center space-x-3",
																				hasAllScopes
																					? "border-success-200 bg-success-25 group-hover:border-success-300 group-hover:shadow-sm"
																					: "border-primary-100 bg-primary-25 opacity-75 group-hover:border-primary-200"
																			)}>
																				<RadioGroupItem
																					value={connection.user_service_connections.id}
																					className="flex-shrink-0"
																				/>
																				<div className="flex items-center space-x-3 flex-1">
																					<Avatar className="h-8 w-8">
																						<AvatarFallback className="text-xs bg-purple-300 text-white">
																							{serviceName.charAt(0).toUpperCase()}
																						</AvatarFallback>
																					</Avatar>
																					<div className="flex-1">
																						<p className={cn(
																							"text-sm font-medium",
																							hasAllScopes ? "text-success-800" : "text-primary-600"
																						)}>
																							{(() => {
																								const metadata = connection.user_service_connections.metadata;
																								const serviceType = connection.service_clients?.type;

																								switch (serviceType) {
																									case 'oauth':
																										return metadata?.user?.email || 'Unknown Email';
																									case 'secret_sharing':
																										return connection.user_service_connections.name || 'Database Connection';
																									case 'embedded_wallet':
																										const walletAddress = metadata?.accounts?.addresses?.[0]?.address;
																										return walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Wallet Connection';
																									default:
																										return connection.user_service_connections.name || 'Unknown Connection';
																								}
																							})()}
																						</p>
																						<p className={cn(
																							"text-xs capitalize",
																							hasAllScopes ? "text-success-600" : "text-primary-400"
																						)}>
																							{connection.service_clients?.type?.replace('_', ' ') || 'Connection'}
																						</p>
																					</div>
																				</div>

																				<div className="flex items-center space-x-2">
																					{hasAllScopes ? (
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

																					{/* Scope Dialog - Fixed event handling */}
																					<Dialog>
																						<DialogTrigger asChild>
																							<Button
																								variant="ghost"
																								size="sm"
																								className="h-6 w-6 p-0 hover:bg-primary-100"
																								onClick={(e) => {
																									e.preventDefault();
																									e.stopPropagation(); // Critical: prevent event bubbling
																								}}
																								type="button" // Explicit button type
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
																									const cleanScope = scope.replace(`${serviceName}:`, '')
																									const permission = permissions.find(p => p.id === cleanScope || p.id === scope)
																									return (
																										<div
																											key={scope}
																											className="flex items-center justify-between p-3 bg-primary-25 rounded-lg"
																										>
																											<div>
																												<p className="text-sm font-medium text-primary-800">
																													{permission?.label || cleanScope}
																												</p>
																												<p className="text-xs text-primary-500">{cleanScope}</p>
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
																})}
														</RadioGroup>
													</div>
												)}

												{/* Connect New Account Button */}
												<div className="space-y-3">
													<Button
														onClick={(e) => {
															e.stopPropagation(); // Prevent bubbling
															handleConnectNewAccount(serviceName, requiredScopes as string[]);
														}}
														variant="outline"
														className="w-full rounded-lg border-dashed border-2 border-primary-200 bg-primary-25 hover:bg-primary-50 hover:border-primary-300 text-primary-700 h-12"
														disabled={createServiceConnectionMutation.isPending}
														type="button" // Explicit button type
													>
														{createServiceConnectionMutation.isPending
															? 'Connecting...'
															: `+ Connect a new ${serviceName === 'google' ? 'Google' : serviceName} account`
														}
													</Button>

													{serviceConnections.length === 0 && (
														<div className="text-center py-6 px-4 bg-primary-25 rounded-lg border border-primary-100">
															<p className="text-sm text-primary-600 mb-2">No {serviceName === 'google' ? 'Google' : serviceName} accounts connected yet</p>
															<p className="text-xs text-primary-400">Connect an account to proceed with authorization</p>
														</div>
													)}
												</div>
											</CardContent>
										</div>
									</CollapsibleContent>
								</Card>
							</Collapsible>
						)
					})}
				</div>

				{/* Policy Builder Section */}
				{selectedDeploymentAction === 'new' && Object.keys(authScopes?.serviceClientMap || {}).includes('turnkey') && (
					<Card className="border-primary-100">
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
				<Card className="border-primary-100">
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
				<div className="flex gap-4 pt-2">
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
		</div >
	)
}
