import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

    const mergedInitialData = useMemo(() => ({
        ...INITIAL_DATA,
        ...initialData
    }), [initialData]);

    const [formState, formActions] = useMultiStepForm<WorkflowStepFormData>({
        totalSteps: STEPS.length,
        initialData: mergedInitialData,
        onComplete: async (data) => {
            setIsSaving(true);
            try {
                await onSave(data);
                onOpenChange(false);
                formActions.reset();
            } catch (error) {
                console.error('Failed to save workflow step:', error);
            } finally {
                setIsSaving(false);
            }
        }
    });

    const handleClose = () => {
        onOpenChange(false);
        formActions.reset();
    };

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
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl">{title}</DialogTitle>

                    {/* Step Indicator */}
                    {/* <div className="flex items-center justify-between pt-2">
                        {STEPS.map((step, index) => {
                            const stepNumber = index + 1;
                            const isActive = stepNumber === formState.currentStep;
                            const isCompleted = stepNumber < formState.currentStep;

                            return (
                                <div
                                    key={stepNumber}
                                    className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <div
                                            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${isCompleted
                                                ? 'bg-green-500 text-white'
                                                : isActive
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                                        </div>
                                        <div className="ml-2 hidden sm:block">
                                            <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'
                                                }`}>
                                                {step.title}
                                            </p>
                                        </div>
                                    </div>

                                    {index < STEPS.length - 1 && (
                                        <div className="flex-1 mx-4 h-px bg-gray-200" />
                                    )}
                                </div>
                            );
                        })}
                    </div> */}
                </DialogHeader>

                {/* Step Content */}
                <div className="pb-6 min-h-[400px]">
                    {renderCurrentStep()}
                </div>

                {/* Footer */}
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
                            onClick={handleClose}
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
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
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
