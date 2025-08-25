import { useTour } from '@reactour/tour';
import { useLocalStorage } from 'usehooks-ts';
import { useEffect } from 'react';

export function useAppTour() {
    const { setIsOpen, setCurrentStep, isOpen } = useTour();
    const [hasSeenTour, setHasSeenTour] = useLocalStorage('osiris-tour-completed', false);

    const startTour = () => {
        setCurrentStep(0);
        setIsOpen(true);
    };

    const completeTour = () => {
        setHasSeenTour(true);
        setIsOpen(false);
    };

    const resetTour = () => {
        setHasSeenTour(false);
    };

    const shouldShowTour = !hasSeenTour;

    // Auto-start tour for first-time users
    useEffect(() => {
        if (shouldShowTour && !isOpen) {
            // Small delay to ensure the page is fully loaded
            const timer = setTimeout(() => {
                startTour();
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [shouldShowTour, isOpen, startTour]);

    return {
        startTour,
        completeTour,
        resetTour,
        shouldShowTour,
        isOpen,
    };
}