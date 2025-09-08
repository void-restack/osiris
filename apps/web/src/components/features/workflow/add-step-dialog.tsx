import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { PencilLine, Plus, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { packageQueries, knowledgeQueries } from "@/lib/queries"
import { type WorkflowStep } from "./workflow-step-item"

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

const TOTAL_STEPS = 3

export function AddStepDialog({ open, onOpenChange, onAddStep, insertIndex, nextStepName, prevStepName }: AddStepDialogProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [mcpCommandOpen, setMcpCommandOpen] = useState(false)
    const [kbCommandOpen, setKbCommandOpen] = useState(false)
    const [mcpSearchQuery, setMcpSearchQuery] = useState("")
    const [kbSearchQuery, setKbSearchQuery] = useState("")
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState<StepData>({
        name: "",
        prompt: "",
        mcpProviders: [],
        knowledgeBases: [],
    })

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
            default:
                return false
        }
    }

    const handleNext = () => {
        if (validateCurrentStep() && currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
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
                        Deployment Step
                    </div>
                )
            case 3:
                return (
                    <></>
                    // <div className="space-y-6">
                    //     <div className="space-y-2">
                    //         <Label className="text-sm text-primary-400">MCP Providers *</Label>
                    //         <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                    //             <PopoverTrigger asChild>
                    //                 <Button
                    //                     variant="outline"
                    //                     role="combobox"
                    //                     aria-expanded={commandOpen}
                    //                     className="justify-between w-full"
                    //                 >
                    //                     Select MCP providers...
                    //                 </Button>
                    //             </PopoverTrigger>
                    //             <PopoverContent className="w-full p-0">
                    //                 <Command>
                    //                     <CommandInput
                    //                         placeholder="Search MCP providers..."
                    //                         value={searchQuery}
                    //                         onValueChange={setSearchQuery}
                    //                     />
                    //                     <CommandList>
                    //                         <CommandEmpty>No providers found.</CommandEmpty>
                    //                         {(searchQuery.length >= 2 ? searchResults : popularPackages)?.length > 0 && (
                    //                             <CommandGroup heading={searchQuery.length >= 2 ? "Search Results" : "Popular Providers"}>
                    //                                 {(searchQuery.length >= 2 ? searchResults : popularPackages)?.map((provider: { id: string, name: string }) => (
                    //                                     <CommandItem
                    //                                         key={provider.id}
                    //                                         onSelect={() => addMcpProvider(provider)}
                    //                                         className="cursor-pointer"
                    //                                     >
                    //                                         {provider.name}
                    //                                     </CommandItem>
                    //                                 ))}
                    //                             </CommandGroup>
                    //                         )}
                    //                     </CommandList>
                    //                 </Command>
                    //             </PopoverContent>
                    //         </Popover>

                    //         {/* Selected providers badges */}
                    //         {formData.mcpProviders.length > 0 && (
                    //             <div className="flex flex-wrap gap-2 mt-2">
                    //                 {formData.mcpProviders.map((provider) => (
                    //                     <Badge key={provider.id} variant="secondary" className="flex items-center gap-1">
                    //                         {provider.name}
                    //                         <Button
                    //                             type="button"
                    //                             variant="ghost"
                    //                             size="sm"
                    //                             className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    //                             onClick={() => removeMcpProvider(provider.id)}
                    //                         >
                    //                             <X size={12} />
                    //                         </Button>
                    //                     </Badge>
                    //                 ))}
                    //             </div>
                    //         )}
                    //     </div>
                    // </div>
                )
            default:
                return null
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-4 max-w-md">
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {renderStepContent()}

                    <div className="flex gap-3 pt-4">
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrevious}
                                className="flex items-center gap-2"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="ml-auto"
                        >
                            Cancel
                        </Button>

                        {currentStep < TOTAL_STEPS ? (
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
                                disabled={!formData.name.trim() || !formData.prompt.trim()}
                                className="bg-primary-800 hover:bg-primary-900 text-white"
                            >
                                Add step
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
