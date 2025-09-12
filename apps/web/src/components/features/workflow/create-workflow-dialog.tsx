import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { useCreateWorkflowMutation } from "@/lib/mutations";
import { WorkflowTriggers } from "./workflow-triggers";
import { type WorkflowData } from "@/lib/store";

interface CreateWorkflowDialogProps {
    children?: React.ReactNode;
}

export function CreateWorkflowDialog({ children }: CreateWorkflowDialogProps) {
    const [open, setOpen] = useState(false);
    const [timeBasedTrigger, setTimeBasedTrigger] = useState<WorkflowData['timeBasedTrigger']>(null);
    const createWorkflowMutation = useCreateWorkflowMutation();

    const form = useForm({
        defaultValues: {
            title: "",
            description: "",
            imageUrl: "",
            coverImageUrl: "",
            isPublic: false,
            workflow: [
                {
                    name: "",
                    deploymentId: [],
                    knowledgeBaseIds: [],
                    prompt: "",
                },
            ],
        },
        onSubmit: async ({ value }) => {
            try {
                // Prepare the data object with all required fields
                const workflowData: any = {
                    title: value.title,
                    description: value.description,
                    imageUrl: value.imageUrl?.trim() || "",
                    coverImageUrl: value.coverImageUrl?.trim() || "",
                    isPublic: value.isPublic,
                    workflow: value.workflow.map(step => ({
                        name: step.name,
                        deploymentId: step.deploymentId,
                        knowledgeBaseIds: step.knowledgeBaseIds,
                        prompt: step.prompt,
                    })),
                    timeBasedTrigger: timeBasedTrigger || undefined,
                };

                await createWorkflowMutation.mutateAsync(workflowData);
                setOpen(false);
                form.reset();
                setTimeBasedTrigger(null);
            } catch (error) {
                console.error("Failed to create workflow:", error);
            }
        },
    });

    const addWorkflowStep = () => {
        form.setFieldValue("workflow", [
            ...form.getFieldValue("workflow"),
            {
                name: "",
                deploymentId: [],
                knowledgeBaseIds: [],
                prompt: "",
            },
        ]);
    };

    const removeWorkflowStep = (index: number) => {
        const currentWorkflow = form.getFieldValue("workflow");
        if (currentWorkflow.length > 1) {
            form.setFieldValue(
                "workflow",
                currentWorkflow.filter((_, i) => i !== index)
            );
        }
    };

    const handleTriggerUpdate = (newTrigger: WorkflowData['timeBasedTrigger']) => {
        setTimeBasedTrigger(newTrigger);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline2">
                        <Plus className="h-4 w-4" />
                        <span>Create Workflow</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Create New Workflow</DialogTitle>
                    <DialogDescription>
                        Create a new workflow by defining its steps and configuration.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-6"
                    >
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Basic Information</h3>

                            <form.Field
                                name="title"
                                validators={{
                                    onChange: ({ value }) =>
                                        !value ? "Title is required" : undefined,
                                }}
                            >
                                {(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>Title *</Label>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Enter workflow title"
                                        />
                                        {field.state.meta.errors && (
                                            <p className="text-sm text-red-600">{field.state.meta.errors[0]}</p>
                                        )}
                                    </div>
                                )}
                            </form.Field>

                            <form.Field
                                name="description"
                                validators={{
                                    onChange: ({ value }) =>
                                        !value ? "Description is required" : undefined,
                                }}
                            >
                                {(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>Description *</Label>
                                        <Textarea
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Describe what this workflow does"
                                            rows={3}
                                        />
                                        {field.state.meta.errors && (
                                            <p className="text-sm text-red-600">{field.state.meta.errors[0]}</p>
                                        )}
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="imageUrl">
                                {(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>Image URL</Label>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="https://example.com/image.png"
                                        />
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="coverImageUrl">
                                {(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>Cover Image URL</Label>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="https://example.com/cover.png"
                                        />
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="isPublic">
                                {(field) => (
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id={field.name}
                                            checked={field.state.value}
                                            onCheckedChange={field.handleChange}
                                        />
                                        <Label htmlFor={field.name}>Make this workflow public</Label>
                                    </div>
                                )}
                            </form.Field>
                        </div>

                        {/* Workflow Steps */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Workflow Steps</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addWorkflowStep}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Step
                                </Button>
                            </div>

                            <form.Field name="workflow">
                                {(field) => (
                                    <div className="space-y-4">
                                        {field.state.value.map((step, index) => (
                                            <div key={index} className="border rounded-lg p-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium">Step {index + 1}</h4>
                                                    {field.state.value.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeWorkflowStep(index)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>

                                                <form.Field name={`workflow[${index}].name`}>
                                                    {(stepField) => (
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`step-${index}-name`}>Step Name *</Label>
                                                            <Input
                                                                id={`step-${index}-name`}
                                                                value={stepField.state.value}
                                                                onBlur={stepField.handleBlur}
                                                                onChange={(e) => stepField.handleChange(e.target.value)}
                                                                placeholder="Enter step name"
                                                            />
                                                            {stepField.state.meta.errors && (
                                                                <p className="text-sm text-red-600">{stepField.state.meta.errors[0]}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </form.Field>

                                                <form.Field name={`workflow[${index}].prompt`}>
                                                    {(stepField) => (
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`step-${index}-prompt`}>Prompt *</Label>
                                                            <Textarea
                                                                id={`step-${index}-prompt`}
                                                                value={stepField.state.value}
                                                                onBlur={stepField.handleBlur}
                                                                onChange={(e) => stepField.handleChange(e.target.value)}
                                                                placeholder="Enter the prompt for this step"
                                                                rows={3}
                                                            />
                                                            {stepField.state.meta.errors && (
                                                                <p className="text-sm text-red-600">{stepField.state.meta.errors[0]}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </form.Field>

                                                {/* TODO: Add deployment and knowledge base selection */}
                                                <div className="text-sm text-gray-500">
                                                    Deployment and Knowledge Base selection will be implemented in the next iteration.
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </form.Field>
                        </div>

                        {/* Triggers Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Triggers</h3>
                            <WorkflowTriggers
                                onUpdate={handleTriggerUpdate}
                            />
                        </div>
                    </form>
                </ScrollArea>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={() => form.handleSubmit()}
                        disabled={createWorkflowMutation.isPending}
                    >
                        {createWorkflowMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Workflow
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}