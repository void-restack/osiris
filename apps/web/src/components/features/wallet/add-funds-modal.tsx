import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { creditQueries } from "@/lib/queries";
import { toast } from "sonner";
import { UseCardDeposit } from "./use-card-deposit";

interface AddFundsModalProps {
    children: React.ReactNode;
    triggerClassName?: string;
}

export function AddFundsModal({ children, triggerClassName }: AddFundsModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const handleSuccess = () => {
        // Refresh credits data after successful payment
        queryClient.invalidateQueries({ queryKey: creditQueries.balanceOptions().queryKey });
        toast.success("Funds added successfully!");

        // Close modal after short delay
        setTimeout(() => {
            setIsOpen(false);
        }, 1500);
    };

    const handleError = (error: string) => {
        console.error("Payment error:", error);
        // Modal stays open so user can try again
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild className={triggerClassName}>
                {children}
            </DialogTrigger>

            <DialogContent
                className="sm:max-w-[400px] w-full p-4"
                showCloseButton={false}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Add Funds</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="size-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 w-full">
                    <UseCardDeposit
                        onSuccess={handleSuccess}
                        onError={handleError}
                        showAmountInput={true}
                        className=""
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}