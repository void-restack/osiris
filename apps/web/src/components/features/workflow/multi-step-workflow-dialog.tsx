import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMultiStepForm } from '@/hooks/use-multi-step-form';
import { Step1McpSelection } from './steps/step-1-mcp-selection';
import { Step2McpDeployment } from './steps/step-2-mcp-deployment';
import { Step4ReviewAndSave } from './steps/step-4-review-and-save';
import type { MultiStepDialogProps, WorkflowStepFormData } from './types';

const STEPS = [
    { title: 'Step Info & Tools', description: 'Basic information and tool selection' },
    { title: 'Deploy Tools & Knowledge', description: 'Deploy selected tools and configure knowledge bases' },
    { title: 'Review & Save', description: 'Review and finalize your step' }
];

const INITIAL_DATA: WorkflowStepFormData = {
    name: '',
    prompt: '',
    selectedMcps: [],
    mcpDeployments: {},
    deploymentNames: {},
    selectedConnections: {},
    selectedPermissions: {},
    selectedKnowledgeBases: [],
    deploymentIds: [],
    knowledgeBaseIds: []
};

export function MultiStepWorkflowDialog({
    open,
    onOpenChange,
    onSave,
    initialData,
    title = 'Add Workflow Step'
}: MultiStepDialogProps) {
    const [isSaving, setIsSaving] = useState(false);

    const [formState, formActions] = useMultiStepForm<WorkflowStepFormData>({
        totalSteps: STEPS.length,
        initialData: { ...INITIAL_DATA, ...initialData },
        onComplete: async (formData) => {
            setIsSaving(true);
            try {
                await onSave(formData);
                onOpenChange(false);
                formActions.reset();
            } catch (error) {
                console.error('Failed to save workflow step:', error);
            } finally {
                setIsSaving(false);
            }
        }
    });

    const renderCurrentStep = () => {
        const stepProps = {
            data: formState.data,
            updateData: formActions.updateData,
            setValid: formActions.setValidation,
            onNext: formActions.nextStep,
            onPrev: formActions.prevStep
        };

        switch (formState.currentStep) {
            case 1:
                return <Step1McpSelection {...stepProps} />;
            case 2:
                return <Step2McpDeployment {...stepProps} />;
            case 3:
                return <Step4ReviewAndSave {...stepProps} />;
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl">{title}</DialogTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Step Content */}
                <div className="min-h-[400px] overflow-y-auto">
                    {renderCurrentStep()}
                </div>

                {/* Footer Actions */}
                <div className="border-t pt-4 flex justify-between">
                    <div>
                        {formState.currentStep > 1 && (
                            <Button
                                variant="outline"
                                onClick={formActions.prevStep}
                                disabled={!formState.canGoPrev || isSaving}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>

                        {formState.currentStep < formState.totalSteps ? (
                            <Button
                                onClick={formActions.nextStep}
                                disabled={!formState.canGoNext || isSaving}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                onClick={formActions.nextStep}
                                disabled={!formState.isValid || isSaving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Save Step
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
