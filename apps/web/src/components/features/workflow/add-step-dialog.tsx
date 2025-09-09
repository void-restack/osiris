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
import { PencilLine, ChevronLeft, ChevronRight, X, Settings, Rocket, Loader2 } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { packageQueries, knowledgeQueries, hubQueries, userQueries } from "@/lib/queries"
import { useCreateServiceConnectionMutation, useCreateSecretSharingMutation, useCreateWalletMutation, useDeployPackageMutation, useAuthorizeFrontendMutation } from "@/lib/mutations"
import { useAuth } from "@/hooks/use-auth"
import { getInitials } from "@/lib/utils"
import { transformScopeDefinitions } from "@/lib/scope-utils"
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
    mcpProviders: Array<any>
    knowledgeBases: Array<any>
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

    const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Permission[]>>({})
    const [selectedConnections, setSelectedConnections] = useState<Record<string, string>>({})
    const [authHubName, setAuthHubName] = useState("")
    const [connectionState, setConnectionState] = useState<{
        status: 'idle' | 'connecting' | 'success' | 'error';
        error?: string;
        connectionId?: string;
    }>({ status: 'idle' })

    const [deploymentState, setDeploymentState] = useState<{
        status: 'idle' | 'deploying' | 'success' | 'error';
        error?: string;
        deploymentId?: string;
    }>({ status: 'idle' })
    const [policyJson, setPolicyJson] = useState<string>('{\n  "allow": [{}],\n  "deny": []\n}')

    // Secret sharing and wallet state (matching auth-method-dialog.tsx)
    const [secretData, setSecretData] = useState<Record<string, any>>({})
    const [walletData, setWalletData] = useState<{
        accounts: Array<{
            chains: string[];
            pathFormat: string;
            path: string;
            curve: string;
            addressFormat: string;
        }>;
    }>({
        accounts: [
            {
                chains: ['evm:eip155:1'],
                pathFormat: '',
                path: '',
                curve: '',
                addressFormat: ''
            }
        ]
    })

    const { isAuthenticated } = useAuth()

    const createServiceConnection = useCreateServiceConnectionMutation()
    const createSecretSharing = useCreateSecretSharingMutation()
    const createWallet = useCreateWalletMutation()

    const getDefaultValuesForChain = (chainValue: string) => {
        if (chainValue.startsWith('evm:')) {
            return {
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/60'/0'/0/0",
                curve: 'CURVE_SECP256K1',
                addressFormat: 'ADDRESS_FORMAT_ETHEREUM'
            }
        } else if (chainValue.startsWith('solana:')) {
            return {
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/501'/0'/0'",
                curve: 'CURVE_ED25519',
                addressFormat: 'ADDRESS_FORMAT_SOLANA'
            }
        }
        return {
            pathFormat: '',
            path: '',
            curve: '',
            addressFormat: ''
        }
    }

    const deployPackage = useDeployPackageMutation()
    const authorizeFrontend = useAuthorizeFrontendMutation()

    const [formData, setFormData] = useState<StepData>({
        name: "",
        prompt: "",
        mcpProviders: [],
        knowledgeBases: [],
    })

    const { data: user } = useQuery(userQueries.meOptions(isAuthenticated))
    const { data: allUserAuth } = useQuery(hubQueries.userAuthOptions(isAuthenticated))
    const { data: authMethods } = useQuery(hubQueries.authMethodsOptions())

    const { data: authScopes } = useQuery({
        ...packageQueries.authScopesOptions(selectedMcpForConfig?.packageId || selectedMcpForConfig?.id || ''),
        enabled: !!(selectedMcpForConfig?.packageId || selectedMcpForConfig?.id) && currentStep === '2.1'
    })

    const { data: deploymentAuthScopes } = useQuery({
        ...packageQueries.authScopesOptions(selectedMcpForDeploy?.packageId || selectedMcpForDeploy?.id || ''),
        enabled: !!(selectedMcpForDeploy?.packageId || selectedMcpForDeploy?.id) && currentStep === '2.2'
    })

    const userAuth = useMemo(() => {
        if (!allUserAuth || !authScopes) return []
        const allowedServices = Object.keys(authScopes?.serviceClientMap || {})
        return allUserAuth.filter((connection: any) =>
            allowedServices.includes(connection.service_clients.name)
        )
    }, [allUserAuth, authScopes])

    const deploymentUserAuth = useMemo(() => {
        if (!allUserAuth || !deploymentAuthScopes) return []
        const allowedServices = Object.keys(deploymentAuthScopes?.serviceClientMap || {})
        return allUserAuth.filter((connection: any) =>
            allowedServices.includes(connection.service_clients.name)
        )
    }, [allUserAuth, deploymentAuthScopes])

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
                if (formData.mcpProviders.length === 0) return true
                const deployedMcps = formData.mcpProviders.filter(mcp => {
                    const mcpId = mcp.id || mcp.packageId
                    return mcpStatuses[mcpId]?.deploymentStatus === 'deployed'
                })
                return deployedMcps.length > 0
            case 3:
                if (formData.mcpProviders.length === 0) return true
                const deployedMcpsStep3 = formData.mcpProviders.filter(mcp => {
                    const mcpId = mcp.id || mcp.packageId
                    return mcpStatuses[mcpId]?.deploymentStatus === 'deployed'
                })
                return deployedMcpsStep3.length > 0
            case '2.1':
            case '2.2':
                return true
            default:
                return false
        }
    }

    const handleNext = () => {
        if (validateCurrentStep() && typeof currentStep === 'number' && currentStep < TOTAL_STEPS) {
            if (currentStep === 1 && formData.mcpProviders.length === 0) {
                setCurrentStep(3)
            } else {
                setCurrentStep(prev => (prev as number) + 1)
            }
        }
    }

    const handlePrevious = () => {
        if (typeof currentStep === 'number' && currentStep > 1) {
            if (currentStep === 3 && formData.mcpProviders.length === 0) {
                setCurrentStep(1)
            } else {
                setCurrentStep(prev => (prev as number) - 1)
            }
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
        setDeploymentState({ status: 'idle' })
        setCurrentStep('2.2')
    }

    const handleBackToMcpList = () => {
        setCurrentStep(2)
        setSelectedMcpForConfig(null)
        setSelectedMcpForDeploy(null)
        setConnectionState({ status: 'idle' })
        setDeploymentState({ status: 'idle' })
        setSelectedPermissions({})
        setSelectedConnections({})
    }

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
            const serviceName = requiredServices[0]

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

            let connectionId: string

            switch (serviceClient.type) {
                case 'oauth':
                    await createServiceConnection.mutateAsync({
                        serviceClientName: serviceName,
                        scopes: selectedPermissions[serviceName]?.map(permission => permission.id) || [],
                        name: authHubName,
                        redirectUri: window.location.href,
                        preventRedirect: true
                    })
                    connectionId = 'connected'
                    toast.success(`${serviceName} OAuth connection created successfully!`)
                    break

                case 'secret_sharing':
                    const metadata = serviceClient.metadata
                    if (metadata?.required) {
                        for (const field of metadata.required) {
                            if (!secretData[field]) {
                                toast.error(`${metadata.properties?.[field]?.title || field} is required`)
                                setConnectionState({ status: 'idle' })
                                return
                            }
                        }
                    }
                    const secretResult = await createSecretSharing.mutateAsync({
                        serviceClientId: serviceClient.clientId,
                        name: authHubName,
                        secret: secretData
                    })
                    connectionId = secretResult?.[0]?.id || 'created'
                    toast.success(`${serviceName} connection created successfully!`)
                    break

                case 'embedded_wallet':
                    if (!authHubName.trim()) {
                        toast.error("Authentication Hub Name is required")
                        setConnectionState({ status: 'idle' })
                        return
                    }
                    if (!walletData.accounts[0]?.chains[0] || walletData.accounts[0].chains[0].trim() === '') {
                        toast.error("At least one blockchain chain is required")
                        setConnectionState({ status: 'idle' })
                        return
                    }

                    const processedAccounts = walletData.accounts
                        .filter(account => account.chains.some(chain => chain.trim() !== ''))
                        .map(account => {
                            const firstChain = account.chains.find(chain => chain.trim() !== '')
                            const defaults = getDefaultValuesForChain(firstChain || '')

                            return {
                                ...account,
                                pathFormat: account.pathFormat || defaults.pathFormat,
                                path: account.path || defaults.path,
                                curve: account.curve || defaults.curve,
                                addressFormat: account.addressFormat || defaults.addressFormat
                            }
                        })

                    const walletResult = await createWallet.mutateAsync({
                        name: authHubName,
                        accounts: processedAccounts
                    })
                    connectionId = walletResult?.[0]?.id || 'created'
                    toast.success(`${serviceName} wallet created successfully!`)
                    break

                default:
                    toast.error("Unknown authentication type")
                    setConnectionState({ status: 'idle' })
                    return
            }

            setConnectionState({ status: 'success', connectionId })

            const mcpId = selectedMcpForConfig.id || selectedMcpForConfig.packageId
            setMcpStatuses(prev => ({
                ...prev,
                [mcpId]: {
                    ...prev[mcpId],
                    oauthStatus: 'configured',
                    oauthData: { serviceName, connectionId }
                }
            }))

            setTimeout(() => {
                handleBackToMcpList()
            }, 1500)

        } catch (error: any) {
            console.error("Authentication configuration error:", error)
            const errorMessage = error?.message || "Failed to create connection"
            setConnectionState({ status: 'error', error: errorMessage })
            toast.error(errorMessage)
        }
    }

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

            const servicesWithScopes = requiredServices.filter(service => {
                const mcpRequiredScopes = deploymentAuthScopes?.serviceClientMap?.[service] || []
                const authMethod = authMethods?.find((method: any) => method.name === service)
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

            const deploymentData = await deployPackage.mutateAsync({
                packageId: selectedMcpForDeploy.packageId || selectedMcpForDeploy.id,
                version: selectedMcpForDeploy.latestVersion,
                url: `${selectedMcpForDeploy.url?.replace(/\/$/, '')}/mcp`,
                authData: {},
                serviceConnections: serviceConnections,
            })

            const deploymentId = deploymentData.deployment.deploymentId

            const mcpRedirectUri = new URL(selectedMcpForDeploy.url as string)
            mcpRedirectUri.pathname = mcpRedirectUri.pathname.replace(/\/$/, '') + '/osiris/callback'

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

            const mcpId = selectedMcpForDeploy.id || selectedMcpForDeploy.packageId
            setMcpStatuses(prev => ({
                ...prev,
                [mcpId]: {
                    ...prev[mcpId],
                    deploymentStatus: 'deployed',
                    deploymentData: { deploymentId }
                }
            }))

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

    const isDeploymentFormValid = () => {
        if (!deploymentAuthScopes) return false

        const requiredServices = Object.keys(deploymentAuthScopes?.serviceClientMap || {})

        const hasAllConnections = requiredServices.every(service => selectedConnections[service])
        if (!hasAllConnections) return false

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

        const deploymentIds = formData.mcpProviders
            .map(mcp => {
                const mcpId = mcp.id || mcp.packageId
                const status = mcpStatuses[mcpId]
                return status?.deploymentStatus === 'deployed' ? status.deploymentData?.deploymentId : null
            })
            .filter(Boolean)

        onAddStep({
            name: formData.name.trim(),
            mcpProvider: formData.mcpProviders[0]?.name || "",
            prompt: formData.prompt.trim(),
            mcpProviders: formData.mcpProviders,
            knowledgeBases: formData.knowledgeBases,
            deploymentIds: deploymentIds,
        })

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
        setSecretData({})
        setWalletData({
            accounts: [
                {
                    chains: ['evm:eip155:1'],
                    pathFormat: '',
                    path: '',
                    curve: '',
                    addressFormat: ''
                }
            ]
        })
        setFormData({
            name: "",
            prompt: "",
            mcpProviders: [],
            knowledgeBases: [],
        })
    }

    const handleCancel = () => {
        onOpenChange(false)
    }

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            resetForm()
        }
        onOpenChange(open)
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

                        {(() => {
                            // Only show validation if MCPs are selected
                            if (formData.mcpProviders.length === 0) return null

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
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Configure OAuth for {selectedMcpForConfig?.name}</h3>
                            <p className="text-sm text-primary-300">Set up OAuth connections and permissions</p>
                        </div>

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

                        <ScrollArea className="max-h-[400px]">
                            <div className="pr-4">
                                {authScopes?.serviceClients?.map((serviceClient: any) => {
                                    const serviceName = serviceClient.name
                                    const requiredScopes = authScopes?.serviceClientMap?.[serviceName] || []
                                    const serviceConnections = userAuth.filter((c: any) => c.service_clients.name === serviceName)

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

                                                    {/* Secret Sharing Form */}
                                                    {serviceClient.type === 'secret_sharing' && (
                                                        <div className="mb-6">
                                                            <p className="text-sm font-medium text-primary-800 mb-3">Configuration:</p>
                                                            {serviceClient.metadata?.properties ? (
                                                                <div className="space-y-4">
                                                                    {Object.entries(serviceClient.metadata.properties).map(([fieldKey, fieldConfig]: [string, any]) => (
                                                                        <div key={fieldKey} className="space-y-2">
                                                                            <Label htmlFor={fieldKey} className="text-sm font-medium">
                                                                                {fieldConfig.title || fieldKey}
                                                                                {serviceClient.metadata.required?.includes(fieldKey) && (
                                                                                    <span className="text-red-500 ml-1">*</span>
                                                                                )}
                                                                            </Label>
                                                                            <Input
                                                                                id={fieldKey}
                                                                                type={fieldConfig.format === 'uri' ? 'url' : 'text'}
                                                                                placeholder={fieldConfig.description || `Enter ${fieldConfig.title || fieldKey}`}
                                                                                value={secretData[fieldKey] || ''}
                                                                                onChange={(e) => setSecretData(prev => ({
                                                                                    ...prev,
                                                                                    [fieldKey]: e.target.value
                                                                                }))}
                                                                                required={serviceClient.metadata.required?.includes(fieldKey)}
                                                                            />
                                                                            {fieldConfig.description && (
                                                                                <p className="text-xs text-primary-400">{fieldConfig.description}</p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="py-8 text-center text-muted-foreground">
                                                                    <p className="text-sm">No configuration fields available</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Wallet Form */}
                                                    {serviceClient.type === 'embedded_wallet' && (
                                                        <div className="mb-6">
                                                            <p className="text-sm font-medium text-primary-800 mb-3">Wallet Configuration:</p>
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-sm font-medium">
                                                                        Blockchain Chains <span className="text-red-500">*</span>
                                                                    </Label>
                                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                                        {walletData.accounts[0]?.chains.map((chainValue, chainIndex) => {
                                                                            const displayName = chainValue === 'evm:eip155:1' ? 'Ethereum' :
                                                                                chainValue === 'evm:eip155:137' ? 'Polygon' :
                                                                                    chainValue === 'evm:eip155:999' ? 'Hyperliquid' :
                                                                                        chainValue === 'evm:eip155:8453' ? 'Base' :
                                                                                            chainValue === 'evm:eip155:42161' ? 'Arbitrum' :
                                                                                                chainValue === 'solana:mainnet-beta' ? 'Solana Mainnet' : chainValue

                                                                            return (
                                                                                <div key={chainIndex} className="flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs">
                                                                                    <span>{displayName}</span>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-auto p-0 text-primary-500 hover:text-primary-700"
                                                                                        onClick={() => setWalletData(prev => ({
                                                                                            ...prev,
                                                                                            accounts: prev.accounts.map((acc, i) =>
                                                                                                i === 0 ? { ...acc, chains: acc.chains.filter((_, ci) => ci !== chainIndex) } : acc
                                                                                            )
                                                                                        }))}
                                                                                    >
                                                                                        ×
                                                                                    </Button>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                    <select
                                                                        onChange={(e) => {
                                                                            const value = e.target.value
                                                                            if (value && !walletData.accounts[0].chains.includes(value)) {
                                                                                setWalletData(prev => ({
                                                                                    ...prev,
                                                                                    accounts: prev.accounts.map((acc, i) =>
                                                                                        i === 0 ? { ...acc, chains: [...acc.chains, value] } : acc
                                                                                    )
                                                                                }))
                                                                            }
                                                                        }}
                                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                    >
                                                                        <option value="">Select blockchain chain</option>
                                                                        <option value="evm:eip155:1">Ethereum</option>
                                                                        <option value="evm:eip155:137">Polygon</option>
                                                                        <option value="evm:eip155:999">Hyperliquid</option>
                                                                        <option value="evm:eip155:8453">Base</option>
                                                                        <option value="evm:eip155:42161">Arbitrum</option>
                                                                        <option value="solana:mainnet-beta">Solana Mainnet</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

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
                    </div>
                )

            case '2.2':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Deploy {selectedMcpForDeploy?.name}</h3>
                            <p className="text-sm text-primary-300">Configure deployment settings and policies</p>
                        </div>

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

                        <ScrollArea className="max-h-[400px]">
                            <div className="pr-4 space-y-4">
                                {deploymentAuthScopes?.serviceClients?.map((serviceClient: any) => {
                                    const serviceName = serviceClient.name
                                    const serviceConnections = deploymentUserAuth.filter((c: any) => c.service_clients.name === serviceName)
                                    const authMethod = authMethods?.find((method: any) => method.name === serviceName)
                                    const isEmbeddedWallet = authMethod?.type === 'embedded_wallet'
                                    const requiredScopes = deploymentAuthScopes?.serviceClientMap?.[serviceName] || []

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
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Ready to Create Step</h3>
                            <p className="text-sm text-primary-300">Review your step configuration before creating</p>
                        </div>

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

                            {formData.mcpProviders.length > 0 && (
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
                            )}

                            {formData.mcpProviders.length === 0 && (
                                <div className="p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-medium text-gray-800 mb-2">No MCPs Selected</h4>
                                    <p className="text-sm text-gray-600">This step will be created without any MCP integrations.</p>
                                </div>
                            )}

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
        <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogContent className="p-4 max-w-md max-h-[90vh] overflow-hidden">
                <DialogHeader className="space-y-4">
                    <DialogTitle className="text-primary-400 font-normal text-sm">Add step</DialogTitle>
                </DialogHeader>

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