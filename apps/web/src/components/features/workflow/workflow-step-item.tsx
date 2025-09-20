import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { GripVertical, MoreHorizontal, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

export interface WorkflowStep {
    id: string
    name: string
    description?: string
    sequence: number
    mcpProvider: string
    prompt: string
    deploymentType?: "automatic" | "manual"
    // Full objects for future use
    mcpProviders?: Array<any>
    knowledgeBases?: Array<any>
    // Deployment IDs for API
    deploymentIds?: string[]
    // Package IDs for templates
    packageIds?: string[]
    // Knowledge base IDs for templates
    knowledgeBaseIds?: string[]
}

interface SortableStepItemProps {
    step: WorkflowStep
    index: number
    onEdit?: (step: WorkflowStep) => void
    onDelete?: (stepId: string) => void
    className?: string
}

export function SortableStepItem({ step, index, onEdit, onDelete, className }: SortableStepItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: step.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn('flex items-center gap-4 p-4 bg-white', isDragging ? 'opacity-50' : '', className)}
        >
            {/* Drag Handle */}
            {(onEdit || onDelete) && (
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-primary-300 hover:text-primary-500"
                >
                    <GripVertical size={20} />
                </div>
            )}

            {/* Step Number and Content */}
            <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 text-primary-600">
                    <span className="text-sm font-medium underline decoration-primary-400 underline-offset-2">Step {index + 1}</span>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-primary-800 decoration-primary-400 underline-offset-2 truncate">
                            {step.name}
                        </h3>
                        {/* <span className="text-primary-400">-</span> */}
                        {/* <span className="text-primary-600 truncate max-w-md">{step.description}</span> */}
                    </div>
                </div>
            </div>

            {/* Edit Button and More Options */}
            {(onEdit || onDelete) && (
                <div className="flex items-center gap-2">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onEdit(step)}
                        >
                            <Edit size={16} />
                        </Button>
                    )}

                    {(onEdit || onDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(step)}>
                                        Edit Step
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => onDelete(step.id)}
                                    >
                                        Delete Step
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            )}
        </div>
    )
}
