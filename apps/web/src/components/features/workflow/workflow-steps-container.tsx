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
import { type WorkflowData, type TemplateWorkflowData } from "@/lib/store"
import { useUpdateWorkflowMutation, useUpdateTemplateWorkflowMutation } from "@/lib/mutations"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const convertApiStepsToWorkflowSteps = (apiSteps: WorkflowData['workflow'] | TemplateWorkflowData['workflow'], isTemplate = false): WorkflowStep[] => {
    return apiSteps.map((step, index) => ({
        id: `step-${index + 1}`,
        name: step.name,
        description: step.prompt,
        sequence: index,
        mcpProvider: isTemplate
            ? ((step as TemplateWorkflowData['workflow'][0]).packageIds?.length > 0 ? `Package ${(step as TemplateWorkflowData['workflow'][0]).packageIds[0].slice(-8)}` : "No packages")
            : ((step as WorkflowData['workflow'][0]).deploymentId?.length > 0 ? `Deployment ${(step as WorkflowData['workflow'][0]).deploymentId[0].slice(-8)}` : "Unknown MCP"),
        prompt: step.prompt,
        deploymentType: "automatic" as const,
        deploymentIds: isTemplate ? [] : ((step as WorkflowData['workflow'][0]).deploymentId || []),
        packageIds: isTemplate ? ((step as TemplateWorkflowData['workflow'][0]).packageIds || []) : [],
        knowledgeBaseIds: step.knowledgeBaseIds || [],
    }));
};

const convertWorkflowStepsToApi = (steps: WorkflowStep[], originalWorkflow?: WorkflowData['workflow'] | TemplateWorkflowData['workflow'], isTemplate = false): WorkflowData['workflow'] | TemplateWorkflowData['workflow'] => {
    if (isTemplate) {
        return steps.map((step) => {
            const originalStep = (originalWorkflow as TemplateWorkflowData['workflow'])?.find(origStep => {
                const origStepTyped = origStep as TemplateWorkflowData['workflow'][0];
                if (step.packageIds && step.packageIds.length > 0 && origStepTyped.packageIds?.length > 0) {
                    const stepPackages = step.packageIds.sort().join(',')
                    const origPackages = origStepTyped.packageIds.sort().join(',')
                    if (stepPackages === origPackages) {
                        return true
                    }
                }
                return origStep.name === step.name && origStep.prompt === step.prompt
            });

            const originalStepTyped = originalStep as TemplateWorkflowData['workflow'][0];
            return {
                name: step.name,
                prompt: step.prompt,
                packageIds: step.packageIds && step.packageIds.length > 0 ? step.packageIds : (originalStepTyped?.packageIds || []),
                knowledgeBaseIds: step.knowledgeBaseIds && step.knowledgeBaseIds.length > 0 ? step.knowledgeBaseIds : (originalStepTyped?.knowledgeBaseIds || []),
            };
        }) as TemplateWorkflowData['workflow'];
    } else {
        return steps.map((step) => {
            const originalStep = (originalWorkflow as WorkflowData['workflow'])?.find(origStep => {
                const origStepTyped = origStep as WorkflowData['workflow'][0];
                if (step.deploymentIds && step.deploymentIds.length > 0 && origStepTyped.deploymentId?.length > 0) {
                    const stepDeployments = step.deploymentIds.sort().join(',')
                    const origDeployments = origStepTyped.deploymentId.sort().join(',')
                    if (stepDeployments === origDeployments) {
                        return true
                    }
                }
                return origStep.name === step.name && origStep.prompt === step.prompt
            });

            const originalStepTyped = originalStep as WorkflowData['workflow'][0];
            return {
                name: step.name,
                prompt: step.prompt,
                deploymentId: step.deploymentIds && step.deploymentIds.length > 0 ? step.deploymentIds : (originalStepTyped?.deploymentId || [""]),
                knowledgeBaseIds: originalStepTyped?.knowledgeBaseIds || [],
            };
        }) as WorkflowData['workflow'];
    }
};

interface WorkflowStepsContainerProps {
    workflowData?: WorkflowData | TemplateWorkflowData;
    isTemplate?: boolean;
    isOwner?: boolean;
}

export default function WorkflowStepsContainer({ workflowData, isTemplate = false, isOwner = true }: WorkflowStepsContainerProps) {
    const updateWorkflowMutation = useUpdateWorkflowMutation();
    const updateTemplateWorkflowMutation = useUpdateTemplateWorkflowMutation();

    const initialWorkflowSteps = workflowData
        ? convertApiStepsToWorkflowSteps(workflowData.workflow, isTemplate)
        : [];

    const [steps, setSteps] = useState<WorkflowStep[]>(initialWorkflowSteps)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [insertIndex, setInsertIndex] = useState(0)
    const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null)

    useEffect(() => {
        if (workflowData) {
            const newSteps = convertApiStepsToWorkflowSteps(workflowData.workflow, isTemplate);
            setSteps(newSteps);
        }
    }, [workflowData, isTemplate]);

    const updateWorkflowSteps = async (newSteps: WorkflowStep[]) => {
        if (!workflowData) return;

        try {
            if (isTemplate) {
                const updatedTemplate = {
                    templateId: workflowData.id,
                    title: workflowData.title,
                    description: workflowData.description,
                    imageUrl: workflowData.imageUrl,
                    coverImageUrl: workflowData.coverImageUrl,
                    workflow: convertWorkflowStepsToApi(newSteps, workflowData.workflow, isTemplate) as TemplateWorkflowData['workflow'],
                    isPublic: workflowData.isPublic,
                };

                await updateTemplateWorkflowMutation.mutateAsync(updatedTemplate);
            } else {
                const updatedWorkflow = {
                    workflowId: workflowData.id,
                    title: workflowData.title,
                    description: workflowData.description,
                    imageUrl: workflowData.imageUrl,
                    coverImageUrl: workflowData.coverImageUrl,
                    workflow: convertWorkflowStepsToApi(newSteps, workflowData.workflow, isTemplate) as WorkflowData['workflow'],
                    isPublic: workflowData.isPublic,
                    timeBasedTrigger: (workflowData as WorkflowData).timeBasedTrigger || undefined,
                };

                await updateWorkflowMutation.mutateAsync(updatedWorkflow);
            }
        } catch (error) {
            console.error('Failed to update workflow:', error);
            toast.error(`Failed to update ${isTemplate ? 'template' : 'workflow'} steps. Please try again.`);
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
        <div className=" mt-2 h-fit max-h-[calc(100vh-420px)] overflow-y-auto hidebar border rounded-lg">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={isOwner ? handleDragEnd : undefined}
            >
                <SortableContext items={steps} strategy={verticalListSortingStrategy}>
                    {steps.length === 0 ? (
                        isOwner && (
                            <AddStepButton
                                onAddStep={handleAddStep}
                                insertIndex={0}
                            />
                        )
                    ) : (
                        steps.map((step, index) => (
                            <div key={step.id}>
                                <div>
                                    <SortableStepItem
                                        step={step}
                                        index={index}
                                        onEdit={isOwner ? handleEditStep : undefined}
                                        onDelete={isOwner ? handleDeleteStep : undefined}
                                        className={cn(!isOwner ? "border-y border-y-primary-100" : "")}
                                    />
                                </div>
                                {isOwner && (
                                    <div className={cn("border-y py-4", index === steps.length - 1 ? "border-b-0" : "")}>
                                        <AddStepButton
                                            onAddStep={handleAddStep}
                                            insertIndex={index + 1}
                                        />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </SortableContext>
            </DndContext>

            <AddStepDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onAddStep={handleAddStepSubmit}
                insertIndex={insertIndex}
                isTemplate={isTemplate}
                {...getStepContextInfo(insertIndex)}
            />

            <EditStepDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onEditStep={handleEditStepSubmit}
                step={editingStep}
                workflowData={workflowData}
                isTemplate={isTemplate}
            />
        </div>
    )
}