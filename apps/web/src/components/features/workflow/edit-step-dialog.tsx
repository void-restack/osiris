import { useState, useEffect } from "react"
import { Edit, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type WorkflowStep } from "./workflow-step-item"

interface EditStepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onEditStep: (step: WorkflowStep) => Promise<void>
    step: WorkflowStep | null
}

export function EditStepDialog({ open, onOpenChange, onEditStep, step }: EditStepDialogProps) {
    const [name, setName] = useState("")
    const [prompt, setPrompt] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Update form when step changes
    useEffect(() => {
        if (step) {
            setName(step.name)
            setPrompt(step.prompt)
        } else {
            setName("")
            setPrompt("")
        }
    }, [step])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !prompt.trim() || !step) return
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            await onEditStep({
                ...step,
                name: name.trim(),
                description: name.trim(), // Use name as description for UI display
                mcpProvider: "API MCP", // Default UI display value
                prompt: prompt.trim(),
                deploymentType: "automatic", // Default UI display value
            })

            // Close dialog only on success
            onOpenChange(false)
        } catch (error) {
            // Error handling is done in parent component
            console.error('Failed to edit step:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = () => {
        if (step) {
            setName(step.name)
            setPrompt(step.prompt)
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
                        <p className="text-xs text-gray-500">
                            Update the name for this step
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-prompt">What should this step do?</Label>
                        <Textarea
                            id="edit-prompt"
                            placeholder="Describe what you want this step to accomplish..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-gray-500">
                            Update the action this step should perform
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
                                    Saving changes...
                                </>
                            ) : (
                                'Save changes'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
