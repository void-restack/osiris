import { MultiStepWorkflowDialog } from "./multi-step-workflow-dialog"
import { type WorkflowStep } from "./workflow-step-item"
import type { WorkflowStepFormData } from "./types"

interface AddStepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddStep: (step: Omit<WorkflowStep, 'id' | 'sequence'>) => Promise<void>
    insertIndex: number
    nextStepName?: string
    prevStepName?: string
}

export function AddStepDialog({
    open,
    onOpenChange,
    onAddStep,
    insertIndex,
    nextStepName,
    prevStepName
}: AddStepDialogProps) {

    const handleSave = async (data: WorkflowStepFormData) => {
        // Transform multi-step form data to WorkflowStep format
        const workflowStep: Omit<WorkflowStep, 'id' | 'sequence'> = {
            name: data.name,
            description: data.name, // Use name as description for UI display
            mcpProvider: data.selectedMcps.length > 0
                ? `${data.selectedMcps.length} tool(s)`
                : "No tools",
            prompt: data.prompt,
            deploymentType: "automatic",
            deploymentId: data.deploymentIds,
            knowledgeBaseIds: data.knowledgeBaseIds,
        };

        await onAddStep(workflowStep);
    };

    return (
        <MultiStepWorkflowDialog
            open={open}
            onOpenChange={onOpenChange}
            onSave={handleSave}
            title="Add Workflow Step"
            initialData={{
                name: '',
                prompt: '',
                selectedMcps: [],
                mcpDeployments: {},
                selectedKnowledgeBases: [],
                deploymentIds: [],
                knowledgeBaseIds: []
            }}
        />
    );
}
