import { MultiStepWorkflowDialog } from "./multi-step-workflow-dialog"
import { type WorkflowStep } from "./workflow-step-item"
import type { WorkflowStepFormData } from "./types"

interface EditStepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onEditStep: (step: WorkflowStep) => Promise<void>
    step: WorkflowStep | null
}

export function EditStepDialog({
    open,
    onOpenChange,
    onEditStep,
    step
}: EditStepDialogProps) {

    const handleSave = async (data: WorkflowStepFormData) => {
        if (!step) return;

        // Extract deployment IDs from mcpDeployments as backup
        const extractedDeploymentIds = Object.values(data.mcpDeployments)
            .filter(deployment => deployment.status === 'deployed' && deployment.deploymentId)
            .map(deployment => deployment.deploymentId);

        // Use data.deploymentIds if available, otherwise fall back to extracted IDs
        const finalDeploymentIds = data.deploymentIds.length > 0
            ? data.deploymentIds
            : extractedDeploymentIds;

        // Transform multi-step form data to WorkflowStep format
        const updatedStep: WorkflowStep = {
            ...step,
            name: data.name,
            description: data.name, // Use name as description for UI display
            mcpProvider: data.selectedMcps.length > 0
                ? `${data.selectedMcps.length} tool(s)`
                : "No tools",
            prompt: data.prompt,
            deploymentType: "automatic",
            deploymentId: finalDeploymentIds,
            knowledgeBaseIds: data.knowledgeBaseIds,
        };

        await onEditStep(updatedStep);
    };

    // Transform step data to form data for editing
    const getInitialData = (): Partial<WorkflowStepFormData> => {
        if (!step) return {};

        return {
            name: step.name,
            prompt: step.prompt,
            selectedMcps: [], // We'll need to reconstruct this from deploymentIds if needed
            mcpDeployments: {},
            selectedKnowledgeBases: [], // We'll need to reconstruct this from knowledgeBaseIds if needed
            deploymentIds: step.deploymentId || [],
            knowledgeBaseIds: step.knowledgeBaseIds || []
        };
    };

    return (
        <MultiStepWorkflowDialog
            open={open}
            onOpenChange={onOpenChange}
            onSave={handleSave}
            title="Edit Workflow Step"
            initialData={getInitialData()}
        />
    );
}
