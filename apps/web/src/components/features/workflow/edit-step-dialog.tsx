import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Edit } from "lucide-react"
import { type WorkflowStep } from "./workflow-step-item"

// Mock MCP providers - you can replace this with actual data from your API
const mcpProviders = [
    "Content Summarizer MCP",
    "Data Processor MCP",
    "Analytics MCP",
    "Email Generator MCP"
]

interface EditStepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onEditStep: (step: WorkflowStep) => void
    step: WorkflowStep | null
}

export function EditStepDialog({ open, onOpenChange, onEditStep, step }: EditStepDialogProps) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [mcpProvider, setMcpProvider] = useState("")
    const [prompt, setPrompt] = useState("")
    const [deploymentType, setDeploymentType] = useState<"automatic" | "manual">("automatic")

    // Update form when step changes
    useEffect(() => {
        if (step) {
            setName(step.name)
            setDescription(step.description)
            setMcpProvider(step.mcpProvider)
            setPrompt(step.prompt)
            setDeploymentType(step.deploymentType)
        } else {
            setName("")
            setDescription("")
            setMcpProvider("")
            setPrompt("")
            setDeploymentType("automatic")
        }
    }, [step])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !description.trim() || !mcpProvider || !prompt.trim() || !step) return

        onEditStep({
            ...step,
            name: name.trim(),
            description: description.trim(),
            mcpProvider,
            prompt: prompt.trim(),
            deploymentType,
        })

        onOpenChange(false)
    }

    const handleCancel = () => {
        if (step) {
            setName(step.name)
            setDescription(step.description)
            setMcpProvider(step.mcpProvider)
            setPrompt(step.prompt)
            setDeploymentType(step.deploymentType)
        }
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit step</DialogTitle>
                </DialogHeader>

                {/* Currently editing indicator */}
                <div className="py-4">
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <Edit size={14} />
                        Currently editing
                    </div>

                    {step && (
                        <div className="text-sm text-primary-600 mt-2">
                            {step.name} - {step.description}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="edit-step-name">Step Name</Label>
                        <Input
                            id="edit-step-name"
                            placeholder="Enter step name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-step-description">Description</Label>
                        <Input
                            id="edit-step-description"
                            placeholder="Enter step description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-mcp-provider">MCP to trigger</Label>
                        <Select value={mcpProvider} onValueChange={setMcpProvider}>
                            <SelectTrigger id="edit-mcp-provider">
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
                        <Label htmlFor="edit-prompt">Prompt</Label>
                        <Textarea
                            id="edit-prompt"
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
                                <RadioGroupItem value="automatic" id="edit-automatic" />
                                <Label htmlFor="edit-automatic" className="cursor-pointer">
                                    Auto deployment
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="manual" id="edit-manual" />
                                <Label htmlFor="edit-manual" className="cursor-pointer">
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
                            Save changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
