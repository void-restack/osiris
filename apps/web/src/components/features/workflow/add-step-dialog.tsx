import { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type WorkflowStep } from "./workflow-step-item"

interface AddStepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddStep: (step: Omit<WorkflowStep, 'id' | 'sequence'>) => Promise<void>
    insertIndex: number
    nextStepName?: string
    prevStepName?: string
}

export function AddStepDialog({ open, onOpenChange, onAddStep, insertIndex, nextStepName, prevStepName }: AddStepDialogProps) {
    const [name, setName] = useState("")
    const [prompt, setPrompt] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !prompt.trim()) return
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            await onAddStep({
                name: name.trim(),
                description: name.trim(), // Use name as description for UI display
                mcpProvider: "API MCP", // Default UI display value
                prompt: prompt.trim(),
                deploymentType: "automatic", // Default UI display value
            })

            // Reset form and close dialog only on success
            resetForm()
            onOpenChange(false)
        } catch (error) {
            // Error handling is done in parent component
            console.error('Failed to add step:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setName("")
        setPrompt("")
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
                            placeholder="Enter step name (e.g., 'Send Email', 'Process Data')..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                        <p className="text-xs text-gray-500">
                            Give this step a clear, descriptive name
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prompt">What should this step do?</Label>
                        <Textarea
                            id="prompt"
                            placeholder="Describe what you want this step to accomplish..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-gray-500">
                            Be specific about what action this step should perform
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={!name.trim() || !prompt.trim() || isSubmitting}
                            className="w-full bg-primary-800 hover:bg-primary-900 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding step...
                                </>
                            ) : (
                                'Add step'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
