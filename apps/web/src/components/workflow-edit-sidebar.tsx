import { X, Loader2, Edit2, Check, X as XIcon } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppStore, type WorkflowData } from "@/lib/store";
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
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    useEffect(() => {
        if (selectedWorkflow) {
            setIsPublic(selectedWorkflow.isPublic);
            setTimeBasedTrigger(selectedWorkflow.timeBasedTrigger);
            setEditedTitle(selectedWorkflow.title);
        }
    }, [selectedWorkflow]);

    const hasChanges = useMemo(() => {
        if (!selectedWorkflow) return false;

        const titleChanged = editedTitle !== selectedWorkflow.title;
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

        return titleChanged || publicChanged || triggerChanged;
    }, [selectedWorkflow, editedTitle, isPublic, timeBasedTrigger]);

    const handleTriggerUpdate = useCallback((newTrigger: WorkflowData['timeBasedTrigger']) => {
        setTimeBasedTrigger(newTrigger);
    }, []);

    const handleEditTitle = () => {
        setIsEditingTitle(true);
    };

    const handleSaveTitle = () => {
        setIsEditingTitle(false);
    };

    const handleCancelEdit = () => {
        setEditedTitle(selectedWorkflow?.title || '');
        setIsEditingTitle(false);
    };

    const handleSave = async () => {
        if (!selectedWorkflow || !hasChanges) return;

        setIsLoading(true);
        try {
            const updateData = {
                workflowId: selectedWorkflow.id,
                title: editedTitle,
                isPublic,
                timeBasedTrigger: timeBasedTrigger || undefined,
            };

            const updatedWorkflow = await updateWorkflowMutation.mutateAsync(updateData);

            updateSelectedWorkflow(updatedWorkflow);
            setIsEditingTitle(false);
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
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-primary-100 relative group">
                <div className="flex flex-col flex-1 mr-4">
                    <h2 className="text-lg font-semibold text-primary-800">Workflow</h2>
                    {isEditingTitle ? (
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSaveTitle();
                                    } else if (e.key === 'Escape') {
                                        handleCancelEdit();
                                    }
                                }}
                                className="text-sm h-8"
                                placeholder="Enter workflow name"
                                autoFocus
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveTitle}
                                disabled={!editedTitle.trim()}
                                className="h-8 w-8 p-0"
                            >
                                <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 p-0"
                            >
                                <XIcon className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-primary-400">{selectedWorkflow.title}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleEditTitle}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Edit2 className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
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

            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                    {/* Privacy settings */}
                    <div className="space-y-[6px]">
                        <Label className="text-[13px] text-primary-400">Privacy Settings</Label>
                        <RadioGroup
                            value={isPublic ? "public" : "private"}
                            onValueChange={(value) => setIsPublic(value === "public")}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="public" id="public" />
                                <Label htmlFor="public" className="cursor-pointer text-sm text-primary-600">
                                    Public
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="private" id="private" />
                                <Label htmlFor="private" className="cursor-pointer text-sm text-primary-600">
                                    Private
                                </Label>
                            </div>
                        </RadioGroup>
                        <p className="text-xs text-primary-400">
                            {isPublic ? "Others can discover and use this workflow." : "Only you can access this workflow."}
                        </p>
                    </div>

                    <div className="border-t border-t-primary-100 border-dashed" />

                    {/* Triggers */}
                    <div className="space-y-[6px]">
                        <Label className="text-[13px] text-primary-400">Triggers</Label>
                        <WorkflowTriggers
                            workflowData={selectedWorkflow}
                            onUpdate={handleTriggerUpdate}
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-primary-100 space-y-3">
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={closeWorkflowEditSidebar}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
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
                </div>
            </div>
        </div>
    );
}
