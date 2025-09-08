import { useState, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PermissionSelector, type Permission } from "@/components/ui/permission-selector"
import { PencilLine, ChevronLeft, ChevronRight, X, Settings, Rocket, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { packageQueries, knowledgeQueries, hubQueries, userQueries } from "@/lib/queries"
import { useCreateServiceConnectionMutation, useCreateSecretSharingMutation, useCreateWalletMutation, useDeployPackageMutation, useAuthorizeFrontendMutation } from "@/lib/mutations"
import { useAuth } from "@/hooks/use-auth"
import { getInitials } from "@/lib/utils"
import { getReadableScopes, transformScopeDefinitions } from "@/lib/scope-utils"
import { getScopeDisplayName } from "@/lib/scope-definitions"
import { type WorkflowStep } from "./workflow-step-item"
import PolicyBuilder from "@/components/policy-builder"
import { toast } from "sonner"

interface AddStepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddStep: (step: Omit<WorkflowStep, 'id' | 'sequence' | 'description' | 'deploymentType'>) => void
    insertIndex: number
    nextStepName?: string
    prevStepName?: string
}

type StepData = {
    name: string
    prompt: string
    mcpProviders: Array<any> // Full MCP package objects
    knowledgeBases: Array<any> // Full knowledge base objects
}

interface McpStatus {
    oauthStatus: 'not_configured' | 'configured' | 'failed'
    deploymentStatus: 'not_deployed' | 'deployed' | 'failed'
    oauthData?: any
    deploymentData?: any
}

const TOTAL_STEPS = 3

export function AddStepDialog({ open, onOpenChange, onAddStep, insertIndex, nextStepName, prevStepName }: AddStepDialogProps) {
    const queryClient = useQueryClient()
    const [currentStep, setCurrentStep] = useState<number | '2.1' | '2.2'>(1)
    const [mcpCommandOpen, setMcpCommandOpen] = useState(false)
    const [kbCommandOpen, setKbCommandOpen] = useState(false)
    const [mcpSearchQuery, setMcpSearchQuery] = useState("")
    const [kbSearchQuery, setKbSearchQuery] = useState("")
    const [selectedMcpForConfig, setSelectedMcpForConfig] = useState<any>(null)
    const [selectedMcpForDeploy, setSelectedMcpForDeploy] = useState<any>(null)
    const [mcpStatuses, setMcpStatuses] = useState<Record<string, McpStatus>>({})

    // OAuth configuration state
    const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Permission[]>>({})
    const [selectedConnections, setSelectedConnections] = useState<Record<string, string>>({})
    const [authHubName, setAuthHubName] = useState("")
    const [connectionState, setConnectionState] = useState<{
        status: 'idle' | 'connecting' | 'success' | 'error';
        error?: string;
        connectionId?: string;
    }>({ status: 'idle' })

    // Deployment state
    const [deploymentState, setDeploymentState] = useState<{
        status: 'idle' | 'deploying' | 'success' | 'error';
        error?: string;
        deploymentId?: string;
    }>({ status: 'idle' })
    const [policyJson, setPolicyJson] = useState<string>('{\n  "allow": [{}],\n  "deny": []\n}')

    const { isAuthenticated } = useAuth()

    // OAuth mutations
    const createServiceConnection = useCreateServiceConnectionMutation()
    const createSecretSharing = useCreateSecretSharingMutation()
    const createWallet = useCreateWalletMutation()

    // Deployment mutations
    const deployPackage = useDeployPackageMutation()
    const authorizeFrontend = useAuthorizeFrontendMutation()

    const [formData, setFormData] = useState<StepData>({
        name: "",
        prompt: "",
        mcpProviders: [],
        knowledgeBases: [],
    })

    // OAuth configuration queries
    const { data: user } = useQuery(userQueries.meOptions(isAuthenticated))
    const { data: allUserAuth } = useQuery(hubQueries.userAuthOptions(isAuthenticated))
    const { data: authMethods } = useQuery(hubQueries.authMethodsOptions())

    // Get auth scopes for selected MCP (OAuth config)
    const { data: authScopes } = useQuery({
        ...packageQueries.authScopesOptions(selectedMcpForConfig?.packageId || ''),
        enabled: !!selectedMcpForConfig?.packageId
    })

    // Get auth scopes for selected MCP (Deployment)
    const { data: deploymentAuthScopes } = useQuery({
        ...packageQueries.authScopesOptions(selectedMcpForDeploy?.packageId || ''),
        enabled: !!selectedMcpForDeploy?.packageId
    })

    const userAuth = useMemo(() => {
        if (!allUserAuth || !authScopes) return []
        const allowedServices = Object.keys(authScopes?.serviceClientMap || {})
        return allUserAuth.filter((connection: any) =>
            allowedServices.includes(connection.service_clients.name)
        )
    }, [allUserAuth, authScopes])

    // Separate userAuth for deployment based on deploymentAuthScopes
    const deploymentUserAuth = useMemo(() => {
        if (!allUserAuth || !deploymentAuthScopes) return []
        const allowedServices = Object.keys(deploymentAuthScopes?.serviceClientMap || {})
        return allUserAuth.filter((connection: any) =>
            allowedServices.includes(connection.service_clients.name)
        )
    }, [allUserAuth, deploymentAuthScopes])

    // MCP queries - return full objects
    const { data: popularPackages } = useQuery({
        ...packageQueries.popularOptions(),
        select: (data) => data?.data || []
    })

    const { data: mcpSearchResults } = useQuery({
        queryKey: ['packages', 'search', mcpSearchQuery],
        queryFn: async () => {
            if (!mcpSearchQuery || mcpSearchQuery.length < 2) return [];
            const response = await queryClient.ensureQueryData(packageQueries.listOptions({
                name: mcpSearchQuery,
                page: 1,
                limit: 12
            }));
            return response.data || [];
        },
        enabled: mcpSearchQuery.length >= 2,
    })

    // Knowledge base queries - return full objects  
    const { data: popularKnowledgeBases } = useQuery({
        ...knowledgeQueries.basesOptions({ isPublic: true, limit: 10 }),
        select: (data) => data?.data || []
    })

    const { data: kbSearchResults } = useQuery({
        queryKey: ['knowledge-bases', 'search', kbSearchQuery],
        queryFn: async () => {
            if (!kbSearchQuery || kbSearchQuery.length < 2) return [];
            const response = await queryClient.ensureQueryData(knowledgeQueries.searchOptions({
                name: kbSearchQuery,
                isPublic: true,
                page: 1,
                limit: 12
            }));
            return response.data || [];
        },
        enabled: kbSearchQuery.length >= 2,
    })

    const updateFormData = (field: keyof StepData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const addMcpProvider = (provider: any) => {
        const providerId = provider.id || provider.packageId
        if (!formData.mcpProviders.find(p => (p.id || p.packageId) === providerId)) {
            setFormData(prev => ({
                ...prev,
                mcpProviders: [...prev.mcpProviders, provider]
            }))
        }
        setMcpCommandOpen(false)
        setMcpSearchQuery("")
    }

    const removeMcpProvider = (providerId: string) => {
        setFormData(prev => ({
            ...prev,
            mcpProviders: prev.mcpProviders.filter(p => (p.id || p.packageId) !== providerId)
        }))
    }

    const addKnowledgeBase = (knowledgeBase: any) => {
        const kbId = knowledgeBase.knowledgeBaseId || knowledgeBase.knowledge_bases?.knowledgeBaseId
        if (!formData.knowledgeBases.find(kb => (kb.knowledgeBaseId || kb.knowledge_bases?.knowledgeBaseId) === kbId)) {
            setFormData(prev => ({
                ...prev,
                knowledgeBases: [...prev.knowledgeBases, knowledgeBase]
            }))
        }
        setKbCommandOpen(false)
        setKbSearchQuery("")
    }

    const removeKnowledgeBase = (kbId: string) => {
        setFormData(prev => ({
            ...prev,
            knowledgeBases: prev.knowledgeBases.filter(kb => (kb.knowledgeBaseId || kb.knowledge_bases?.knowledgeBaseId) !== kbId)
        }))
    }

    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 1:
                return formData.name.trim().length > 0 && formData.prompt.trim().length > 0
            case 2:
                // Check if at least one MCP has been deployed
                const deployedMcps = formData.mcpProviders.filter(mcp => {
                    const mcpId = mcp.id || mcp.packageId
                    return mcpStatuses[mcpId]?.deploymentStatus === 'deployed'
                })
                return deployedMcps.length > 0
            case 3:
                // Check if at least one MCP has been deployed
                const deployedMcpsStep3 = formData.mcpProviders.filter(mcp => {
                    const mcpId = mcp.id || mcp.packageId
                    return mcpStatuses[mcpId]?.deploymentStatus === 'deployed'
                })
                return deployedMcpsStep3.length > 0
            case '2.1':
            case '2.2':
                return true // Pseudo-steps are always valid
            default:
                return false
        }
    }

    const handleNext = () => {
        if (validateCurrentStep() && typeof currentStep === 'number' && currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => (prev as number) + 1)
        }
    }

    const handlePrevious = () => {
        if (typeof currentStep === 'number' && currentStep > 1) {
            setCurrentStep(prev => (prev as number) - 1)
        } else if (currentStep === '2.1' || currentStep === '2.2') {
            setCurrentStep(2)
        }
    }

    const handleConfigureOAuth = (mcp: any) => {
        setSelectedMcpForConfig(mcp)
        setAuthHubName(`${mcp.name} connection`)
        setCurrentStep('2.1')
    }

    const handleNavigateToDeploy = (mcp: any) => {
        setSelectedMcpForDeploy(mcp)
        setDeploymentState({ status: 'idle' }) // Clear previous deployment status
        setCurrentStep('2.2')
    }

    const handleBackToMcpList = () => {
        setCurrentStep(2)
        setSelectedMcpForConfig(null)
        setSelectedMcpForDeploy(null)
        setConnectionState({ status: 'idle' })
        setDeploymentState({ status: 'idle' }) // Clear deployment status when going back
        setSelectedPermissions({})
        setSelectedConnections({})
    }

    // OAuth configuration functions
    const handlePermissionSelect = useCallback((serviceName: string, permissions: Permission[]) => {
        setSelectedPermissions(prev => ({ ...prev, [serviceName]: permissions }))
    }, [])

    const handleConnectionSelect = (serviceName: string, connectionId: string) => {
        setSelectedConnections(prev => ({
            ...prev,
            [serviceName]: connectionId
        }))
    }

    const handleSaveAuthenticator = async () => {
        if (!selectedMcpForConfig) return

        try {
            setConnectionState({ status: 'connecting' })

            const requiredServices = Object.keys(authScopes?.serviceClientMap || {})
            const serviceName = requiredServices[0] // GitHub is the only service for GitHub MCP

            if (!serviceName) {
                toast.error("No service found for this MCP")
                setConnectionState({ status: 'idle' })
                return
            }

            const serviceClient = authScopes?.serviceClients?.find((sc: any) => sc.name === serviceName)
            if (!serviceClient) {
                toast.error("Service client not found")
                setConnectionState({ status: 'idle' })
                return
            }

            // Create OAuth connection without redirect
            await createServiceConnection.mutateAsync({
                serviceClientName: serviceName,
                scopes: selectedPermissions[serviceName]?.map(permission => permission.id) || [],
                name: authHubName,
                redirectUri: window.location.href,
                preventRedirect: true
            })

            setConnectionState({ status: 'success' })
            toast.success("GitHub OAuth connection created successfully!")

            // Update MCP status
            const mcpId = selectedMcpForConfig.id || selectedMcpForConfig.packageId
            setMcpStatuses(prev => ({
                ...prev,
                [mcpId]: {
                    ...prev[mcpId],
                    oauthStatus: 'configured',
                    oauthData: { serviceName, connectionId: 'connected' }
                }
            }))

            // Auto-close after success
            setTimeout(() => {
                handleBackToMcpList()
            }, 1500)

        } catch (error: any) {
            console.error("OAuth configuration error:", error)
            const errorMessage = error?.message || "Failed to create OAuth connection"
            setConnectionState({ status: 'error', error: errorMessage })
            toast.error(errorMessage)
        }
    }

    // Deployment function
    const handleDeployMcp = async () => {
        if (!selectedMcpForDeploy) return

        try {
            setDeploymentState({ status: 'deploying' })

            const requiredServices = Object.keys(deploymentAuthScopes?.serviceClientMap || {})
            const missingServices = requiredServices.filter(service => !selectedConnections[service])

            if (missingServices.length > 0) {
                toast.error(`Please select connections for: ${missingServices.join(', ')}`)
                return
            }

            // Validate scopes for OAuth services (skip for embedded wallets)
            const servicesWithScopes = requiredServices.filter(service => {
                const mcpRequiredScopes = deploymentAuthScopes?.serviceClientMap?.[service] || []
                const authMethod = authMethods?.find((method: any) => method.name === service)
                // Skip scope validation for embedded wallet services
                if (authMethod?.type === 'embedded_wallet') return false
                return mcpRequiredScopes.length > 0
            })

            const servicesWithoutPermissions = servicesWithScopes.filter(
                service => !selectedPermissions[service] || selectedPermissions[service].length === 0
            )

            if (servicesWithoutPermissions.length > 0) {
                toast.error(`Please select permissions for: ${servicesWithoutPermissions.join(', ')}`)
                return
            }

            // Validate policy JSON if there are embedded wallet services
            const hasEmbeddedWalletServices = requiredServices.some(service => {
                const authMethod = authMethods?.find((method: any) => method.name === service)
                return authMethod?.type === 'embedded_wallet'
            })

            if (hasEmbeddedWalletServices) {
                try {
                    JSON.parse(policyJson)
                } catch {
                    toast.error('Invalid policy JSON format')
                    return
                }
            }

            // Get service connections for deployment (same logic as mcp-deploy-dialog.tsx)
            const serviceConnections = requiredServices
                .filter(service => selectedConnections[service])
                .map(service => {
                    const authMethod = authMethods?.find((method: any) => method.name === service)
                    const isEmbeddedWallet = authMethod?.type === 'embedded_wallet'

                    return {
                        connectionId: selectedConnections[service],
                        ...(isEmbeddedWallet
                            ? { policy: JSON.parse(policyJson) }
                            : { scopes: selectedPermissions[service]?.map(permission => permission.id) || [] }
                        )
                    }
                })

            // Deploy the package
            const deploymentData = await deployPackage.mutateAsync({
                packageId: selectedMcpForDeploy.packageId,
                version: selectedMcpForDeploy.latestVersion,
                url: `${selectedMcpForDeploy.url?.replace(/\/$/, '')}/mcp`,
                authData: {},
                serviceConnections: serviceConnections,
            })

            const deploymentId = deploymentData.deployment.deploymentId

            // Authorize the deployment
            const mcpRedirectUri = new URL(selectedMcpForDeploy.url as string)
            mcpRedirectUri.pathname = mcpRedirectUri.pathname.replace(/\/$/, '') + '/osiris/callback'

            // Flatten scopes for authorization (same logic as mcp-deploy-dialog.tsx)
            const allScopes = serviceConnections.flatMap(sc => 'scopes' in sc ? sc.scopes : [])

            const authData = await authorizeFrontend.mutateAsync({
                clientId: selectedMcpForDeploy.clientId ?? "",
                redirectUri: mcpRedirectUri.toString(),
                responseType: 'code',
                scopes: [...allScopes, "osiris:auth:read", "osiris:auth:action"],
                state: deploymentId || '',
                deploymentId: deploymentId,
            })

            const url = new URL(authData.url)
            const res = await fetch(url.toString())
            if (res.status !== 200) {
                throw new Error('Failed to authorize')
            }

            setDeploymentState({ status: 'success', deploymentId })
            toast.success(`${selectedMcpForDeploy.name} deployed successfully!`)

            // Update MCP status
            const mcpId = selectedMcpForDeploy.id || selectedMcpForDeploy.packageId
            setMcpStatuses(prev => ({
                ...prev,
                [mcpId]: {
                    ...prev[mcpId],
                    deploymentStatus: 'deployed',
                    deploymentData: { deploymentId }
                }
            }))

            // Auto-close after success
            setTimeout(() => {
                handleBackToMcpList()
            }, 1500)

        } catch (error: any) {
            setDeploymentState({
                status: 'error',
                error: error?.message || 'Deployment failed'
            })
            toast.error(error?.message || 'Deployment failed')
        }
    }

    // Deployment form validation (same logic as mcp-deploy-dialog.tsx)
    const isDeploymentFormValid = () => {
        if (!deploymentAuthScopes) return false

        const requiredServices = Object.keys(deploymentAuthScopes?.serviceClientMap || {})

        // Check if all required services have connections
        const hasAllConnections = requiredServices.every(service => selectedConnections[service])
        if (!hasAllConnections) return false

        // Check if OAuth services have permissions selected
        const servicesWithScopes = requiredServices.filter(service => {
            const mcpRequiredScopes = deploymentAuthScopes?.serviceClientMap?.[service] || []
            const authMethod = authMethods?.find((method: any) => method.name === service)
            // Skip scope validation for embedded wallet services
            if (authMethod?.type === 'embedded_wallet') return false
            return mcpRequiredScopes.length > 0
        })

        const hasAllPermissions = servicesWithScopes.every(service =>
            selectedPermissions[service]?.length > 0
        )

        return hasAllConnections && hasAllPermissions
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim() || !formData.prompt.trim()) return

        // Collect deployment IDs from deployed MCPs
        const deploymentIds = formData.mcpProviders
            .map(mcp => {
                const mcpId = mcp.id || mcp.packageId
                const status = mcpStatuses[mcpId]
                return status?.deploymentStatus === 'deployed' ? status.deploymentData?.deploymentId : null
            })
            .filter(Boolean) // Remove null values

        // Ensure at least one MCP has been deployed
        if (deploymentIds.length === 0) {
            toast.error('Please deploy at least one MCP before creating the step')
            return
        }

        onAddStep({
            name: formData.name.trim(),
            mcpProvider: formData.mcpProviders[0]?.name || "", // For compatibility, use first selected  
            prompt: formData.prompt.trim(),
            // Pass the full objects for future use
            mcpProviders: formData.mcpProviders,
            knowledgeBases: formData.knowledgeBases,
            // Pass deployment IDs for API
            deploymentIds: deploymentIds,
        })

        // Reset form
        resetForm()
        onOpenChange(false)
    }

    const resetForm = () => {
        setCurrentStep(1)
        setMcpCommandOpen(false)
        setKbCommandOpen(false)
        setMcpSearchQuery("")
        setKbSearchQuery("")
        setSelectedMcpForConfig(null)
        setSelectedMcpForDeploy(null)
        setMcpStatuses({})
        setSelectedPermissions({})
        setSelectedConnections({})
        setAuthHubName("")
        setConnectionState({ status: 'idle' })
        setDeploymentState({ status: 'idle' })
        setPolicyJson('{\n  "allow": [{}],\n  "deny": []\n}')
        setFormData({
            name: "",
            prompt: "",
            mcpProviders: [],
            knowledgeBases: [],
        })
    }

    const handleCancel = () => {
        resetForm()
        onOpenChange(false)
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="step-name" className="text-sm text-primary-400">Step Name</Label>
                            <Input
                                id="step-name"
                                placeholder="Enter step name..."
                                value={formData.name}
                                onChange={(e) => updateFormData('name', e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt" className="text-sm text-primary-400">Prompt</Label>
                            <Textarea
                                id="prompt"
                                placeholder="Enter your prompt..."
                                className="placeholder:text-primary-300"
                                value={formData.prompt}
                                onChange={(e) => updateFormData('prompt', e.target.value)}
                                rows={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm text-primary-400">MCP Providers</Label>
                            <Popover open={mcpCommandOpen} onOpenChange={setMcpCommandOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={mcpCommandOpen}
                                        className="justify-between w-full"
                                    >
                                        Select MCP providers...
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search MCP providers..."
                                            value={mcpSearchQuery}
                                            onValueChange={setMcpSearchQuery}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No providers found.</CommandEmpty>
                                            {(mcpSearchQuery.length >= 2 ? mcpSearchResults : popularPackages)?.length > 0 && (
                                                <CommandGroup heading={mcpSearchQuery.length >= 2 ? "Search Results" : "Popular Providers"}>
                                                    {(mcpSearchQuery.length >= 2 ? mcpSearchResults : popularPackages)?.map((provider: any) => (
                                                        <CommandItem
                                                            key={provider.id || provider.packageId}
                                                            onSelect={() => addMcpProvider(provider)}
                                                            className="cursor-pointer"
                                                        >
                                                            {provider.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {/* Selected providers badges */}
                            {formData.mcpProviders.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.mcpProviders.map((provider) => (
                                        <Badge key={provider.id || provider.packageId} variant="secondary" className="flex items-center gap-1">
                                            {provider.name}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => removeMcpProvider(provider.id || provider.packageId)}
                                            >
                                                <X size={12} />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm text-primary-400">Knowledge Bases</Label>
                            <Popover open={kbCommandOpen} onOpenChange={setKbCommandOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={kbCommandOpen}
                                        className="justify-between w-full"
                                    >
                                        Select knowledge bases...
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search knowledge bases..."
                                            value={kbSearchQuery}
                                            onValueChange={setKbSearchQuery}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No knowledge bases found.</CommandEmpty>
                                            {(kbSearchQuery.length >= 2 ? kbSearchResults : popularKnowledgeBases)?.length > 0 && (
                                                <CommandGroup heading={kbSearchQuery.length >= 2 ? "Search Results" : "Popular Knowledge Bases"}>
                                                    {(kbSearchQuery.length >= 2 ? kbSearchResults : popularKnowledgeBases)?.map((kb: any) => {
                                                        const kbData = kb.knowledge_bases || kb
                                                        const kbId = kbData.knowledgeBaseId
                                                        const kbName = kbData.name
                                                        return (
                                                            <CommandItem
                                                                key={kbId}
                                                                onSelect={() => addKnowledgeBase(kb)}
                                                                className="cursor-pointer"
                                                            >
                                                                {kbName}
                                                            </CommandItem>
                                                        )
                                                    })}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {/* Selected knowledge bases badges */}
                            {formData.knowledgeBases.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.knowledgeBases.map((kb) => {
                                        const kbData = kb.knowledge_bases || kb
                                        const kbId = kbData.knowledgeBaseId
                                        const kbName = kbData.name
                                        return (
                                            <Badge key={kbId} variant="secondary" className="flex items-center gap-1">
                                                {kbName}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                                    onClick={() => removeKnowledgeBase(kbId)}
                                                >
                                                    <X size={12} />
                                                </Button>
                                            </Badge>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                    </div>
                )
            case 2:
                return (
                    <div className="space-y-6">
                        {/* MCP Deployment Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-primary-400">MCP Providers</h3>
                            {formData.mcpProviders.length > 0 ? (
                                <div className="space-y-3">
                                    {formData.mcpProviders.map((mcp) => {
                                        const mcpId = mcp.id || mcp.packageId
                                        const status = mcpStatuses[mcpId] || { oauthStatus: 'not_configured', deploymentStatus: 'not_deployed' }

                                        return (
                                            <div key={mcpId} className="p-4 w-full border rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center">
                                                            <span className="text-xs font-medium">{mcp.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-sm">{mcp.name}</h4>
                                                            <div className="flex gap-2 mt-1">
                                                                {/* <Badge
                                                                    variant={status.oauthStatus === 'configured' ? 'default' : 'secondary'}
                                                                    className="text-xs"
                                                                >
                                                                    OAuth: {status.oauthStatus}
                                                                </Badge> */}
                                                                <Badge
                                                                    variant={status.deploymentStatus === 'deployed' ? 'default' : 'secondary'}
                                                                    className="text-xs"
                                                                >
                                                                    Status: {status.deploymentStatus}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="xs"
                                                            variant="outline"
                                                            onClick={() => handleConfigureOAuth(mcp)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Settings size={12} />
                                                            Configure
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="outline"
                                                            onClick={() => handleNavigateToDeploy(mcp)}
                                                            disabled={mcpStatuses[mcpId]?.deploymentStatus === 'deployed'}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Rocket size={12} />
                                                            {mcpStatuses[mcpId]?.deploymentStatus === 'deployed' ? 'Deployed' : 'Deploy'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-primary-300">No MCP providers selected</p>
                            )}
                        </div>

                        {/* Knowledge Bases Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-primary-400">Knowledge Bases</h3>
                            {formData.knowledgeBases.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {formData.knowledgeBases.map((kb) => {
                                        const kbData = kb.knowledge_bases || kb
                                        const kbId = kbData.knowledgeBaseId
                                        const kbName = kbData.name
                                        return (
                                            <Badge key={kbId} variant="secondary" className="text-xs">
                                                {kbName.length > 20 ? `${kbName.substring(0, 20)}...` : kbName}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-primary-300">No knowledge bases selected</p>
                            )}
                        </div>

                        {/* Validation Message */}
                        {(() => {
                            const deployedMcps = formData.mcpProviders.filter(mcp => {
                                const mcpId = mcp.id || mcp.packageId
                                return mcpStatuses[mcpId]?.deploymentStatus === 'deployed'
                            })

                            if (deployedMcps.length === 0) {
                                return (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            <strong>⚠️ Deploy at least one MCP</strong> to proceed to the next step.
                                        </p>
                                    </div>
                                )
                            }
                            return null
                        })()}
                    </div>
                )
            case '2.1':
                return (
                    <div>
                        {/* Header */}
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Configure OAuth for {selectedMcpForConfig?.name}</h3>
                            <p className="text-sm text-primary-300">Set up OAuth connections and permissions</p>
                        </div>

                        {/* User and Service Avatars */}
                        <div className="flex items-center justify-center gap-4">
                            <Avatar className="size-10">
                                <AvatarImage src={user?.profileImageUrl} alt={user?.name || 'User'} />
                                <AvatarFallback className="rounded-sm">
                                    {user ? getInitials(user.name) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <Avatar className="size-10">
                                <AvatarImage src={selectedMcpForConfig?.iconUrl} alt={selectedMcpForConfig?.name} />
                                <AvatarFallback className="rounded-sm">
                                    {selectedMcpForConfig?.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Connection Name */}
                        <div className="space-y-2">
                            <Label htmlFor="auth_hub_name" className="text-sm font-medium">Connection Name</Label>
                            <Input
                                id="auth_hub_name"
                                type="text"
                                value={authHubName}
                                onChange={(e) => setAuthHubName(e.target.value)}
                                placeholder={`${selectedMcpForConfig?.name} connection`}
                                disabled={connectionState.status === 'connecting'}
                            />
                        </div>

                        {/* OAuth Configuration - ScrollArea for dropdown expansion */}
                        <ScrollArea className="max-h-[400px]">
                            <div className="pr-4">
                                {authScopes?.serviceClients?.map((serviceClient: any) => {
                                    const serviceName = serviceClient.name
                                    const requiredScopes = authScopes?.serviceClientMap?.[serviceName] || []
                                    const serviceConnections = userAuth.filter((c: any) => c.service_clients.name === serviceName)

                                    // Transform scope definitions without hooks
                                    const permissions = serviceClient.scopeDefinitions ?
                                        Object.entries(transformScopeDefinitions(serviceClient.name, serviceClient.scopeDefinitions)).map(([scope, label]) => ({
                                            id: scope,
                                            label: getScopeDisplayName(scope) || String(label)
                                        })) : []

                                    const handleServicePermissionSelect = (perms: Permission[]) => handlePermissionSelect(serviceName, perms)
                                    const initialSelected = selectedPermissions[serviceName] || []

                                    return (
                                        <Accordion key={serviceName} type="single" collapsible className="border border-primary-100 rounded-[6px]">
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
                                                            <p className="text-[13px] text-primary-300">Select permissions to grant</p>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4 pb-4">
                                                    {/* Permissions */}
                                                    {permissions.length > 0 && (
                                                        <div className="mb-6">
                                                            <p className="text-sm font-medium text-primary-800 mb-3">Select permissions to grant:</p>
                                                            <PermissionSelector
                                                                context="deploy-dialog"
                                                                key={`deploy-${serviceName}`}
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
                                                                {serviceConnections.map((connection: any) => {
                                                                    const radioId = `radio-${connection.user_service_connections.id}`
                                                                    return (
                                                                        <div key={connection.user_service_connections.id} className="flex items-start space-x-3">
                                                                            <RadioGroupItem
                                                                                id={radioId}
                                                                                value={connection.user_service_connections.id}
                                                                                className="mt-1"
                                                                            />
                                                                            <label
                                                                                htmlFor={radioId}
                                                                                className="flex-1 p-3 border border-primary-100 rounded-[6px] hover:border-primary-200 transition-colors cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <div className="flex items-center space-x-2">
                                                                                        <p className="text-sm font-medium text-primary-800">
                                                                                            {connection.user_service_connections.metadata?.user?.name ||
                                                                                                connection.user_service_connections.metadata?.user?.email ||
                                                                                                connection.user_service_connections.name || 'Unknown User'}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <p className="text-[13px] text-primary-400 mb-2">
                                                                                    {connection.user_service_connections.metadata?.user?.email ||
                                                                                        connection.user_service_connections.metadata?.user?.name || 'No email available'}
                                                                                </p>
                                                                                <div className="flex flex-wrap gap-1">
                                                                                    {connection.user_service_connections.scopes?.map((scope: string) => (
                                                                                        <Badge key={scope} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                                                                                            {getScopeDisplayName(scope)}
                                                                                        </Badge>
                                                                                    ))}
                                                                                </div>
                                                                            </label>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </RadioGroup>
                                                        </div>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    )
                                })}
                            </div>
                        </ScrollArea>

                        {/* Status Messages */}
                        {connectionState.status === 'success' && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="size-4 text-green-600" />
                                    <p className="text-sm text-green-700">OAuth connection created successfully!</p>
                                </div>
                            </div>
                        )}

                        {connectionState.status === 'error' && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="size-4 text-red-600" />
                                    <p className="text-sm text-red-700">{connectionState.error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )

            case '2.2':
                return (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Deploy {selectedMcpForDeploy?.name}</h3>
                            <p className="text-sm text-primary-300">Configure deployment settings and policies</p>
                        </div>

                        {/* MCP Info */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="flex flex-col items-center gap-2">
                                <Avatar className="size-10">
                                    <AvatarImage src={selectedMcpForDeploy?.iconUrl} alt={selectedMcpForDeploy?.name} />
                                    <AvatarFallback className="rounded-sm">
                                        {selectedMcpForDeploy?.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-primary-400">{selectedMcpForDeploy?.name}</span>
                            </div>
                        </div>

                        {/* Service Connections - ScrollArea for long content */}
                        <ScrollArea className="max-h-[400px]">
                            <div className="pr-4 space-y-4">
                                {deploymentAuthScopes?.serviceClients?.map((serviceClient: any) => {
                                    const serviceName = serviceClient.name
                                    const serviceConnections = deploymentUserAuth.filter((c: any) => c.service_clients.name === serviceName)
                                    const authMethod = authMethods?.find((method: any) => method.name === serviceName)
                                    const isEmbeddedWallet = authMethod?.type === 'embedded_wallet'
                                    const requiredScopes = deploymentAuthScopes?.serviceClientMap?.[serviceName] || []

                                    // Transform scope definitions for permission selector
                                    const permissions = serviceClient.scopeDefinitions ?
                                        Object.entries(transformScopeDefinitions(serviceClient.name, serviceClient.scopeDefinitions)).map(([scope, label]) => ({
                                            id: scope,
                                            label: getScopeDisplayName(scope) || String(label)
                                        })) : []

                                    return (
                                        <div key={serviceName} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-8 rounded-sm">
                                                    <AvatarImage src={serviceClient.iconUrl} alt={serviceName} />
                                                    <AvatarFallback className="bg-purple-300 text-white font-bold text-sm capitalize rounded-sm">
                                                        {serviceName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-medium text-primary-800 capitalize">{serviceName} Account</h4>
                                                    <p className="text-sm text-primary-300">Select connection and permissions for deployment</p>
                                                </div>
                                            </div>

                                            {/* Permission Selection for OAuth services */}
                                            {!isEmbeddedWallet && permissions.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-primary-400">Select permissions to grant:</Label>
                                                    <PermissionSelector
                                                        context="deploy-dialog"
                                                        key={`deploy-${serviceName}`}
                                                        permissions={permissions}
                                                        placeholder={`Search ${serviceName} permissions...`}
                                                        onSelectionChange={(perms) => handlePermissionSelect(serviceName, perms)}
                                                        initialSelected={selectedPermissions[serviceName] || []}
                                                    />
                                                </div>
                                            )}

                                            {/* Connection Selection */}
                                            {serviceConnections.length > 0 ? (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-primary-400">Your connected accounts:</Label>
                                                    <RadioGroup
                                                        value={selectedConnections[serviceName] || ''}
                                                        onValueChange={(value) => handleConnectionSelect(serviceName, value)}
                                                        className="space-y-3"
                                                    >
                                                        {serviceConnections.map((connection: any) => {
                                                            const radioId = `deploy-radio-${connection.user_service_connections.id}`
                                                            return (
                                                                <div key={connection.user_service_connections.id} className="flex items-start space-x-3">
                                                                    <RadioGroupItem
                                                                        id={radioId}
                                                                        value={connection.user_service_connections.id}
                                                                        className="mt-1"
                                                                    />
                                                                    <label
                                                                        htmlFor={radioId}
                                                                        className="flex-1 p-3 border border-primary-100 rounded-sm hover:border-primary-200 transition-colors cursor-pointer"
                                                                    >
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <div className="flex items-center space-x-2">
                                                                                <p className="text-sm font-medium text-primary-800">
                                                                                    {connection.user_service_connections.metadata?.user?.name ||
                                                                                        connection.user_service_connections.metadata?.user?.email ||
                                                                                        connection.user_service_connections.name || 'Unknown User'}
                                                                                </p>
                                                                            </div>
                                                                            {/* Ready Indicator */}
                                                                            {(() => {
                                                                                const connectionScopes = connection.user_service_connections.scopes || [];
                                                                                const requiredScopesArray = Array.isArray(requiredScopes) ? requiredScopes : [];

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
                                                                        <p className="text-xs text-primary-400 mb-2">
                                                                            {connection.user_service_connections.metadata?.user?.email ||
                                                                                connection.user_service_connections.metadata?.user?.name || 'No email available'}
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {connection.user_service_connections.scopes?.map((scope: string) => (
                                                                                <Badge key={scope} className="rounded-sm bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                                                                                    {getScopeDisplayName(scope)}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                            )
                                                        })}
                                                    </RadioGroup>
                                                </div>
                                            ) : (
                                                <div className="p-3 border border-primary-100 rounded-sm bg-primary-50">
                                                    <p className="text-sm text-primary-400">No {serviceName} connections available. Please configure OAuth first.</p>
                                                </div>
                                            )}

                                            {/* Policy Builder for Embedded Wallets */}
                                            {isEmbeddedWallet && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-primary-400">Deployment Policy</Label>
                                                    <PolicyBuilder
                                                        value={policyJson}
                                                        onChange={setPolicyJson}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>

                        {/* Deployment Status */}
                        {/* {deploymentState.status !== 'idle' && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 ${deploymentState.status === 'success' ? 'bg-green-50 text-green-700' :
                                deploymentState.status === 'error' ? 'bg-red-50 text-red-700' :
                                    'bg-blue-50 text-blue-700'
                                }`}>
                                {deploymentState.status === 'success' && <CheckCircle className="h-4 w-4" />}
                                {deploymentState.status === 'error' && <AlertCircle className="h-4 w-4" />}
                                {deploymentState.status === 'deploying' && <Loader2 className="h-4 w-4 animate-spin" />}
                                <span className="text-sm">
                                    {deploymentState.status === 'success' && 'MCP deployed successfully!'}
                                    {deploymentState.status === 'error' && deploymentState.error}
                                    {deploymentState.status === 'deploying' && 'Deploying MCP...'}
                                </span>
                            </div>
                        )} */}
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-6">
                        {/* Confirmation Header */}
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Ready to Create Step</h3>
                            <p className="text-sm text-primary-300">Review your step configuration before creating</p>
                        </div>

                        {/* Step Summary */}
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg bg-primary-50">
                                <h4 className="font-medium text-primary-800 mb-2">Step Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-primary-400">Name:</span>
                                        <span className="ml-2 text-primary-800">{formData.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-primary-400">Prompt:</span>
                                        <span className="ml-2 text-primary-800">{formData.prompt}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deployed MCPs Summary */}
                            <div className="p-4 border rounded-lg bg-green-50">
                                <h4 className="font-medium text-green-800 mb-2">Deployed MCPs</h4>
                                <div className="space-y-2">
                                    {formData.mcpProviders.map((mcp) => {
                                        const mcpId = mcp.id || mcp.packageId
                                        const status = mcpStatuses[mcpId]
                                        const isDeployed = status?.deploymentStatus === 'deployed'

                                        return (
                                            <div key={mcpId} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-primary-100 flex items-center justify-center">
                                                        <span className="text-xs font-medium">{mcp.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    <span className="text-primary-800">{mcp.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isDeployed ? (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            <span className="text-green-700 font-medium">Deployed</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                            <span className="text-yellow-700 font-medium">Not Deployed</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Knowledge Bases Summary */}
                            {formData.knowledgeBases.length > 0 && (
                                <div className="p-4 border rounded-lg bg-blue-50">
                                    <h4 className="font-medium text-blue-800 mb-2">Knowledge Bases</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.knowledgeBases.map((kb) => {
                                            const kbData = kb.knowledge_bases || kb
                                            const kbName = kbData.name
                                            return (
                                                <Badge key={kbData.knowledgeBaseId} variant="secondary" className="text-xs">
                                                    {kbName.length > 20 ? `${kbName.substring(0, 20)}...` : kbName}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-4 max-w-md max-h-[90vh] overflow-hidden">
                <DialogHeader className="space-y-4">
                    <DialogTitle className="text-primary-400 font-normal text-sm">Add step</DialogTitle>
                </DialogHeader>

                {/* Context indicator */}
                <div className="py-4 w-full flex flex-col items-center gap-2">
                    {prevStepName && (
                        <div className="text-sm text-primary-800 mb-2">
                            {prevStepName}
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-[#2DCA04] font-medium bg-[#2DCA041A]/90 px-3 py-2 rounded-lg">
                        <PencilLine size={14} />
                        Currently editing
                    </div>

                    {nextStepName && (
                        <div className="text-sm text-primary-800 mt-2">
                            {nextStepName}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-6">
                    <div className="flex-1 overflow-y-auto">
                        {renderStepContent()}
                    </div>

                    <div className="flex gap-3 pt-4 flex-shrink-0">
                        {(typeof currentStep === 'number' && currentStep > 1) || currentStep === '2.1' || currentStep === '2.2' ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrevious}
                                className="flex items-center gap-2"
                            >
                                <ChevronLeft size={16} />
                                {currentStep === '2.1' || currentStep === '2.2' ? 'Back to MCP List' : 'Previous'}
                            </Button>
                        ) : null}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="ml-auto"
                        >
                            Cancel
                        </Button>

                        {/* OAuth Configuration Action Button */}
                        {currentStep === '2.1' ? (
                            <Button
                                type="button"
                                onClick={handleSaveAuthenticator}
                                disabled={connectionState.status === 'connecting' || !authHubName.trim()}
                                className="flex items-center gap-2 bg-primary-800 hover:bg-primary-900 text-white"
                            >
                                {connectionState.status === 'connecting' ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Settings size={16} />
                                        Save OAuth Connection
                                    </>
                                )}
                            </Button>
                        ) : currentStep === '2.2' ? (
                            <Button
                                type="button"
                                onClick={handleDeployMcp}
                                disabled={deploymentState.status === 'deploying' || !isDeploymentFormValid()}
                                className="flex items-center gap-2 bg-primary-800 hover:bg-primary-900 text-white"
                            >
                                {deploymentState.status === 'deploying' ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Deploying...
                                    </>
                                ) : (
                                    <>
                                        <Rocket size={16} />
                                        Deploy MCP
                                    </>
                                )}
                            </Button>
                        ) : typeof currentStep === 'number' && currentStep < TOTAL_STEPS ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={!validateCurrentStep()}
                                className="flex items-center gap-2 bg-primary-800 hover:bg-primary-900 text-white"
                            >
                                Next
                                <ChevronRight size={16} />
                            </Button>
                        ) : typeof currentStep === 'number' && currentStep === TOTAL_STEPS ? (
                            <Button
                                type="submit"
                                disabled={!validateCurrentStep()}
                                className="bg-primary-800 hover:bg-primary-900 text-white"
                            >
                                Create Step
                            </Button>
                        ) : null}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

