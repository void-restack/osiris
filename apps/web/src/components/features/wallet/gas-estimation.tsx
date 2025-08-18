import { useMemo, useEffect, useState } from "react";
import { useEstimateGas, useGasPrice, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";
import { AlertTriangle } from "lucide-react";

interface GasEstimationProps {
  connectedAddress?: string;
  targetAddress?: string;
  amount: string;
  selectedChain: string;
  selectedToken: string;
  isConnected: boolean;
  show: boolean;
  onGasEstimated?: (gasData: {
    estimatedGas: bigint | null;
    gasPrice: bigint | null;
    totalFee: bigint | null;
    hasSufficientBalance: boolean;
  }) => void;
}

const getTokenDetails = (chain: string, token: string) => {
  const tokenDetails: Record<string, Record<string, any>> = {
    ethereum: {
      eth: { address: "0x0000000000000000000000000000000000000000", decimals: 18, isNative: true },
      usdc: { address: "0xA0b86a33E6e6b9b4f8d7A4f13fD6F86A2F0e0a34", decimals: 6, isNative: false },
      usdt: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, isNative: false }
    },
    polygon: {
      matic: { address: "0x0000000000000000000000000000000000000000", decimals: 18, isNative: true },
      usdc: { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6, isNative: false },
      usdt: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6, isNative: false }
    },
    arbitrum: {
      eth: { address: "0x0000000000000000000000000000000000000000", decimals: 18, isNative: true },
      usdc: { address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 6, isNative: false },
      usdt: { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, isNative: false }
    },
    base: {
      eth: { address: "0x0000000000000000000000000000000000000000", decimals: 18, isNative: true },
      usdc: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, isNative: false }
    }
  };

  return tokenDetails[chain]?.[token] || null;
};

export function GasEstimation({
  connectedAddress,
  targetAddress,
  amount,
  selectedChain,
  selectedToken,
  isConnected,
  show,
  onGasEstimated
}: GasEstimationProps) {
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);

  // Get token details
  const tokenDetails = useMemo(() => {
    return getTokenDetails(selectedChain, selectedToken);
  }, [selectedChain, selectedToken]);

  // Get balance for the selected token
  const { data: tokenBalance } = useBalance({
    address: connectedAddress as `0x${string}`,
    token: tokenDetails?.isNative ? undefined : (tokenDetails?.address as `0x${string}`),
  });

  // Get gas price
  const { data: currentGasPrice } = useGasPrice();

  // Check if user has sufficient balance
  const sufficientBalance = useMemo(() => {
    if (!tokenBalance || !amount || parseFloat(amount) <= 0) return false;

    try {
      const requiredAmount = tokenDetails?.isNative
        ? parseEther(amount)
        : BigInt(parseFloat(amount) * (10 ** (tokenDetails?.decimals || 18)));

      return tokenBalance.value >= requiredAmount;
    } catch {
      return false;
    }
  }, [tokenBalance, amount, tokenDetails]);

  // Create transaction object for gas estimation (only if sufficient balance)
  const transactionForEstimation = useMemo(() => {
    if (!connectedAddress || !targetAddress || !amount || !isConnected || !show || !sufficientBalance || !tokenDetails) {
      return null;
    }

    if (tokenDetails.isNative) {
      return {
        account: connectedAddress as `0x${string}`,
        to: targetAddress as `0x${string}`,
        value: parseEther(amount),
      };
    } else {
      // For ERC20 tokens, we'd need to estimate a contract call
      return {
        account: connectedAddress as `0x${string}`,
        to: tokenDetails.address as `0x${string}`,
        value: 0n,
      };
    }
  }, [connectedAddress, targetAddress, amount, isConnected, show, sufficientBalance, tokenDetails]);

  const { data: estimatedGasData } = useEstimateGas(transactionForEstimation || undefined);

  // Update state when values change
  useEffect(() => {
    if (estimatedGasData) {
      setEstimatedGas(estimatedGasData);
    }
  }, [estimatedGasData]);

  useEffect(() => {
    if (currentGasPrice) {
      setGasPrice(currentGasPrice);
    }
  }, [currentGasPrice]);

  useEffect(() => {
    setHasSufficientBalance(sufficientBalance);
  }, [sufficientBalance]);

  // Call onGasEstimated when data changes
  useEffect(() => {
    const totalFee = estimatedGas && gasPrice ? estimatedGas * gasPrice : null;
    onGasEstimated?.({
      estimatedGas,
      gasPrice,
      totalFee,
      hasSufficientBalance
    });
  }, [estimatedGas, gasPrice, hasSufficientBalance, onGasEstimated]);

  if (!show || !isConnected) return null;

  const totalFee = estimatedGas && gasPrice ? estimatedGas * gasPrice : null;

  return (
    <div className="space-y-3">
      {/* Insufficient Balance Warning */}
      {!sufficientBalance && amount && parseFloat(amount) > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
          <AlertTriangle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-amber-800">Insufficient Balance</div>
            <div className="text-xs text-amber-600 mt-1">
              You don't have enough {selectedToken.toUpperCase()} to complete this transaction.
              {tokenBalance && (
                <span className="block mt-1">
                  Available: {parseFloat(formatEther(tokenBalance.value)).toFixed(6)} {tokenBalance.symbol}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gas Fee Estimation */}
      {sufficientBalance && (estimatedGas || gasPrice) && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
          <div className="text-sm font-medium text-blue-800 mb-2">Network Fees</div>
          {estimatedGas && (
            <div className="flex justify-between">
              <span className="text-sm text-blue-600">Estimated Gas:</span>
              <span className="text-sm font-medium text-blue-800">{estimatedGas.toString()} units</span>
            </div>
          )}
          {gasPrice && (
            <div className="flex justify-between">
              <span className="text-sm text-blue-600">Gas Price:</span>
              <span className="text-sm font-medium text-blue-800">{formatEther(gasPrice)} ETH</span>
            </div>
          )}
          {totalFee && (
            <div className="flex justify-between border-t border-blue-200 pt-2">
              <span className="text-sm font-medium text-blue-600">Total Network Fee:</span>
              <span className="text-sm font-bold text-blue-800">
                ~{formatEther(totalFee)} ETH
              </span>
            </div>
          )}
          <p className="text-xs text-blue-500 mt-1">
            Network fees are paid to validators and may vary based on network congestion
          </p>
        </div>
      )}
    </div>
  );
}
