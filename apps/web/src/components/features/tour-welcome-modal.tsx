import { useEffect } from 'react';
import { useAppTour } from '@/hooks/use-tour';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function TourWelcomeModal() {
    const { shouldShowTour, startTour, completeTour, resetTour } = useAppTour();

    useEffect(() => {
        const handleStartTour = () => {
            startTour();
        };

        const handleSkipTour = () => {
            completeTour();
        };

        window.addEventListener('start-tour', handleStartTour);
        window.addEventListener('skip-tour', handleSkipTour);

        return () => {
            window.removeEventListener('start-tour', handleStartTour);
            window.removeEventListener('skip-tour', handleSkipTour);
        };
    }, [startTour, completeTour]);

    return (
        <Dialog open={shouldShowTour} onOpenChange={() => completeTour()}>
            <DialogContent className="sm:max-w-md tour-welcome">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Welcome to Osiris!</DialogTitle>
                    <DialogDescription className="text-base">
                        Build and connect powerful AI agents to the world. Take a 1-minute tour or dive in directly.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 pt-4">
                    <Button onClick={startTour} className="flex-1">
                        Start Tour
                    </Button>
                    <Button variant="outline" onClick={completeTour} className="flex-1">
                        Skip
                    </Button>
                </div>
                <div className="flex justify-center pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetTour}
                        className="text-xs text-gray-500 hover:text-gray-700"
                    >
                        Reset Tour (for testing)
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}