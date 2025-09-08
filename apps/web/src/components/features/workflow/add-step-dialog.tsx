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
import { useCreateServiceConnectionMutation, useCreateSecretSharingMutation, useCreateWalletMutation } from "@/lib/mutations"
import { useAuth } from "@/hooks/use-auth"
import { getInitials } from "@/lib/utils"
import { getReadableScopes, transformScopeDefinitions } from "@/lib/scope-utils"
import { getScopeDisplayName } from "@/lib/scope-definitions"
import { type WorkflowStep } from "./workflow-step-item"
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

    const { isAuthenticated } = useAuth()

    // OAuth mutations
    const createServiceConnection = useCreateServiceConnectionMutation()
    const createSecretSharing = useCreateSecretSharingMutation()
    const createWallet = useCreateWalletMutation()

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

    // Get auth scopes for selected MCP
    const { data: authScopes } = useQuery({
        ...packageQueries.authScopesOptions(selectedMcpForConfig?.packageId || ''),
        enabled: !!selectedMcpForConfig?.packageId
    })

    const userAuth = useMemo(() => {
        if (!allUserAuth || !authScopes) return []
        const allowedServices = Object.keys(authScopes?.serviceClientMap || {})
        return allUserAuth.filter((connection: any) =>
            allowedServices.includes(connection.service_clients.name)
        )
    }, [allUserAuth, authScopes])

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
                return true // Deployment step can be empty for now
            case 3:
                return true // Step 3 is now empty, always valid
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

    const handleDeployMcp = (mcp: any) => {
        setSelectedMcpForDeploy(mcp)
        setCurrentStep('2.2')
    }

    const handleBackToMcpList = () => {
        setCurrentStep(2)
        setSelectedMcpForConfig(null)
        setSelectedMcpForDeploy(null)
        setConnectionState({ status: 'idle' })
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim() || !formData.prompt.trim()) return

        onAddStep({
            name: formData.name.trim(),
            mcpProvider: formData.mcpProviders[0]?.name || "", // For compatibility, use first selected  
            prompt: formData.prompt.trim(),
            // Pass the full objects for future use
            mcpProviders: formData.mcpProviders,
            knowledgeBases: formData.knowledgeBases,
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
                                                            onClick={() => handleDeployMcp(mcp)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Rocket size={12} />
                                                            Deploy
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
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Deploy {selectedMcpForDeploy?.name}</h3>
                            <p className="text-sm text-primary-300">Configure deployment settings and policies</p>
                        </div>

                        <div className="p-4 border rounded-lg bg-primary-50">
                            <p className="text-sm text-primary-400">
                                MCP deployment components will be integrated here.
                                This will include policy builders and deployment configuration.
                            </p>
                        </div>
                    </div>
                )

            case 3:
                return (
                    <></>
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
                                disabled={!formData.name.trim() || !formData.prompt.trim()}
                                className="bg-primary-800 hover:bg-primary-900 text-white"
                            >
                                Add step
                            </Button>
                        ) : null}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
