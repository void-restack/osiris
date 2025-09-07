import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StepIndicator } from "./components";
import { Step1McpSelection, Step2AuthDeploy, Step3KnowledgeBases } from "./steps";
import type { WorkflowStepBuilderData, WorkflowBuilderStep } from "./types";

interface WorkflowStepBuilderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave?: (data: WorkflowStepBuilderData) => void;
}

const TOTAL_STEPS = 3; // Now implementing 3 steps

export function WorkflowStepBuilderDialog({
    open,
    onOpenChange,
    onSave
}: WorkflowStepBuilderDialogProps) {
    const [currentStep, setCurrentStep] = useState<WorkflowBuilderStep>(1);
    const [stepValid, setStepValid] = useState(false);

    // Form data state
    const [data, setData] = useState<WorkflowStepBuilderData>({
        name: "",
        description: "",
        selectedMcps: [],
        deploymentIds: [],
        mcpDeployments: {},
        selectedConnections: {},
        knowledgeBaseIds: [],
    });

    // Update form data
    const updateData = useCallback((updates: Partial<WorkflowStepBuilderData>) => {
        setData(prev => ({ ...prev, ...updates }));
    }, []);

    // Step navigation
    const handleNext = () => {
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => (prev + 1) as WorkflowBuilderStep);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => (prev - 1) as WorkflowBuilderStep);
        }
    };

    const handleClose = () => {
        // Reset state when closing
        setCurrentStep(1);
        setStepValid(false);
        setData({
            name: "",
            description: "",
            selectedMcps: [],
            deploymentIds: [],
            mcpDeployments: {},
            selectedConnections: {},
            knowledgeBaseIds: [],
        });
        onOpenChange(false);
    };

    const handleSave = () => {
        if (onSave) {
            onSave(data);
        }
        handleClose();
    };

    // Render current step component
    const renderCurrentStep = () => {
        const stepProps = {
            data,
            updateData,
            isValid: stepValid,
            setIsValid: setStepValid,
        };

        switch (currentStep) {
            case 1:
                return <Step1McpSelection {...stepProps} />;
            case 2:
                return <Step2AuthDeploy {...stepProps} />;
            case 3:
                return <Step3KnowledgeBases {...stepProps} />;
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle>Add Workflow Step</DialogTitle>
                        <Button variant="ghost" size="sm" onClick={handleClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex-shrink-0">
                    <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto px-2 py-2">
                    <div className="max-h-full">
                        {renderCurrentStep()}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="flex-shrink-0 flex items-center justify-between pt-6 border-t">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Previous
                        </Button>
                    </div>

                    <div className="text-sm text-gray-500">
                        Step {currentStep} of {TOTAL_STEPS}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>

                        {currentStep < TOTAL_STEPS ? (
                            <Button
                                onClick={handleNext}
                                disabled={!stepValid}
                                className="flex items-center gap-2"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSave}
                                disabled={!stepValid}
                            >
                                Save Step
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
