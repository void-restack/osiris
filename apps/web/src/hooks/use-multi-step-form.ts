import { useState, useCallback } from 'react';

export interface MultiStepFormState<T = any> {
    currentStep: number;
    totalSteps: number;
    data: T;
    isValid: boolean;
    canGoNext: boolean;
    canGoPrev: boolean;
}

export interface MultiStepFormActions<T = any> {
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;
    updateData: (updates: Partial<T>) => void;
    setValidation: (isValid: boolean) => void;
    reset: () => void;
}

export interface UseMultiStepFormOptions<T = any> {
    totalSteps: number;
    initialData: T;
    initialStep?: number;
    onStepChange?: (step: number) => void;
    onComplete?: (data: T) => void;
}

export function useMultiStepForm<T = any>({
    totalSteps,
    initialData,
    initialStep = 1,
    onStepChange,
    onComplete
}: UseMultiStepFormOptions<T>): [MultiStepFormState<T>, MultiStepFormActions<T>] {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [data, setData] = useState<T>(initialData);
    const [isValid, setIsValid] = useState(false);

    const canGoNext = currentStep < totalSteps && isValid;
    const canGoPrev = currentStep > 1;

    const nextStep = useCallback(() => {
        if (canGoNext) {
            const newStep = currentStep + 1;
            setCurrentStep(newStep);
            onStepChange?.(newStep);

            // Reset validation for new step
            setIsValid(false);

            // If this is the last step, trigger completion
            if (newStep === totalSteps) {
                onComplete?.(data);
            }
        }
    }, [currentStep, totalSteps, canGoNext, data, onStepChange, onComplete]);

    const prevStep = useCallback(() => {
        if (canGoPrev) {
            const newStep = currentStep - 1;
            setCurrentStep(newStep);
            onStepChange?.(newStep);
            setIsValid(true); // Previous steps were valid
        }
    }, [currentStep, canGoPrev, onStepChange]);

    const goToStep = useCallback((step: number) => {
        if (step >= 1 && step <= totalSteps) {
            setCurrentStep(step);
            onStepChange?.(step);
            setIsValid(step < currentStep); // Only validate if going backwards
        }
    }, [totalSteps, currentStep, onStepChange]);

    const updateData = useCallback((updates: Partial<T>) => {
        setData(prev => ({ ...prev, ...updates }));
    }, []);

    const setValidation = useCallback((valid: boolean) => {
        setIsValid(valid);
    }, []);

    const reset = useCallback(() => {
        setCurrentStep(1);
        setData(initialData);
        setIsValid(false);
    }, [initialData]);

    const state: MultiStepFormState<T> = {
        currentStep,
        totalSteps,
        data,
        isValid,
        canGoNext,
        canGoPrev
    };

    const actions: MultiStepFormActions<T> = {
        nextStep,
        prevStep,
        goToStep,
        updateData,
        setValidation,
        reset
    };

    return [state, actions];
}
