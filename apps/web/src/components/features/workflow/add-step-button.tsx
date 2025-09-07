import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface AddStepButtonProps {
    onAddStepWithBuilder: (insertIndex: number) => void
    insertIndex: number
}

export function AddStepButton({ onAddStepWithBuilder, insertIndex }: AddStepButtonProps) {
    return (
        <div className="flex justify-center py-4">
            <Button
                variant="outline"
                onClick={() => onAddStepWithBuilder(insertIndex)}
                className="flex items-center gap-2 text-primary-500 border-primary-200 hover:bg-primary-50 hover:border-primary-300"
            >
                <Plus size={16} />
                Add step
            </Button>
        </div>
    )
}
