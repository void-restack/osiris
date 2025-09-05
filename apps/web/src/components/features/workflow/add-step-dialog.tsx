import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus } from "lucide-react"
import { type WorkflowStep } from "./workflow-step-item"

// Mock MCP providers - you can replace this with actual data from your API
const mcpProviders = [
    "Content Summarizer MCP",
    "Data Processor MCP",
    "Analytics MCP",
    "Email Generator MCP"
]

interface AddStepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddStep: (step: Omit<WorkflowStep, 'id' | 'sequence'>) => void
    insertIndex: number
    nextStepName?: string
    prevStepName?: string
}

export function AddStepDialog({ open, onOpenChange, onAddStep, insertIndex, nextStepName, prevStepName }: AddStepDialogProps) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [mcpProvider, setMcpProvider] = useState("")
    const [prompt, setPrompt] = useState("")
    const [deploymentType, setDeploymentType] = useState<"automatic" | "manual">("automatic")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !description.trim() || !mcpProvider || !prompt.trim()) return

        onAddStep({
            name: name.trim(),
            description: description.trim(),
            mcpProvider,
            prompt: prompt.trim(),
            deploymentType,
        })

        // Reset form
        resetForm()
        onOpenChange(false)
    }

    const resetForm = () => {
        setName("")
        setDescription("")
        setMcpProvider("")
        setPrompt("")
        setDeploymentType("automatic")
    }

    const handleCancel = () => {
        resetForm()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add step</DialogTitle>
                </DialogHeader>

                {/* Context indicator */}
                <div className="py-4">
                    {prevStepName && (
                        <div className="text-sm text-primary-600 mb-2">
                            {prevStepName}
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <Plus size={14} />
                        Step will be added here
                    </div>

                    {nextStepName && (
                        <div className="text-sm text-primary-600 mt-2">
                            {nextStepName}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="step-name">Step Name</Label>
                        <Input
                            id="step-name"
                            placeholder="Enter step name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="step-description">Description</Label>
                        <Input
                            id="step-description"
                            placeholder="Enter step description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mcp-provider">MCP to trigger</Label>
                        <Select value={mcpProvider} onValueChange={setMcpProvider}>
                            <SelectTrigger id="mcp-provider">
                                <SelectValue placeholder="Select MCP provider" />
                            </SelectTrigger>
                            <SelectContent>
                                {mcpProviders.map((provider) => (
                                    <SelectItem key={provider} value={provider}>
                                        {provider}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prompt">Prompt</Label>
                        <Textarea
                            id="prompt"
                            placeholder="Enter your prompt..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Deployment Type</Label>
                        <RadioGroup
                            value={deploymentType}
                            onValueChange={(value: "automatic" | "manual") => setDeploymentType(value)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="automatic" id="automatic" />
                                <Label htmlFor="automatic" className="cursor-pointer">
                                    Automatic deployment
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="manual" id="manual" />
                                <Label htmlFor="manual" className="cursor-pointer">
                                    Manual deployment
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={!name.trim() || !description.trim() || !mcpProvider || !prompt.trim()}
                            className="w-full bg-primary-800 hover:bg-primary-900 text-white"
                        >
                            Add step
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
