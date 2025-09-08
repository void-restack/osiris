import { useState, useEffect } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable"

import { SortableStepItem, type WorkflowStep } from "./workflow-step-item"
import { AddStepButton } from "./add-step-button"
import { AddStepDialog } from "./add-step-dialog"
import { EditStepDialog } from "./edit-step-dialog"
import { type WorkflowData } from "@/lib/store"
import { useUpdateWorkflowMutation } from "@/lib/mutations"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

const convertApiStepsToWorkflowSteps = (apiSteps: WorkflowData['workflow']): WorkflowStep[] => {
    return apiSteps.map((step, index) => ({
        id: `step-${index + 1}`,
        name: step.name,
        description: step.prompt,
        sequence: index,
        mcpProvider: step.deploymentId.length > 0 ? `Deployment ${step.deploymentId[0].slice(-8)}` : "Unknown MCP",
        prompt: step.prompt,
        deploymentType: "automatic" as const,
        // Preserve deployment IDs from API
        deploymentIds: step.deploymentId,
    }));
};

const convertWorkflowStepsToApi = (steps: WorkflowStep[], originalWorkflow?: WorkflowData['workflow']): WorkflowData['workflow'] => {
    return steps.map((step) => {
        // Find the original step using multiple criteria for better matching
        const originalStep = originalWorkflow?.find(origStep => {
            // First try to match by deployment IDs (most reliable)
            if (step.deploymentIds && step.deploymentIds.length > 0 && origStep.deploymentId.length > 0) {
                const stepDeployments = step.deploymentIds.sort().join(',')
                const origDeployments = origStep.deploymentId.sort().join(',')
                if (stepDeployments === origDeployments) {
                    return true
                }
            }

            // Fallback to name + prompt matching
            return origStep.name === step.name && origStep.prompt === step.prompt
        });

        return {
            name: step.name,
            prompt: step.prompt,
            deploymentId: step.deploymentIds && step.deploymentIds.length > 0 ? step.deploymentIds : (originalStep?.deploymentId || [""]),
            knowledgeBaseIds: originalStep?.knowledgeBaseIds || [],
        };
    });
};

interface WorkflowStepsContainerProps {
    workflowData?: WorkflowData;
}

export default function WorkflowStepsContainer({ workflowData }: WorkflowStepsContainerProps) {
    const updateWorkflowMutation = useUpdateWorkflowMutation();

    const initialWorkflowSteps = workflowData
        ? convertApiStepsToWorkflowSteps(workflowData.workflow)
        : [];

    const [steps, setSteps] = useState<WorkflowStep[]>(initialWorkflowSteps)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [insertIndex, setInsertIndex] = useState(0)
    const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null)

    useEffect(() => {
        if (workflowData) {
            const newSteps = convertApiStepsToWorkflowSteps(workflowData.workflow);
            setSteps(newSteps);
        }
    }, [workflowData]);

    const updateWorkflowSteps = async (newSteps: WorkflowStep[]) => {
        if (!workflowData) return;

        try {
            const updatedWorkflow = {
                workflowId: workflowData.id,
                title: workflowData.title,
                description: workflowData.description,
                imageUrl: workflowData.imageUrl,
                coverImageUrl: workflowData.coverImageUrl,
                workflow: convertWorkflowStepsToApi(newSteps, workflowData.workflow),
                isPublic: workflowData.isPublic,
                timeBasedTrigger: workflowData.timeBasedTrigger || undefined,
            };

            await updateWorkflowMutation.mutateAsync(updatedWorkflow);
        } catch (error) {
            console.error('Failed to update workflow:', error);
            toast.error('Failed to update workflow steps. Please try again.');
            throw error;
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const originalSteps = steps;

            const newSteps = (() => {
                const oldIndex = steps.findIndex((item) => item.id === active.id)
                const newIndex = steps.findIndex((item) => item.id === over.id)

                const newItems = arrayMove(steps, oldIndex, newIndex)

                return newItems.map((item, index) => ({
                    ...item,
                    sequence: index,
                }))
            })();

            setSteps(newSteps);
            try {
                await updateWorkflowSteps(newSteps);
            } catch (error) {
                setSteps(originalSteps);
            }
        }
    }

    const handleAddStep = (insertAtIndex: number) => {
        setInsertIndex(insertAtIndex)
        setIsAddDialogOpen(true)
    }

    const handleEditStep = (step: WorkflowStep) => {
        setEditingStep(step)
        setIsEditDialogOpen(true)
    }

    const handleDeleteStep = async (stepId: string) => {
        const originalSteps = steps;
        const newSteps = steps.filter(step => step.id !== stepId).map((step, index) => ({
            ...step,
            sequence: index,
        }));

        setSteps(newSteps);
        try {
            await updateWorkflowSteps(newSteps);
        } catch (error) {
            setSteps(originalSteps);
        }
    }

    const handleAddStepSubmit = async (newStepData: Omit<WorkflowStep, 'id' | 'sequence' | 'description' | 'deploymentType'>) => {
        const originalSteps = steps;

        const newStep: WorkflowStep = {
            ...newStepData,
            id: `step-${Date.now()}`,
            sequence: insertIndex,
        }

        const newSteps = [...steps];
        newSteps.splice(insertIndex, 0, newStep);

        const finalSteps = newSteps.map((step, index) => ({
            ...step,
            sequence: index,
        }));

        setSteps(finalSteps);

        try {
            await updateWorkflowSteps(finalSteps);
        } catch (error) {
            setSteps(originalSteps);
        }
    }

    const getStepContextInfo = (insertAtIndex: number) => {
        const prevStep = insertAtIndex > 0 ? steps[insertAtIndex - 1] : null
        const nextStep = insertAtIndex < steps.length ? steps[insertAtIndex] : null

        return {
            prevStepName: prevStep ? `${prevStep.name}` : undefined,
            nextStepName: nextStep ? `${nextStep.name}` : undefined
        }
    }

    const handleEditStepSubmit = async (editedStep: WorkflowStep) => {
        const originalSteps = steps;

        const newSteps = steps.map(step =>
            step.id === editedStep.id ? editedStep : step
        );

        setSteps(newSteps);

        try {
            await updateWorkflowSteps(newSteps);
        } catch (error) {
            setSteps(originalSteps);
        }
    }

    return (
        <ScrollArea className="space-y-2 mt-6 h-[calc(100vh-480px)]">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={steps} strategy={verticalListSortingStrategy}>
                    {steps.map((step, index) => (
                        <div key={step.id}>
                            {index === 0 && (
                                <AddStepButton
                                    onAddStep={handleAddStep}
                                    insertIndex={0}
                                />
                            )}
                            <div className="w-1 border-l-2 border-dashed border-l-primary-100 h-[40px] mx-auto" />
                            <SortableStepItem
                                step={step}
                                index={index}
                                onEdit={handleEditStep}
                                onDelete={handleDeleteStep}
                            />
                            <div className="w-1 border-l-2 border-dashed border-l-primary-100 h-[40px] mx-auto" />
                            <AddStepButton
                                onAddStep={handleAddStep}
                                insertIndex={index + 1}
                            />
                        </div>
                    ))}
                </SortableContext>
            </DndContext>

            <AddStepDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onAddStep={handleAddStepSubmit}
                insertIndex={insertIndex}
                {...getStepContextInfo(insertIndex)}
            />

            <EditStepDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onEditStep={handleEditStepSubmit}
                step={editingStep}
                workflowData={workflowData}
            />
        </ScrollArea>
    )
}