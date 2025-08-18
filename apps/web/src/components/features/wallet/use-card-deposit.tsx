import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHelioDepositMutation } from "@/lib/mutations";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface UseCardDepositProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  amount?: string;
  onAmountChange?: (amount: string) => void;
  showAmountInput?: boolean;
  className?: string;
}

export function UseCardDeposit({
  onSuccess,
  onError,
  amount = "",
  onAmountChange,
  showAmountInput = true,
  className = ""
}: UseCardDepositProps) {
  const [fundAmount, setFundAmount] = useState(amount);
  const { user } = useAuth();
  const helioDepositMutation = useHelioDepositMutation();

  const handleAmountChange = (value: string) => {
    setFundAmount(value);
    onAmountChange?.(value);
  };

  const handlePayment = async () => {
    const amountToUse = showAmountInput ? fundAmount : amount;

    if (!amountToUse || parseFloat(amountToUse) <= 0) {
      const error = "Please enter a valid amount";
      toast.error(error);
      onError?.(error);
      return;
    }

    try {
      const response = await helioDepositMutation.mutateAsync({
        amount: amountToUse,
        paymentMethod: "helio_web3",
        userEmail: user?.email,
        chargeType: "paylink"
      });

      let paymentUrl = null;

      if (response?.paymentUrl) {
        paymentUrl = response.paymentUrl;
      } else if (response?.payLinkId) {
        paymentUrl = `https://app.hel.io/pay/${response.payLinkId}`;
      }

      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
        toast.success('Redirecting to payment page...');
        onSuccess?.();
      } else {
        const error = 'Payment initialization failed';
        toast.error(error);
        onError?.(error);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      const errorMessage = 'Payment failed. Please try again.';
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <div className={`flex items-center flex-col gap-y-4 ${className}`}>
      <div className="flex items-center justify-center">
        <img src="/helio.svg" alt="helio" className="size-14" />
        <img src="/logo.png" alt="osiris" className="-translate-x-4 size-16" />
      </div>
      <p className="text-xl">Powered by Helio</p>

      {showAmountInput && (
        <div className="w-full space-y-3">
          <Label htmlFor="card-amount" className="text-[13px] text-primary-400">
            Amount (USD)
          </Label>
          <Input
            id="card-amount"
            type="number"
            placeholder="0.00"
            value={fundAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full"
            min="0.01"
            step="0.01"
          />
          {/* <p className="text-xs text-primary-500 text-center">
            Enter the amount you want to add
          </p> */}
        </div>
      )}

      <Button
        onClick={handlePayment}
        disabled={helioDepositMutation.isPending}
        className="w-full"
      >
        {helioDepositMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Proceed to Payment'
        )}
      </Button>
    </div>
  );
}
