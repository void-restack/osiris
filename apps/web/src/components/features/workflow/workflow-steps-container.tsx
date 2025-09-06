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

const initialSteps: WorkflowStep[] = [
    {
        id: "step-1",
        name: "Step 1",
        description: "XYZ",
        sequence: 0,
        mcpProvider: "Content Summarizer MCP",
        prompt: "Analyze the startup's problem statement.",
        deploymentType: "automatic",
        deploymentId: [],
        knowledgeBaseIds: []
    },
    {
        id: "step-2",
        name: "Step 2",
        description: "Collect Company Information",
        sequence: 1,
        mcpProvider: "Content Summarizer MCP",
        prompt: "Highlight the startup's product/service as the direct solution to the defined problem.",
        deploymentType: "automatic",
        deploymentId: [],
        knowledgeBaseIds: []
    },
    {
        id: "step-3",
        name: "Step 3",
        description: "Summarize Problem Statement",
        sequence: 2,
        mcpProvider: "Content Summarizer MCP",
        prompt: "Create a comprehensive summary of the problem.",
        deploymentType: "manual",
        deploymentId: [],
        knowledgeBaseIds: []
    },
    {
        id: "step-4",
        name: "Step 4",
        description: "ABC",
        sequence: 3,
        mcpProvider: "Content Summarizer MCP",
        prompt: "Process the collected data.",
        deploymentType: "automatic",
        deploymentId: [],
        knowledgeBaseIds: []
    },
    {
        id: "step-5",
        name: "Step 5",
        description: "XYZ",
        sequence: 4,
        mcpProvider: "Content Summarizer MCP",
        prompt: "Generate final output.",
        deploymentType: "manual",
        deploymentId: [],
        knowledgeBaseIds: []
    },
]

const convertApiStepsToWorkflowSteps = (apiSteps: WorkflowData['workflow']): WorkflowStep[] => {
    return apiSteps.map((step, index) => ({
        id: `step-${index + 1}`,
        name: step.name,
        description: step.prompt.slice(0, 50) + (step.prompt.length > 50 ? '...' : ''),
        sequence: index,
        mcpProvider: step.deploymentId.length > 0 ? `Deployment ${step.deploymentId[0].slice(-8)}` : "Unknown MCP",
        prompt: step.prompt,
        deploymentType: "automatic" as const,
        deploymentId: (step.deploymentId || []).filter((id): id is string => id != null && id !== ''),
        knowledgeBaseIds: (step.knowledgeBaseIds || []).filter((id): id is string => id != null && id !== ''),
    }));
};

const convertWorkflowStepsToApi = (steps: WorkflowStep[], originalWorkflow?: WorkflowData['workflow']): WorkflowData['workflow'] => {
    return steps.map((step) => ({
        name: step.name,
        prompt: step.prompt,
        deploymentId: (step.deploymentId || []).filter((id): id is string => id != null && id !== ''),
        knowledgeBaseIds: (step.knowledgeBaseIds || []).filter((id): id is string => id != null && id !== ''),
    }));
};

interface WorkflowStepsContainerProps {
    workflowData?: WorkflowData;
}

export function WorkflowStepsContainer({ workflowData }: WorkflowStepsContainerProps) {
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

    // OAuth handling is now done via popup windows - no need for dialog restoration

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
            throw error; // Re-throw to handle optimistic updates rollback
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

    const handleAddStepSubmit = async (newStepData: Omit<WorkflowStep, 'id' | 'sequence'>) => {
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
            prevStepName: prevStep ? `${prevStep.name} - ${prevStep.description}` : undefined,
            nextStepName: nextStep ? `${nextStep.name} - ${nextStep.description}` : undefined
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
        <div className="space-y-2">
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

                            <SortableStepItem
                                step={step}
                                index={index}
                                onEdit={handleEditStep}
                                onDelete={handleDeleteStep}
                            />

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
            />
        </div>
    )
}
