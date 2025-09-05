import { useState } from "react"
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

// Mock data for initial steps
const initialSteps: WorkflowStep[] = [
    {
        id: "step-1",
        name: "Step 1",
        description: "XYZ",
        sequence: 0,
        mcpProvider: "Content Summarizer MCP",
        prompt: "Analyze the startup's problem statement.",
        deploymentType: "automatic"
    },
    {
        id: "step-2",
        name: "Step 2",
        description: "Collect Company Information",
        sequence: 1,
        mcpProvider: "Content Summarizer MCP",
        prompt: "Highlight the startup's product/service as the direct solution to the defined problem.",
        deploymentType: "automatic"
    },
    {
        id: "step-3",
        name: "Step 3",
        description: "Summarize Problem Statement",
        sequence: 2,
        mcpProvider: "Content Summarizer MCP",
        prompt: "Create a comprehensive summary of the problem.",
        deploymentType: "manual"
    },
    {
        id: "step-4",
        name: "Step 4",
        description: "ABC",
        sequence: 3,
        mcpProvider: "Content Summarizer MCP",
        prompt: "Process the collected data.",
        deploymentType: "automatic"
    },
    {
        id: "step-5",
        name: "Step 5",
        description: "XYZ",
        sequence: 4,
        mcpProvider: "Content Summarizer MCP",
        prompt: "Generate final output.",
        deploymentType: "manual"
    },
]

export function WorkflowStepsContainer() {
    const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [insertIndex, setInsertIndex] = useState(0)
    const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setSteps((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)

                const newItems = arrayMove(items, oldIndex, newIndex)

                // Update sequence numbers
                return newItems.map((item, index) => ({
                    ...item,
                    sequence: index,
                }))
            })
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

    const handleDeleteStep = (stepId: string) => {
        setSteps((prevSteps) => {
            const newSteps = prevSteps.filter(step => step.id !== stepId)

            // Update sequence numbers for remaining steps
            return newSteps.map((step, index) => ({
                ...step,
                sequence: index,
            }))
        })
    }

    const handleAddStepSubmit = (newStepData: Omit<WorkflowStep, 'id' | 'sequence'>) => {
        const newStep: WorkflowStep = {
            ...newStepData,
            id: `step-${Date.now()}`,
            sequence: insertIndex,
        }

        setSteps((prevSteps) => {
            const newSteps = [...prevSteps]
            newSteps.splice(insertIndex, 0, newStep)

            // Update sequence numbers for all steps
            return newSteps.map((step, index) => ({
                ...step,
                sequence: index,
            }))
        })
    }

    const getStepContextInfo = (insertAtIndex: number) => {
        const prevStep = insertAtIndex > 0 ? steps[insertAtIndex - 1] : null
        const nextStep = insertAtIndex < steps.length ? steps[insertAtIndex] : null

        return {
            prevStepName: prevStep ? `${prevStep.name} - ${prevStep.description}` : undefined,
            nextStepName: nextStep ? `${nextStep.name} - ${nextStep.description}` : undefined
        }
    }

    const handleEditStepSubmit = (editedStep: WorkflowStep) => {
        setSteps((prevSteps) =>
            prevSteps.map(step =>
                step.id === editedStep.id ? editedStep : step
            )
        )
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
                            {/* Add step button before first step */}
                            {index === 0 && (
                                <AddStepButton
                                    onAddStep={handleAddStep}
                                    insertIndex={0}
                                />
                            )}

                            {/* Step item */}
                            <SortableStepItem
                                step={step}
                                index={index}
                                onEdit={handleEditStep}
                                onDelete={handleDeleteStep}
                            />

                            {/* Add step button after each step */}
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
