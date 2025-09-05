import { X, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppStore, type WorkflowData } from "@/lib/store";
import { Separator } from "./ui/separator";
import { useUpdateWorkflowMutation } from "@/lib/mutations";
import { WorkflowTriggers } from "./features/workflow/workflow-triggers";

export function WorkflowEditSidebar() {
    const {
        selectedWorkflow,
        closeWorkflowEditSidebar,
        isWorkflowEditSidebarOpen,
        updateSelectedWorkflow
    } = useAppStore();

    const updateWorkflowMutation = useUpdateWorkflowMutation();

    const [isPublic, setIsPublic] = useState(true);
    const [timeBasedTrigger, setTimeBasedTrigger] = useState<WorkflowData['timeBasedTrigger']>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedWorkflow) {
            setIsPublic(selectedWorkflow.isPublic);
            setTimeBasedTrigger(selectedWorkflow.timeBasedTrigger);
        }
    }, [selectedWorkflow]);

    const hasChanges = useMemo(() => {
        if (!selectedWorkflow) return false;

        const publicChanged = isPublic !== selectedWorkflow.isPublic;

        let triggerChanged = false;
        if (timeBasedTrigger !== selectedWorkflow.timeBasedTrigger) {
            if (!timeBasedTrigger && selectedWorkflow.timeBasedTrigger) {
                triggerChanged = true;
            } else if (timeBasedTrigger && !selectedWorkflow.timeBasedTrigger) {
                triggerChanged = true;
            } else if (timeBasedTrigger && selectedWorkflow.timeBasedTrigger) {
                triggerChanged =
                    timeBasedTrigger.rrule !== selectedWorkflow.timeBasedTrigger.rrule ||
                    timeBasedTrigger.startTime !== selectedWorkflow.timeBasedTrigger.startTime;
            }
        }

        return publicChanged || triggerChanged;
    }, [selectedWorkflow, isPublic, timeBasedTrigger]);

    const handleTriggerUpdate = useCallback((newTrigger: WorkflowData['timeBasedTrigger']) => {
        setTimeBasedTrigger(newTrigger);
    }, []);

    const handleSave = async () => {
        if (!selectedWorkflow || !hasChanges) return;

        setIsLoading(true);
        try {
            const updateData = {
                workflowId: selectedWorkflow.id,
                isPublic,
                timeBasedTrigger: timeBasedTrigger || undefined,
            };

            const updatedWorkflow = await updateWorkflowMutation.mutateAsync(updateData);

            updateSelectedWorkflow(updatedWorkflow);
        } catch (error) {
            console.error("Failed to update workflow:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update workflow");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isWorkflowEditSidebarOpen || !selectedWorkflow) {
        return null;
    }

    return (
        <div>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 relative">
                <div className="flex flex-col">
                    <h2 className="text-lg font-medium text-gray-900">Workflow</h2>
                    <p className="text-sm text-gray-500">{selectedWorkflow.title}</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeWorkflowEditSidebar}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-80px)] overflow-y-auto">
                {/* Privacy settings */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Privacy settings</h3>
                    <RadioGroup
                        value={isPublic ? "public" : "private"}
                        onValueChange={(value) => setIsPublic(value === "public")}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="public" id="public" />
                            <Label htmlFor="public" className="cursor-pointer">
                                Public
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="private" id="private" />
                            <Label htmlFor="private" className="cursor-pointer">
                                Private
                            </Label>
                        </div>
                    </RadioGroup>
                    <p className="text-xs text-gray-500">
                        {isPublic ? "Others can discover and use this workflow." : "Only you can access this workflow."}
                    </p>
                </div>

                <Separator />

                {/* Triggers */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Triggers</h3>
                    <WorkflowTriggers
                        workflowData={selectedWorkflow}
                        onUpdate={handleTriggerUpdate}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 absolute bottom-0 left-0 right-0 mx-6">
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isLoading}
                        className="flex-1"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={closeWorkflowEditSidebar}
                        className="flex-1"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
