import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PermissionSelector, type Permission } from "@/components/ui/permission-selector"
import { ChevronLeft, ChevronRight, Loader2, Package, Database, Settings, Rocket, CheckCircle, AlertCircle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { packageQueries, knowledgeQueries, hubQueries } from "@/lib/queries"
import { useCreateWorkflowFromTemplateMutation, useCreateServiceConnectionMutation, useDeployPackageMutation, useAuthorizeFrontendMutation } from "@/lib/mutations"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { getInitials } from "@/lib/utils"
import { getScopeDisplayName } from "@/lib/scope-definitions"

interface CloneTemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    template: {
        id: string
        title: string
        description: string
        imageUrl?: string
        coverImageUrl?: string
        isPublic?: boolean
        embedding?: any
        ownerId?: string
        createdAt?: string
        updatedAt?: string
        packages?: Record<string, {
            name: string
            shortDescription: string
            url: string
        }>
        knowledgeBases?: Record<string, {
            name: string
            description: string
        }>
        timeBasedTrigger?: {
            rrule: string
            startTime: string
        }
        workflow: Array<{
            name: string
            packageIds: string[]
            knowledgeBaseIds?: string[]
            prompt: string
        }>
    }
}

const TOTAL_STEPS = 3

// Custom hook for session storage
const useSessionStorage = <T,>(key: string, defaultValue: T) => {
    const [value, setValue] = useState<T>(() => {
        try {
            const item = sessionStorage.getItem(key)
            return item ? JSON.parse(item) : defaultValue
        } catch {
            return defaultValue
        }
    })

    const setStoredValue = (newValue: T) => {
        try {
            setValue(newValue)
            sessionStorage.setItem(key, JSON.stringify(newValue))
        } catch {
            setValue(newValue)
        }
    }

    return [value, setStoredValue] as const
}

interface CloneTemplateState {
    currentStep: number | '2.1' | '2.2'
    workflowName: string
    workflowDescription: string
    selectedMcpForConfig: any
    selectedMcpForDeploy: any
    authHubName: string
    selectedPermissions: Record<string, any[]>
    selectedConnections: Record<string, string>
    mcpStatuses: Record<string, 'pending' | 'configuring' | 'deployed' | 'error'>
    deploymentIds: Record<string, string>
    connectionState: { status: 'idle' | 'connecting' | 'success' | 'error', error?: string }
    deploymentState: { status: 'idle' | 'deploying' | 'success' | 'error', error?: string }
}

export function CloneTemplateDialog({ open, onOpenChange, template }: CloneTemplateDialogProps) {
    const [cloneState, setCloneState] = useSessionStorage<CloneTemplateState>('clone-template-state', {
        currentStep: 1,
        workflowName: `${template.title} (Clone)`,
        workflowDescription: template.description,
        selectedMcpForConfig: null,
        selectedMcpForDeploy: null,
        authHubName: "",
        selectedPermissions: {},
        selectedConnections: {},
        mcpStatuses: {},
        deploymentIds: {},
        connectionState: { status: 'idle' },
        deploymentState: { status: 'idle' }
    })

    const [currentStep, setCurrentStep] = useState(cloneState.currentStep)
    const [workflowName, setWorkflowName] = useState(cloneState.workflowName)
    const [workflowDescription, setWorkflowDescription] = useState(cloneState.workflowDescription)
    const [selectedMcpForConfig, setSelectedMcpForConfig] = useState(cloneState.selectedMcpForConfig)
    const [selectedMcpForDeploy, setSelectedMcpForDeploy] = useState(cloneState.selectedMcpForDeploy)
    const [authHubName, setAuthHubName] = useState(cloneState.authHubName)
    const [selectedPermissions, setSelectedPermissions] = useState(cloneState.selectedPermissions)
    const [selectedConnections, setSelectedConnections] = useState(cloneState.selectedConnections)
    const [mcpStatuses, setMcpStatuses] = useState(cloneState.mcpStatuses)
    const [deploymentIds, setDeploymentIds] = useState(cloneState.deploymentIds)
    const [connectionState, setConnectionState] = useState(cloneState.connectionState)
    const [deploymentState, setDeploymentState] = useState(cloneState.deploymentState)

    const { isAuthenticated, user } = useAuth()
    const createWorkflowFromTemplate = useCreateWorkflowFromTemplateMutation()
    const createServiceConnection = useCreateServiceConnectionMutation()
    const deployPackage = useDeployPackageMutation()
    const authorizeFrontend = useAuthorizeFrontendMutation()

    const allPackageIds = useMemo(() => {
        const packageIds = new Set<string>()
        template.workflow.forEach(step => {
            step.packageIds.forEach(id => packageIds.add(id))
        })
        return Array.from(packageIds)
    }, [template.workflow])

    const allKnowledgeBaseIds = useMemo(() => {
        const kbIds = new Set<string>()
        template.workflow.forEach(step => {
            if (step.knowledgeBaseIds) {
                step.knowledgeBaseIds.forEach(id => kbIds.add(id))
            }
        })
        return Array.from(kbIds)
    }, [template.workflow])

    const packageQueries_data = allPackageIds.map(packageId =>
        useQuery(packageQueries.detailOptions(packageId))
    )

    const knowledgeBaseQueries_data = allKnowledgeBaseIds.map(kbId =>
        useQuery(knowledgeQueries.baseOptions(kbId))
    )

    const packages = packageQueries_data.map(query => query.data).filter(Boolean)
    const knowledgeBases = knowledgeBaseQueries_data.map(query => query.data).filter(Boolean)

    const isLoadingPackages = packageQueries_data.some(query => query.isLoading)
    const isLoadingKnowledgeBases = knowledgeBaseQueries_data.some(query => query.isLoading)

    // Sync state with session storage
    const updateSessionState = () => {
        setCloneState({
            currentStep,
            workflowName,
            workflowDescription,
            selectedMcpForConfig,
            selectedMcpForDeploy,
            authHubName,
            selectedPermissions,
            selectedConnections,
            mcpStatuses,
            deploymentIds,
            connectionState,
            deploymentState
        })
    }

    useEffect(() => {
        updateSessionState()
    }, [currentStep, workflowName, workflowDescription, selectedMcpForConfig, selectedMcpForDeploy, authHubName, selectedPermissions, selectedConnections, mcpStatuses, deploymentIds, connectionState, deploymentState])

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')
        const error = urlParams.get('error')
        const type = urlParams.get('type')
        const serviceClient = urlParams.get('serviceClient')
        const success = urlParams.get('success')
        const userServiceConnectionId = urlParams.get('userServiceConnectionId')

        // Check for OAuth success (multiple formats)
        const isOAuthSuccess = (code && state) || (type === 'oauth' && success === 'true' && userServiceConnectionId)

        if (isOAuthSuccess) {
            // OAuth success callback detected - restore dialog state
            const sessionData = sessionStorage.getItem('clone-template-state')
            if (sessionData) {
                try {
                    const parsedData = JSON.parse(sessionData)
                    if (parsedData.currentStep === '2.1' || parsedData.currentStep === '2.2') {
                        // Restore dialog state
                        setCurrentStep(parsedData.currentStep)
                        setWorkflowName(parsedData.workflowName)
                        setWorkflowDescription(parsedData.workflowDescription)
                        setSelectedMcpForConfig(parsedData.selectedMcpForConfig)
                        setSelectedMcpForDeploy(parsedData.selectedMcpForDeploy)
                        setAuthHubName(parsedData.authHubName)
                        setSelectedPermissions(parsedData.selectedPermissions)
                        setSelectedConnections(parsedData.selectedConnections)
                        setMcpStatuses(parsedData.mcpStatuses)
                        setConnectionState(parsedData.connectionState)
                        setDeploymentState(parsedData.deploymentState)

                        // Update connection state to success
                        setConnectionState({ status: 'success' })

                        // Update MCP status to configuring for all MCPs that share the same OAuth service
                        if (parsedData.selectedMcpForConfig?.packageId) {
                            setMcpStatuses(prev => {
                                const updated = { ...prev }
                                // Update the current MCP
                                updated[parsedData.selectedMcpForConfig.packageId] = 'configuring'

                                // Also update any other MCPs that might share the same OAuth service
                                // This allows users to configure OAuth for multiple MCPs at once
                                return updated
                            })
                        }

                        // Open the dialog
                        onOpenChange(true)

                        // Clear URL parameters
                        const newUrl = window.location.pathname
                        window.history.replaceState({}, '', newUrl)

                        toast.success(`OAuth authentication completed successfully for ${serviceClient || 'service'}!`)
                    }
                } catch (error) {
                    console.error('Failed to restore dialog state:', error)
                }
            }
        } else if (error) {
            // OAuth error callback detected - restore dialog state and show error
            const sessionData = sessionStorage.getItem('clone-template-state')
            if (sessionData) {
                try {
                    const parsedData = JSON.parse(sessionData)
                    if (parsedData.currentStep === '2.1' || parsedData.currentStep === '2.2') {
                        // Restore dialog state
                        setCurrentStep(parsedData.currentStep)
                        setWorkflowName(parsedData.workflowName)
                        setWorkflowDescription(parsedData.workflowDescription)
                        setSelectedMcpForConfig(parsedData.selectedMcpForConfig)
                        setSelectedMcpForDeploy(parsedData.selectedMcpForDeploy)
                        setAuthHubName(parsedData.authHubName)
                        setSelectedPermissions(parsedData.selectedPermissions)
                        setSelectedConnections(parsedData.selectedConnections)
                        setMcpStatuses(parsedData.mcpStatuses)
                        setConnectionState(parsedData.connectionState)
                        setDeploymentState(parsedData.deploymentState)

                        // Set error state
                        setConnectionState({
                            status: 'error',
                            error: `OAuth authentication failed: ${error}`
                        })

                        // Open the dialog
                        onOpenChange(true)

                        // Clear URL parameters
                        const newUrl = window.location.pathname
                        window.history.replaceState({}, '', newUrl)

                        toast.error(`OAuth authentication failed: ${error}`)
                    }
                } catch (error) {
                    console.error('Failed to restore dialog state:', error)
                }
            }
        }
    }, [onOpenChange])

    // Clear session storage on dialog close
    const resetSessionState = () => {
        const initialState = {
            currentStep: 1,
            workflowName: `${template.title} (Clone)`,
            workflowDescription: template.description,
            selectedMcpForConfig: null,
            selectedMcpForDeploy: null,
            authHubName: "",
            selectedPermissions: {},
            selectedConnections: {},
            mcpStatuses: {},
            deploymentIds: {},
            connectionState: { status: 'idle' },
            deploymentState: { status: 'idle' }
        }
        sessionStorage.setItem('clone-template-state', JSON.stringify(initialState))
    }

    // OAuth Configuration Queries
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
        if (!allUserAuth) return []

        // Use deployment auth scopes if we're in deployment step, otherwise use config auth scopes
        const currentAuthScopes = currentStep === '2.2' ? deploymentAuthScopes : authScopes
        if (!currentAuthScopes) return []

        const allowedServices = Object.keys(currentAuthScopes?.serviceClientMap || {})

        return allUserAuth.filter((connection: any) =>
            allowedServices.includes(connection.service_clients.name)
        )
    }, [allUserAuth, authScopes, deploymentAuthScopes, currentStep])

    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 1:
                return true
            case 2:
                return true
            case 3:
                return workflowName.trim().length > 0 && workflowDescription.trim().length > 0
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

    const handlePermissionSelect = (serviceName: string, permissions: Permission[]) => {
        // Store permissions per MCP + service combination to avoid conflicts
        const mcpId = currentStep === '2.1' ? selectedMcpForConfig?.packageId : selectedMcpForDeploy?.packageId
        const key = `${mcpId}-${serviceName}`

        setSelectedPermissions(prev => ({
            ...prev,
            [key]: permissions
        }))
    }

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

            if (requiredServices.length === 0) {
                toast.error("No services found for this MCP")
                setConnectionState({ status: 'idle' })
                return
            }

            const redirectUri = `${window.location.origin}${window.location.pathname}`
            let allConnectionsSuccessful = true

            // Handle all required services for this MCP
            for (const serviceName of requiredServices) {
                const serviceClient = authScopes?.serviceClients?.find((sc: any) => sc.name === serviceName)
                if (!serviceClient) {
                    console.error(`Service client not found for: ${serviceName}`)
                    allConnectionsSuccessful = false
                    continue
                }

                // Infer service client type if not provided
                let serviceClientType = serviceClient.type
                if (!serviceClientType) {
                    // Infer type from metadata
                    if (serviceClient.metadata?.authUrl && serviceClient.metadata?.tokenUrl) {
                        serviceClientType = 'oauth'
                    } else if (serviceClient.metadata?.required) {
                        serviceClientType = 'secret_sharing'
                    } else {
                        serviceClientType = 'oauth' // Default fallback
                    }
                }

                try {
                    switch (serviceClientType) {
                        case 'oauth':
                            // Get permissions for this specific MCP + service combination
                            const mcpServiceKey = `${selectedMcpForConfig.packageId}-${serviceName}`
                            const permissions = selectedPermissions[mcpServiceKey] || []

                            await createServiceConnection.mutateAsync({
                                serviceClientName: serviceName,
                                scopes: permissions.map(permission => permission.id),
                                name: `${authHubName} - ${serviceName}`,
                                redirectUri: redirectUri,
                                preventRedirect: false
                            })
                            toast.success(`${serviceName} OAuth connection created successfully!`)
                            break

                        case 'secret_sharing':
                            toast.success(`${serviceName} secret connection created successfully!`)
                            break

                        case 'embedded_wallet':
                            toast.success(`${serviceName} wallet connection created successfully!`)
                            break

                        default:
                            console.error("Unsupported service client type:", serviceClientType, "for service:", serviceName)
                            console.error("Full service client object:", serviceClient)
                            throw new Error(`Unsupported service client type: ${serviceClientType || 'undefined'} for service: ${serviceName}`)
                    }
                } catch (error) {
                    console.error(`Failed to create connection for ${serviceName}:`, error)
                    allConnectionsSuccessful = false
                }
            }

            if (!allConnectionsSuccessful) {
                throw new Error("Some OAuth connections failed. Please try again.")
            }

            setConnectionState({ status: 'success' })

            // Update MCP status for the current MCP and any others that share the same OAuth service
            setMcpStatuses(prev => {
                const updated = { ...prev }
                // Update the current MCP
                updated[selectedMcpForConfig.packageId] = 'configuring'

                // Find other MCPs that might share the same OAuth service
                // This allows users to configure OAuth once and use it for multiple MCPs
                const currentServiceNames = Object.keys(authScopes?.serviceClientMap || {})

                // For now, just update the current MCP
                // In the future, we could add logic to update related MCPs automatically

                return updated
            })

            // Move to deployment step
            setTimeout(() => {
                setCurrentStep('2.2')
                setSelectedMcpForDeploy(selectedMcpForConfig)
            }, 1000)

        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create OAuth connection'
            setConnectionState({ status: 'error', error: errorMessage })
            toast.error(errorMessage)
        }
    }

    const handleDeployMcpPackage = async () => {
        if (!selectedMcpForDeploy) return

        try {
            setDeploymentState({ status: 'deploying' })

            const requiredServices = Object.keys(deploymentAuthScopes?.serviceClientMap || {})
            const missingServices = requiredServices.filter(service => !selectedConnections[service])

            if (missingServices.length > 0) {
                toast.error(`Please select connections for: ${missingServices.join(', ')}`)
                return
            }

            // Build serviceConnections array like in add-step-dialog.tsx
            const serviceConnections = requiredServices
                .filter(service => selectedConnections[service])
                .map(service => {
                    const authMethod = authMethods?.find((method: any) => method.name === service)
                    const isEmbeddedWallet = authMethod?.type === 'embedded_wallet'

                    // Get permissions for this specific MCP + service combination
                    const mcpServiceKey = `${selectedMcpForDeploy.packageId}-${service}`
                    const permissions = selectedPermissions[mcpServiceKey] || []

                    return {
                        connectionId: selectedConnections[service],
                        ...(isEmbeddedWallet
                            ? { policy: {} } // You might need to add policy logic here
                            : { scopes: permissions.map(permission => permission.id) }
                        )
                    }
                })

            // Deploy the package first to get deploymentId
            const deploymentData = await deployPackage.mutateAsync({
                packageId: selectedMcpForDeploy.packageId || selectedMcpForDeploy.id,
                version: selectedMcpForDeploy.latestVersion,
                url: `${selectedMcpForDeploy.url?.replace(/\/$/, '')}/mcp`,
                authData: {},
                serviceConnections: serviceConnections,
            })

            const deploymentId = deploymentData.deployment.deploymentId

            // Build proper mcpRedirectUri using the MCP's URL like in add-step-dialog.tsx
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

            setDeploymentState({ status: 'success' })
            setMcpStatuses(prev => ({
                ...prev,
                [selectedMcpForDeploy.packageId]: 'deployed'
            }))

            // Store the actual deployment ID for this package
            setDeploymentIds(prev => ({
                ...prev,
                [selectedMcpForDeploy.packageId]: deploymentId
            }))
            toast.success(`${selectedMcpForDeploy.name} deployed successfully!`)

            // Move to next step or back to package list
            setTimeout(() => {
                setCurrentStep(2)
                setSelectedMcpForDeploy(null)
            }, 1000)

        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to deploy MCP'
            setDeploymentState({ status: 'error', error: errorMessage })
            toast.error(errorMessage)
        }
    }

    const isDeploymentFormValid = () => {
        if (!selectedMcpForDeploy) return false

        const requiredServices = Object.keys(deploymentAuthScopes?.serviceClientMap || {})
        return requiredServices.every(service => selectedConnections[service])
    }

    // Check if an MCP can be deployed based on available OAuth connections
    const canDeployMcp = (mcp: any) => {
        // This is a simplified check - in a real implementation, you'd need to:
        // 1. Get the auth scopes for this specific MCP
        // 2. Check if the required OAuth services are available
        // 3. Verify the connections have the right permissions

        // For now, we'll use a simple heuristic:
        // If the MCP status is 'configuring', it means OAuth was configured
        const mcpStatus = mcpStatuses[mcp.packageId]
        return mcpStatus === 'configuring' || mcpStatus === 'deployed'
    }

    const handleCancel = () => {
        resetSessionState()
        onOpenChange(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!workflowName.trim() || !workflowDescription.trim()) return

        try {
            // Map package IDs to actual deployment IDs
            const packageIdToDeploymentId = new Map<string, string>()

            // Get deployment IDs for all deployed packages
            Object.keys(mcpStatuses).forEach(packageId => {
                if (mcpStatuses[packageId] === 'deployed' && deploymentIds[packageId]) {
                    packageIdToDeploymentId.set(packageId, deploymentIds[packageId])
                }
            })

            await createWorkflowFromTemplate.mutateAsync({
                templateWorkflowId: template.id,
                title: workflowName.trim(),
                description: workflowDescription.trim(),
                imageUrl: template.imageUrl || '',
                coverImageUrl: template.coverImageUrl || '',
                isPublic: template.isPublic || false,
                timeBasedTrigger: template.timeBasedTrigger || {
                    rrule: 'FREQ=DAILY;INTERVAL=1',
                    startTime: new Date().toISOString()
                },
                workflow: template.workflow.map(step => {
                    const mappedStep = {
                        name: step.name,
                        deploymentId: step.packageIds.map(packageId =>
                            packageIdToDeploymentId.get(packageId) || packageId
                        ),
                        knowledgeBaseIds: step.knowledgeBaseIds || [],
                        prompt: step.prompt
                    }
                    return mappedStep
                })
            })

            resetSessionState()
            onOpenChange(false)

            // Redirect to the new workflow page
            window.location.href = `/workflow/${createWorkflowFromTemplate.data?.id}`
        } catch (error: any) {
            console.error("Failed to create workflow from template:", error)
        }
    }

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            resetSessionState()
            setCurrentStep(1)
            setWorkflowName(`${template.title} (Clone)`)
            setWorkflowDescription(template.description)
        }
        onOpenChange(open)
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <ScrollArea className="h-[500px]">
                            <div className="space-y-4">
                                {allPackageIds.length > 0 && (
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            Required Packages ({allPackageIds.length})
                                        </h4>
                                        {isLoadingPackages ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="ml-2 text-sm text-primary-400">Loading packages...</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {packages.map((pkg) => (
                                                    <div key={pkg.packageId} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                                        <Avatar className="size-8">
                                                            <AvatarImage src={pkg.iconUrl} alt={pkg.name} />
                                                            <AvatarFallback className="text-xs">
                                                                {pkg.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <h5 className="font-medium text-sm text-primary-800">{pkg.name}</h5>
                                                            <p className="text-xs text-primary-400">{pkg.shortDescription}</p>
                                                        </div>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {pkg.type}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {allKnowledgeBaseIds.length > 0 && (
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            Required Knowledge Bases ({allKnowledgeBaseIds.length})
                                        </h4>
                                        {isLoadingKnowledgeBases ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="ml-2 text-sm text-primary-400">Loading knowledge bases...</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {knowledgeBases.map((kb) => (
                                                    <div key={kb.knowledgeBaseId} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                                        <Avatar className="size-8">
                                                            <AvatarImage src={kb.iconUrl} alt={kb.name} />
                                                            <AvatarFallback className="text-xs">
                                                                {kb.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <h5 className="font-medium text-sm text-primary-800">{kb.name}</h5>
                                                            <p className="text-xs text-primary-400">{kb.description}</p>
                                                        </div>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {kb.isPublic ? 'Public' : 'Private'}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {allPackageIds.length === 0 && allKnowledgeBaseIds.length === 0 && (
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-medium text-gray-800 mb-2">No External Dependencies</h4>
                                        <p className="text-sm text-gray-600">This template doesn't require any packages or knowledge bases.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Deploy Required Packages</h3>
                            <p className="text-sm text-primary-300">Configure OAuth and deploy the packages needed for this template</p>
                        </div>

                        <ScrollArea className="h-[400px]">
                            <div className="space-y-4">
                                {packages.map((pkg) => {
                                    const status = mcpStatuses[pkg.packageId] || 'pending'
                                    return (
                                        <div key={pkg.packageId} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-10">
                                                        <AvatarImage src={pkg.iconUrl} alt={pkg.name} />
                                                        <AvatarFallback className="text-sm">
                                                            {pkg.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="font-medium">{pkg.name}</h4>
                                                        <p className="text-sm text-primary-400">{pkg.shortDescription}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {status === 'pending' && (
                                                        <Badge variant="secondary">Pending</Badge>
                                                    )}
                                                    {status === 'configuring' && (
                                                        <Badge variant="outline" className="text-blue-600">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            OAuth Ready
                                                        </Badge>
                                                    )}
                                                    {status === 'deployed' && (
                                                        <Badge variant="default" className="bg-green-600">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Deployed
                                                        </Badge>
                                                    )}
                                                    {status === 'error' && (
                                                        <Badge variant="destructive">
                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                            Error
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleConfigureOAuth(pkg)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                        Configure OAuth
                                                    </Button>
                                                )}
                                                {status === 'configuring' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleDeployMcp(pkg)}
                                                        className="flex items-center gap-2"
                                                        disabled={!canDeployMcp(pkg)}
                                                    >
                                                        <Rocket className="h-4 w-4" />
                                                        Deploy Package
                                                    </Button>
                                                )}
                                                {status === 'deployed' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled
                                                        className="flex items-center gap-2"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Already Deployed
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}

                                {packages.length === 0 && (
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-medium text-gray-800 mb-2">No Packages Required</h4>
                                        <p className="text-sm text-gray-600">This template doesn't require any external packages.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )

            case '2.1':
                return (
                    <div>
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Configure OAuth for {selectedMcpForConfig?.name}</h3>
                            <p className="text-sm text-primary-300">
                                Set up OAuth connections and permissions
                                {authScopes?.serviceClients && authScopes.serviceClients.length > 1 &&
                                    ` (${authScopes.serviceClients.length} services required)`
                                }
                            </p>
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
                            <p className="text-xs text-primary-400">
                                This will be the name for your OAuth connection. Individual service connections will be created automatically.
                            </p>
                        </div>

                        <ScrollArea className="max-h-[400px]">
                            <div className="pr-4">
                                {authScopes?.serviceClients?.map((serviceClient: any) => {
                                    const serviceName = serviceClient.name
                                    const requiredScopes = authScopes?.serviceClientMap?.[serviceName] || []
                                    const serviceConnections = userAuth.filter((c: any) => c.service_clients.name === serviceName)

                                    const permissions = requiredScopes.map((scope: any) => ({
                                        id: scope,
                                        label: getScopeDisplayName(scope) || scope
                                    }))

                                    const handleServicePermissionSelect = (perms: Permission[]) => handlePermissionSelect(serviceName, perms)
                                    const mcpServiceKey = `${selectedMcpForConfig.packageId}-${serviceName}`
                                    const initialSelected = selectedPermissions[mcpServiceKey] || []

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

                        {connectionState.status === 'error' && (
                            <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                                <p className="text-sm text-red-600 mb-2">{connectionState.error}</p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setConnectionState({ status: 'idle' })
                                        handleSaveAuthenticator()
                                    }}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    Try Again
                                </Button>
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
                                {Object.keys(deploymentAuthScopes?.serviceClientMap || {}).map((serviceName) => {
                                    const serviceClient = deploymentAuthScopes?.serviceClients?.find((sc: any) => sc.name === serviceName)
                                    if (!serviceClient) return null

                                    const serviceConnections = userAuth.filter((c: any) => c.service_clients.name === serviceName)
                                    const authMethod = authMethods?.find((method: any) => method.name === serviceName)
                                    const isEmbeddedWallet = authMethod?.type === 'embedded_wallet'
                                    const requiredScopes = deploymentAuthScopes?.serviceClientMap?.[serviceName] || []

                                    const permissions = requiredScopes.map((scope: any) => ({
                                        id: scope,
                                        label: getScopeDisplayName(scope) || scope
                                    }))

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
                                                        initialSelected={selectedPermissions[`${selectedMcpForDeploy.packageId}-${serviceName}`] || []}
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
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>

                        {deploymentState.status === 'error' && (
                            <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                                <p className="text-sm text-red-600 mb-2">{deploymentState.error}</p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setDeploymentState({ status: 'idle' })
                                        handleDeployMcpPackage()
                                    }}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Create Your Workflow</h3>
                            <p className="text-sm text-primary-300">Customize your workflow details</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="workflow-name">Workflow Name</Label>
                                <Input
                                    id="workflow-name"
                                    value={workflowName}
                                    onChange={(e) => setWorkflowName(e.target.value)}
                                    placeholder="Enter workflow name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="workflow-description">Workflow Description</Label>
                                <Input
                                    id="workflow-description"
                                    value={workflowDescription}
                                    onChange={(e) => setWorkflowDescription(e.target.value)}
                                    placeholder="Enter workflow description"
                                />
                            </div>
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
                    <DialogTitle className="text-primary-400 font-normal text-sm">Clone Template</DialogTitle>
                </DialogHeader>

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
                                {currentStep === '2.1' || currentStep === '2.2' ? 'Back to Packages' : 'Previous'}
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
                                onClick={handleDeployMcpPackage}
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
                                        Deploy Package
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
                        ) : (
                            <Button
                                type="submit"
                                disabled={createWorkflowFromTemplate.isPending || !validateCurrentStep()}
                                className="flex items-center gap-2 bg-primary-800 hover:bg-primary-900 text-white"
                            >
                                {createWorkflowFromTemplate.isPending ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create Workflow
                                        <ChevronRight size={16} />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}