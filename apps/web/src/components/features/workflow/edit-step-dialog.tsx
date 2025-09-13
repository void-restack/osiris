import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Edit, X, Check, ChevronsUpDown, Settings, Rocket, Loader2 } from "lucide-react"
import { type WorkflowStep } from "./workflow-step-item"
import { cn } from "@/lib/utils"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { packageQueries, knowledgeQueries, hubQueries, userQueries } from "@/lib/queries"
import { useCreateServiceConnectionMutation, useCreateSecretSharingMutation, useCreateWalletMutation, useDeployPackageMutation, useAuthorizeFrontendMutation } from "@/lib/mutations"
import { PermissionSelector } from "@/components/ui/permission-selector"
import PolicyBuilder from "@/components/policy-builder"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { transformScopeDefinitions } from "@/lib/scope-utils"
import { getScopeDisplayName } from "@/lib/scope-definitions"

interface EditStepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onEditStep: (step: WorkflowStep) => void
    step: WorkflowStep | null
    workflowData?: any
    isTemplate?: boolean // New prop to indicate if this is for template editing
}

export function EditStepDialog({ open, onOpenChange, onEditStep, step, workflowData, isTemplate = false }: EditStepDialogProps) {
    const queryClient = useQueryClient()
    const { isAuthenticated } = useAuth()

    const createServiceConnection = useCreateServiceConnectionMutation()
    const createSecretSharing = useCreateSecretSharingMutation()
    const createWallet = useCreateWalletMutation()

    const deployPackage = useDeployPackageMutation()
    const authorizeFrontend = useAuthorizeFrontendMutation()

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

    const [existingDeployedMcps, setExistingDeployedMcps] = useState<any[]>([])

    const [mcpCommandOpen, setMcpCommandOpen] = useState(false)
    const [kbCommandOpen, setKbCommandOpen] = useState(false)
    const [mcpSearchQuery, setMcpSearchQuery] = useState("")
    const [kbSearchQuery, setKbSearchQuery] = useState("")

    const [currentStep, setCurrentStep] = useState<number | '2.1' | '2.2'>(1)
    const [formData, setFormData] = useState({
        name: "",
        prompt: "",
        mcpProviders: [] as any[],
        knowledgeBases: [] as any[]
    })
    const [selectedMcpForConfig, setSelectedMcpForConfig] = useState<any>(null)
    const [selectedMcpForDeploy, setSelectedMcpForDeploy] = useState<any>(null)
    const [mcpStatuses, setMcpStatuses] = useState<Record<string, any>>({})

    const [selectedPermissions, setSelectedPermissions] = useState<Record<string, any[]>>({})
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

    const TOTAL_STEPS = 3

    useEffect(() => {
        if (step && workflowData) {
            if (isTemplate) {
                // For templates, use packageIds and knowledgeBaseIds
                const templatePackages = (step.packageIds || []).map((packageId: string) => {
                    const packageInfo = workflowData.packages?.[packageId]
                    if (packageInfo) {
                        return {
                            packageId,
                            name: packageInfo.name,
                            shortDescription: packageInfo.shortDescription,
                            url: packageInfo.url
                        }
                    }
                    return null
                }).filter(Boolean)

                const templateKnowledgeBases = (step.knowledgeBaseIds || []).map((kbId: string) => {
                    const kbInfo = workflowData.knowledgeBases?.[kbId]
                    if (kbInfo) {
                        return {
                            id: kbId,
                            name: kbInfo.name,
                            description: kbInfo.description
                        }
                    }
                    return null
                }).filter(Boolean)

                setFormData({
                    name: step.name,
                    prompt: step.prompt,
                    mcpProviders: templatePackages,
                    knowledgeBases: templateKnowledgeBases
                })
                setExistingDeployedMcps([]) // No deployments for templates
            } else {
                // For regular workflows, use deploymentIds
                const deployedMcps = (step.deploymentIds || []).map((deploymentId: string) => {
                    const agentInfo = workflowData.agents?.[deploymentId]
                    if (agentInfo) {
                        return {
                            deploymentId,
                            packageId: agentInfo.packageId,
                            name: agentInfo.name,
                            shortDescription: agentInfo.shortDescription,
                            url: agentInfo.url
                        }
                    }
                    return null
                }).filter(Boolean)

                setFormData({
                    name: step.name,
                    prompt: step.prompt,
                    mcpProviders: step.mcpProviders || [],
                    knowledgeBases: step.knowledgeBases || []
                })
                setExistingDeployedMcps(deployedMcps)
            }
        } else {
            setFormData({
                name: "",
                prompt: "",
                mcpProviders: [],
                knowledgeBases: []
            })
            setExistingDeployedMcps([])
        }
    }, [step, workflowData, isTemplate])

    const { data: popularMcps } = useQuery(packageQueries.popularOptions())

    const { data: searchedMcps } = useQuery(packageQueries.listOptions(mcpSearchQuery.length >= 2 ? { name: mcpSearchQuery } : { name: "" }))

    const { data: knowledgeBasesData } = useQuery(knowledgeQueries.basesOptions(kbSearchQuery.length >= 2 ? { name: kbSearchQuery } : { name: "" }))

    const mcpOptions = mcpSearchQuery.length >= 2 ? searchedMcps?.data : popularMcps?.data

    const kbOptions = kbSearchQuery.length >= 2 ? knowledgeBasesData?.data : []

    const { data: authScopes } = useQuery({
        ...packageQueries.authScopesOptions(selectedMcpForConfig?.packageId || selectedMcpForConfig?.id || ''),
        enabled: !!(selectedMcpForConfig?.packageId || selectedMcpForConfig?.id) && currentStep === '2.1'
    })

    const { data: userAuth } = useQuery({
        ...hubQueries.userAuthOptions(),
        enabled: !!authScopes?.serviceClients && currentStep === '2.1' && isAuthenticated
    })

    const { data: authMethods } = useQuery({
        ...hubQueries.authMethodsOptions(),
        enabled: !!authScopes?.serviceClients && currentStep === '2.1' && isAuthenticated
    })

    const { data: deploymentAuthScopes } = useQuery({
        ...packageQueries.authScopesOptions(selectedMcpForDeploy?.packageId || selectedMcpForDeploy?.id || ''),
        enabled: !!(selectedMcpForDeploy?.packageId || selectedMcpForDeploy?.id) && currentStep === '2.2'
    })

    const { data: deploymentUserAuth } = useQuery({
        ...hubQueries.userAuthOptions(),
        enabled: !!deploymentAuthScopes?.serviceClients && currentStep === '2.2' && isAuthenticated
    })

    const { data: user } = useQuery(userQueries.meOptions(isAuthenticated))

    const handleMcpSelect = useCallback((mcp: any) => {
        const mcpId = mcp.id || mcp.packageId
        if (!formData.mcpProviders.some(existing => (existing.id || existing.packageId) === mcpId)) {
            setFormData(prev => ({
                ...prev,
                mcpProviders: [...prev.mcpProviders, mcp]
            }))
        }
        setMcpCommandOpen(false)
        setMcpSearchQuery("")
    }, [formData.mcpProviders])

    const handleKbSelect = useCallback((kb: any) => {
        const kbId = kb.knowledgeBaseId || kb.knowledge_bases?.knowledgeBaseId
        if (!formData.knowledgeBases.some(existing => (existing.knowledgeBaseId || existing.knowledge_bases?.knowledgeBaseId) === kbId)) {
            setFormData(prev => ({
                ...prev,
                knowledgeBases: [...prev.knowledgeBases, kb]
            }))
        }
        setKbCommandOpen(false)
        setKbSearchQuery("")
    }, [formData.knowledgeBases])

    const handleRemoveMcp = useCallback((mcpId: string) => {
        setFormData(prev => ({
            ...prev,
            mcpProviders: prev.mcpProviders.filter(mcp => (mcp.id || mcp.packageId) !== mcpId)
        }))
    }, [])

    const handleRemoveKb = useCallback((kbId: string) => {
        setFormData(prev => ({
            ...prev,
            knowledgeBases: prev.knowledgeBases.filter(kb => (kb.knowledgeBaseId || kb.knowledge_bases?.knowledgeBaseId) !== kbId)
        }))
    }, [])

    const handleRemoveExistingMcp = useCallback((deploymentId: string) => {
        setExistingDeployedMcps(prev => prev.filter(mcp => mcp.deploymentId !== deploymentId))
    }, [])

    const handleNext = useCallback(() => {
        if (typeof currentStep === 'number' && currentStep < TOTAL_STEPS) {
            if (isTemplate) {
                // For templates, skip step 2 (deployment) and go directly to step 3
                if (currentStep === 1) {
                    setCurrentStep(3)
                } else {
                    setCurrentStep(prev => (prev as number) + 1)
                }
            } else {
                // For regular workflows, use existing logic
                if (currentStep === 1 && formData.mcpProviders.length === 0) {
                    setCurrentStep(3)
                } else {
                    setCurrentStep(prev => (prev as number) + 1)
                }
            }
        }
    }, [currentStep, formData.mcpProviders.length, isTemplate])

    const handlePrevious = useCallback(() => {
        if (typeof currentStep === 'number' && currentStep > 1) {
            if (isTemplate) {
                // For templates, skip step 2 (deployment) and go directly to step 1
                if (currentStep === 3) {
                    setCurrentStep(1)
                } else {
                    setCurrentStep(prev => (prev as number) - 1)
                }
            } else {
                // For regular workflows, use existing logic
                if (currentStep === 3 && formData.mcpProviders.length === 0) {
                    setCurrentStep(1)
                } else {
                    setCurrentStep(prev => (prev as number) - 1)
                }
            }
        }
    }, [currentStep, formData.mcpProviders.length, isTemplate])

    const validateCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return formData.name.trim() !== "" && formData.prompt.trim() !== ""
            case 2:
                if (isTemplate) return true // Skip validation for templates
                if (formData.mcpProviders.length === 0) return true
                const deployedMcps = formData.mcpProviders.filter(mcp => {
                    const mcpId = mcp.id || mcp.packageId
                    return mcpStatuses[mcpId]?.deploymentStatus === 'deployed'
                })
                return deployedMcps.length > 0
            case 3:
                if (isTemplate) return true // For templates, step 3 is just a review
                if (formData.mcpProviders.length === 0) return true
                const deployedMcpsStep3 = formData.mcpProviders.filter(mcp => {
                    const mcpId = mcp.id || mcp.packageId
                    return mcpStatuses[mcpId]?.deploymentStatus === 'deployed'
                })
                return deployedMcpsStep3.length > 0
            default:
                return true
        }
    }

    const handleServicePermissionSelect = useCallback((serviceName: string, permissions: any[]) => {
        setSelectedPermissions(prev => ({
            ...prev,
            [serviceName]: permissions
        }))
    }, [])

    const handleConnectionSelect = useCallback((serviceName: string, connectionId: string) => {
        setSelectedConnections(prev => ({
            ...prev,
            [serviceName]: connectionId
        }))
    }, [])

    const handleConfigureOAuth = useCallback((mcp: any) => {
        setSelectedMcpForConfig(mcp)
        setCurrentStep('2.1')
    }, [])

    const handleNavigateToDeploy = useCallback((mcp: any) => {
        setSelectedMcpForDeploy(mcp)
        setDeploymentState({ status: 'idle' })
        setCurrentStep('2.2')
    }, [])

    const handleBackToEdit = useCallback(() => {
        setCurrentStep(2)
        setSelectedMcpForConfig(null)
        setSelectedMcpForDeploy(null)
        setConnectionState({ status: 'idle' })
        setDeploymentState({ status: 'idle' })
        setSelectedPermissions({})
        setSelectedConnections({})
    }, [])

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

            // Invalidate user auth queries to refresh connection data
            queryClient.invalidateQueries({ queryKey: ['user-auth'] })

            setTimeout(() => {
                handleBackToEdit()
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

            const allScopes = serviceConnections.flatMap(sc => 'scopes' in sc ? sc.scopes : [])

            const mcpRedirectUri = new URL(selectedMcpForDeploy.url as string)
            mcpRedirectUri.pathname = mcpRedirectUri.pathname.replace(/\/$/, '')
            mcpRedirectUri.pathname += '/osiris/callback'

            await authorizeFrontend.mutateAsync({
                clientId: selectedMcpForDeploy.clientId ?? "",
                redirectUri: mcpRedirectUri.toString(),
                responseType: 'code',
                scopes: [...allScopes, "osiris:auth:read", "osiris:auth:action"],
                state: deploymentId || '',
                deploymentId: deploymentId,
            })

            setDeploymentState({ status: 'success', deploymentId })

            const mcpId = selectedMcpForDeploy.id || selectedMcpForDeploy.packageId
            setMcpStatuses(prev => ({
                ...prev,
                [mcpId]: {
                    oauthStatus: 'configured',
                    deploymentStatus: 'deployed',
                    deploymentData: deploymentData.deployment
                }
            }))

            toast.success('MCP deployed successfully!')

            // Invalidate queries to refresh deployment data
            queryClient.invalidateQueries({ queryKey: ['user-auth'] })
            queryClient.invalidateQueries({ queryKey: ['packages'] })

            setTimeout(() => {
                handleBackToEdit()
            }, 1500)

        } catch (error: any) {
            console.error("Deployment error:", error)
            const errorMessage = error?.message || "Failed to deploy MCP"
            setDeploymentState({ status: 'error', error: errorMessage })
            toast.error(errorMessage)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim() || !formData.prompt.trim() || !step) return

        if (isTemplate) {
            // For templates, use packageIds and knowledgeBaseIds
            const packageIds = formData.mcpProviders.map(mcp => mcp.packageId || mcp.id).filter(Boolean)
            const knowledgeBaseIds = formData.knowledgeBases.map(kb => {
                const kbData = kb.knowledge_bases || kb
                return kbData.knowledgeBaseId || kbData.id
            }).filter(Boolean)

            onEditStep({
                ...step,
                name: formData.name.trim(),
                prompt: formData.prompt.trim(),
                mcpProviders: formData.mcpProviders,
                knowledgeBases: formData.knowledgeBases,
                packageIds: packageIds,
                knowledgeBaseIds: knowledgeBaseIds,
            })
        } else {
            // For regular workflows, use deploymentIds
            const remainingDeploymentIds = existingDeployedMcps.map(mcp => mcp.deploymentId)

            const newDeploymentIds = formData.mcpProviders
                .map(mcp => {
                    const mcpId = mcp.id || mcp.packageId
                    const status = mcpStatuses[mcpId]
                    return status?.deploymentStatus === 'deployed' ? status.deploymentData?.deploymentId : null
                })
                .filter(Boolean)

            const allDeploymentIds = [...remainingDeploymentIds, ...newDeploymentIds]

            onEditStep({
                ...step,
                name: formData.name.trim(),
                prompt: formData.prompt.trim(),
                mcpProviders: formData.mcpProviders,
                knowledgeBases: formData.knowledgeBases,
                deploymentIds: allDeploymentIds, // Updated deployment IDs
            })
        }

        onOpenChange(false)
    }

    const handleCancel = () => {
        onOpenChange(false)
    }

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            if (step && workflowData) {
                const deployedMcps = (step.deploymentIds || []).map((deploymentId: string) => {
                    const agentInfo = workflowData.agents?.[deploymentId]
                    if (agentInfo) {
                        return {
                            deploymentId,
                            packageId: agentInfo.packageId,
                            name: agentInfo.name,
                            shortDescription: agentInfo.shortDescription,
                            url: agentInfo.url
                        }
                    }
                    return null
                }).filter(Boolean)

                setFormData({
                    name: step.name,
                    prompt: step.prompt,
                    mcpProviders: step.mcpProviders || [],
                    knowledgeBases: step.knowledgeBases || []
                })
                setExistingDeployedMcps(deployedMcps)
                setCurrentStep(1)
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
            }
        }
        onOpenChange(open)
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        {/* Step Details */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="step-name">Step Name</Label>
                                <Input
                                    id="step-name"
                                    placeholder="Enter step name..."
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="prompt">Prompt</Label>
                                <Textarea
                                    id="prompt"
                                    placeholder="Enter your prompt..."
                                    value={formData.prompt}
                                    onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Existing Deployed MCPs Section */}
                        {existingDeployedMcps.length > 0 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-primary-400">Currently Deployed MCPs</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {existingDeployedMcps.map((mcp) => (
                                            <Badge key={mcp.deploymentId} variant="default" className="text-xs flex items-center gap-1 bg-green-100 text-green-800">
                                                {mcp.name}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingMcp(mcp.deploymentId)}
                                                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-xs text-primary-300">These MCPs are already deployed and active. Remove them to disconnect from this step.</p>
                                </div>
                            </div>
                        )}

                        {/* MCP Providers Section */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>MCP Providers</Label>
                                <Popover open={mcpCommandOpen} onOpenChange={setMcpCommandOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={mcpCommandOpen}
                                            className="w-full justify-between"
                                        >
                                            Add MCP provider...
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                                <CommandEmpty>No MCP provider found.</CommandEmpty>
                                                <CommandGroup>
                                                    {mcpOptions?.map((mcp: any) => (
                                                        <CommandItem
                                                            key={mcp.id || mcp.packageId}
                                                            value={mcp.name}
                                                            onSelect={() => handleMcpSelect(mcp)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.mcpProviders.some(existing => (existing.id || existing.packageId) === (mcp.id || mcp.packageId))
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {mcp.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Selected MCPs */}
                            {formData.mcpProviders.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm text-primary-400">Selected MCPs</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.mcpProviders.map((mcp, index) => {
                                            const mcpId = mcp.id || mcp.packageId || `mcp-${index}`
                                            return (
                                                <Badge key={mcpId} variant="secondary" className="text-xs flex items-center gap-1">
                                                    {mcp.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMcp(mcpId)}
                                                        className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Knowledge Bases Section */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Knowledge Bases</Label>
                                <Popover open={kbCommandOpen} onOpenChange={setKbCommandOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={kbCommandOpen}
                                            className="w-full justify-between"
                                        >
                                            Add knowledge base...
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                                <CommandEmpty>No knowledge base found.</CommandEmpty>
                                                <CommandGroup>
                                                    {kbOptions?.map((kb: any) => {
                                                        const kbData = kb.knowledge_bases || kb
                                                        const kbId = kbData.knowledgeBaseId
                                                        const kbName = kbData.name
                                                        return (
                                                            <CommandItem
                                                                key={kbId}
                                                                value={kbName}
                                                                onSelect={() => handleKbSelect(kb)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.knowledgeBases.some(existing => (existing.knowledgeBaseId || existing.knowledge_bases?.knowledgeBaseId) === kbId)
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {kbName}
                                                            </CommandItem>
                                                        )
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Selected Knowledge Bases */}
                            {formData.knowledgeBases.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm text-primary-400">Selected Knowledge Bases</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.knowledgeBases.map((kb, index) => {
                                            const kbData = kb.knowledge_bases || kb
                                            const kbId = kbData.knowledgeBaseId || kbData.id || `kb-${index}`
                                            const kbName = kbData.name
                                            return (
                                                <Badge key={kbId} variant="secondary" className="text-xs flex items-center gap-1">
                                                    {kbName.length > 20 ? `${kbName.substring(0, 20)}...` : kbName}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveKb(kbId)}
                                                        className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )
            case 2:
                return (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Configure MCPs</h3>
                            <p className="text-sm text-primary-300">Set up authentication and deploy your selected MCPs</p>
                        </div>

                        {/* Validation Message */}
                        {(() => {
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

                        {/* MCPs List */}
                        <div className="space-y-4">
                            {formData.mcpProviders.map((mcp, index) => {
                                const mcpId = mcp.id || mcp.packageId || `mcp-deploy-${index}`
                                const status = mcpStatuses[mcpId] || { oauthStatus: 'not_configured', deploymentStatus: 'not_deployed' }
                                return (
                                    <div key={mcpId} className="p-4 w-full border rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center">
                                                    <span className="text-sm font-medium">{mcp.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{mcp.name}</h4>
                                                    <div className="flex gap-2 mt-1">
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
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleConfigureOAuth(mcp)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Settings size={14} />
                                                    Configure OAuth
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleNavigateToDeploy(mcp)}
                                                    disabled={mcpStatuses[mcpId]?.deploymentStatus === 'deployed'}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Rocket size={14} />
                                                    {mcpStatuses[mcpId]?.deploymentStatus === 'deployed' ? 'Deployed' : 'Deploy MCP'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Knowledge Bases */}
                        {formData.knowledgeBases.length > 0 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-primary-400">Selected Knowledge Bases</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.knowledgeBases.map((kb, index) => {
                                            const kbData = kb.knowledge_bases || kb
                                            const kbName = kbData.name
                                            return (
                                                <Badge key={kbData.knowledgeBaseId || kbData.id || `kb-step2-${index}`} variant="secondary" className="text-xs">
                                                    {kbName.length > 20 ? `${kbName.substring(0, 20)}...` : kbName}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Ready to Save Changes</h3>
                            <p className="text-sm text-primary-300">Review your step configuration before saving</p>
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
                                    <h4 className="font-medium text-green-800 mb-2">
                                        {isTemplate ? "Selected Packages" : "Deployed MCPs"}
                                    </h4>
                                    <div className="space-y-2">
                                        {formData.mcpProviders.map((mcp, index) => {
                                            const mcpId = mcp.id || mcp.packageId || `mcp-step3-${index}`
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
                                                    {!isTemplate && (
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
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {formData.mcpProviders.length === 0 && (
                                <div className="p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-medium text-gray-800 mb-2">
                                        {isTemplate ? "No Packages Selected" : "No MCPs Selected"}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {isTemplate
                                            ? "This step will be saved without any package integrations."
                                            : "This step will be saved without any MCP integrations."
                                        }
                                    </p>
                                </div>
                            )}
                            {formData.knowledgeBases.length > 0 && (
                                <div className="p-4 border rounded-lg bg-blue-50">
                                    <h4 className="font-medium text-blue-800 mb-2">Knowledge Bases</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.knowledgeBases.map((kb, index) => {
                                            const kbData = kb.knowledge_bases || kb
                                            const kbName = kbData.name
                                            return (
                                                <Badge key={kbData.knowledgeBaseId || kbData.id || `kb-step3-${index}`} variant="secondary" className="text-xs">
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
            case '2.1':
                return (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Configure OAuth for {selectedMcpForConfig?.name}</h3>
                            <p className="text-sm text-primary-300">Set up authentication and permissions</p>
                        </div>

                        {/* MCP Info */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="flex flex-col items-center gap-2">
                                <Avatar className="size-10">
                                    <AvatarImage src={selectedMcpForConfig?.iconUrl} alt={selectedMcpForConfig?.name} />
                                    <AvatarFallback className="rounded-sm">
                                        {selectedMcpForConfig?.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-primary-400">{selectedMcpForConfig?.name}</span>
                            </div>
                        </div>


                        {/* Service Connections - ScrollArea for long content */}
                        <ScrollArea className="max-h-[400px]">
                            <div className="pr-4 space-y-4">
                                {!authScopes?.serviceClients ? (
                                    <div className="p-4 border rounded-lg bg-yellow-50">
                                        <p className="text-sm text-yellow-800">
                                            Loading OAuth configuration for {selectedMcpForConfig?.name}...
                                        </p>
                                        <p className="text-xs text-yellow-600 mt-1">
                                            Package ID: {selectedMcpForConfig?.packageId || selectedMcpForConfig?.id}
                                        </p>
                                    </div>
                                ) : authScopes?.serviceClients?.length === 0 ? (
                                    <div className="p-4 border rounded-lg bg-red-50">
                                        <p className="text-sm text-red-800">
                                            No OAuth configuration found for {selectedMcpForConfig?.name}
                                        </p>
                                    </div>
                                ) : (
                                    authScopes?.serviceClients?.map((serviceClient: any) => {
                                        const serviceName = serviceClient.name
                                        const serviceConnections = userAuth?.filter((c: any) => c.service_clients.name === serviceName) || []
                                        const authMethod = authMethods?.find((method: any) => method.name === serviceName)
                                        const isEmbeddedWallet = authMethod?.type === 'embedded_wallet'
                                        const requiredScopes = authScopes?.serviceClientMap?.[serviceName] || []

                                        const permissions = serviceClient.scopeDefinitions ?
                                            Object.entries(transformScopeDefinitions(serviceClient.name, serviceClient.scopeDefinitions)).map(([scope, label]) => ({
                                                id: scope,
                                                label: String(label) || getScopeDisplayName(scope) || scope
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
                                                        <p className="text-sm text-primary-300">Select connection and permissions</p>
                                                    </div>
                                                </div>

                                                {/* Permission Selection for OAuth services */}
                                                {!isEmbeddedWallet && permissions.length > 0 && (
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium text-primary-400">Select permissions to grant:</Label>
                                                        <PermissionSelector
                                                            context="deploy-dialog"
                                                            key={`config-${serviceName}`}
                                                            permissions={permissions}
                                                            placeholder={`Search ${serviceName} permissions...`}
                                                            onSelectionChange={(perms: any[]) => handleServicePermissionSelect(serviceName, perms)}
                                                            initialSelected={selectedPermissions[serviceName] || []}
                                                        />
                                                    </div>
                                                )}

                                                {/* Secret Sharing Form */}
                                                {serviceClient.type === 'secret_sharing' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium text-primary-400">Configuration:</Label>
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
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium text-primary-400">Wallet Configuration:</Label>
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
                                                                const radioId = `config-radio-${connection.user_service_connections.id}`
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
                                                        <p className="text-sm text-primary-400">No {serviceName} connections available. Please connect your account first.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>


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
                                    const serviceConnections = deploymentUserAuth?.filter((c: any) => c.service_clients.name === serviceName) || []
                                    const authMethod = authMethods?.find((method: any) => method.name === serviceName)
                                    const isEmbeddedWallet = authMethod?.type === 'embedded_wallet'
                                    const requiredScopes = deploymentAuthScopes?.serviceClientMap?.[serviceName] || []

                                    const permissions = serviceClient.scopeDefinitions ?
                                        Object.entries(transformScopeDefinitions(serviceClient.name, serviceClient.scopeDefinitions)).map(([scope, label]) => ({
                                            id: scope,
                                            label: String(label) || getScopeDisplayName(scope) || scope
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
                                                        onSelectionChange={(perms: any[]) => handleServicePermissionSelect(serviceName, perms)}
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
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Edit Step</DialogTitle>
                </DialogHeader>

                {/* Currently editing indicator */}
                <div className="py-4">
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <Edit size={14} />
                        Currently editing: {step?.name}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-6">
                    <div className="flex-1 overflow-y-auto space-y-6">
                        {renderStepContent()}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 flex-shrink-0">
                        {currentStep === '2.1' ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBackToEdit}
                                    className="flex-1"
                                >
                                    Back to MCP List
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSaveAuthenticator}
                                    disabled={connectionState.status === 'connecting'}
                                    className="flex-1 bg-primary-800 hover:bg-primary-900 text-white"
                                >
                                    {connectionState.status === 'connecting' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save OAuth Configuration'
                                    )}
                                </Button>
                            </>
                        ) : currentStep === '2.2' ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBackToEdit}
                                    className="flex-1"
                                >
                                    Back to MCP List
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleDeployMcp}
                                    disabled={deploymentState.status === 'deploying'}
                                    className="flex-1 bg-primary-800 hover:bg-primary-900 text-white"
                                >
                                    {deploymentState.status === 'deploying' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deploying...
                                        </>
                                    ) : (
                                        <>
                                            <Rocket className="mr-2 h-4 w-4" />
                                            Deploy MCP
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : typeof currentStep === 'number' && currentStep === 1 ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!validateCurrentStep()}
                                    className="flex-1 bg-primary-800 hover:bg-primary-900 text-white"
                                >
                                    Next
                                </Button>
                            </>
                        ) : typeof currentStep === 'number' && currentStep === 2 ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handlePrevious}
                                    className="flex-1"
                                >
                                    Previous
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!validateCurrentStep()}
                                    className="flex-1 bg-primary-800 hover:bg-primary-900 text-white"
                                >
                                    Next
                                </Button>
                            </>
                        ) : typeof currentStep === 'number' && currentStep === TOTAL_STEPS ? (
                            <Button
                                type="submit"
                                disabled={!validateCurrentStep()}
                                className="bg-primary-800 hover:bg-primary-900 text-white"
                            >
                                Save Changes
                            </Button>
                        ) : null}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
