import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowBuilderStep } from "../types";

interface StepIndicatorProps {
    currentStep: WorkflowBuilderStep;
    totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
    const steps = [
        { number: 1, title: "Select Tools", description: "Choose MCPs and set basic info" },
        { number: 2, title: "Deploy & Auth", description: "Configure authentication and deploy" },
        { number: 3, title: "Knowledge Base", description: "Add knowledge bases (optional)" },
    ].slice(0, totalSteps);

    return (
        <div className="flex items-center justify-between w-full px-4 py-6">
            {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                    {/* Step Circle */}
                    <div className="flex items-center">
                        <div
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                                currentStep > step.number
                                    ? "bg-green-500 border-green-500 text-white"
                                    : currentStep === step.number
                                        ? "bg-blue-500 border-blue-500 text-white"
                                        : "bg-white border-gray-300 text-gray-500"
                            )}
                        >
                            {currentStep > step.number ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <span className="text-sm font-semibold">{step.number}</span>
                            )}
                        </div>

                        {/* Step Info */}
                        <div className="ml-3 min-w-0">
                            <p
                                className={cn(
                                    "text-sm font-medium",
                                    currentStep >= step.number ? "text-gray-900" : "text-gray-500"
                                )}
                            >
                                {step.title}
                            </p>
                            <p className="text-xs text-gray-500 hidden sm:block">
                                {step.description}
                            </p>
                        </div>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                        <div
                            className={cn(
                                "flex-1 h-0.5 mx-4 transition-colors",
                                currentStep > step.number ? "bg-green-500" : "bg-gray-300"
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
