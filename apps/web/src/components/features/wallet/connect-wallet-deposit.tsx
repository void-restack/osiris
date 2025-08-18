import { useState, useCallback, useEffect } from "react";
import { useAccount, useDisconnect, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { ConnectKitButton } from "connectkit";
import { Loader2, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GasEstimation } from "./gas-estimation";
import { toast } from "sonner";

interface ConnectWalletDepositProps {
    supportedChainKeys: string[];
    selectedChain: string;
    onChainChange: (chain: string) => void;
    selectedToken: string;
    onTokenChange: (token: string) => void;
    amount: string;
    onAmountChange: (amount: string) => void;
    targetAddress: string;
    onTransactionSuccess?: (txHash: string) => void;
    onTransactionError?: (error: string) => void;
}

// Chain icons mapping
const getChainIcon = (chainKey: string): string => {
    const chainIcons: Record<string, string> = {
        ethereum: "/ethereum.svg",
        polygon: "/polygon.svg",
        arbitrum: "/arb.png",
        base: "/base.svg",
        solana: "/solana.svg"
    };
    return chainIcons[chainKey] || "";
};

// Token icons mapping
const getTokenIcon = (tokenSymbol: string): string => {
    const tokenIcons: Record<string, string> = {
        eth: "/ethereum.svg",
        matic: "/polygon.svg",
        usdc: "/credit.svg",
        usdt: "/credit.svg",
        sol: "/solana.svg"
    };
    return tokenIcons[tokenSymbol.toLowerCase()] || "";
};

// Token details
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

export function ConnectWalletDeposit({
    supportedChainKeys,
    selectedChain,
    onChainChange,
    selectedToken,
    onTokenChange,
    amount,
    onAmountChange,
    targetAddress,
    onTransactionSuccess,
    onTransactionError
}: ConnectWalletDepositProps) {
    const [gasData, setGasData] = useState<{
        estimatedGas: bigint | null;
        gasPrice: bigint | null;
        totalFee: bigint | null;
        hasSufficientBalance: boolean;
    }>({
        estimatedGas: null,
        gasPrice: null,
        totalFee: null,
        hasSufficientBalance: false
    });

    const { address: connectedAddress, isConnected } = useAccount();
    const { disconnect } = useDisconnect();

    const {
        sendTransaction,
        isPending: isSendingTransaction,
        data: txHash,
        error: txError
    } = useSendTransaction();

    const {
        isSuccess: isTransactionSuccess
    } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    const getTopTokensForChain = useCallback((selectedChain: string) => {
        const topTokens: Record<string, any[]> = {
            ethereum: [
                { value: 'eth', label: 'Ethereum (ETH)', symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', isNative: true },
                { value: 'usdc', label: 'USD Coin (USDC)', symbol: 'USDC', address: '0xA0b86a33E6e6b9b4f8d7A4f13fD6F86A2F0e0a34', isNative: false },
                { value: 'usdt', label: 'Tether (USDT)', symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', isNative: false }
            ],
            polygon: [
                { value: 'matic', label: 'Polygon (MATIC)', symbol: 'MATIC', address: '0x0000000000000000000000000000000000000000', isNative: true },
                { value: 'usdc', label: 'USD Coin (USDC)', symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', isNative: false },
                { value: 'usdt', label: 'Tether (USDT)', symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', isNative: false }
            ],
            arbitrum: [
                { value: 'eth', label: 'Ethereum (ETH)', symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', isNative: true },
                { value: 'usdc', label: 'USD Coin (USDC)', symbol: 'USDC', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', isNative: false },
                { value: 'usdt', label: 'Tether (USDT)', symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', isNative: false }
            ],
            base: [
                { value: 'eth', label: 'Ethereum (ETH)', symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', isNative: true },
                { value: 'usdc', label: 'USD Coin (USDC)', symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', isNative: false }
            ]
        };

        return topTokens[selectedChain] || [];
    }, []);

    const CustomConnectButton = () => (
        <ConnectKitButton.Custom>
            {({ isConnected, isConnecting, show }) => {
                return (
                    <div className="text-center flex flex-col items-center my-8">
                        <div className="w-full flex flex-col items-center">
                            <div className="flex items-center w-full justify-center mb-6">
                                <div className="size-14 rounded-md bg-blue-300 shadow-xl" />
                                <div className="size-14 rounded-md bg-purple-300 -ml-3 shadow-xl" />
                                <div className="size-14 rounded-md bg-red-300 -ml-3 shadow-xl" />
                                <div className="size-14 rounded-md bg-green-300 -ml-3 shadow-xl" />
                            </div>
                            {isConnected ? (
                                <div className="flex items-start flex-col justify-between border border-primary-100 rounded-lg py-2 border-dashed">
                                    <span className="px-2 text-sm text-primary-400 border-b border-b-primary-100 pb-1 border-dashed w-full">Connected Wallet</span>
                                    <div className="px-2 flex items-center justify-between w-full pt-1">
                                        <p className="text-sm font-mono max-w-[200px] truncate">{connectedAddress}</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => disconnect()}
                                        >
                                            <Unlink className="text-danger-500 size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="text-xl text-pretty">Connect a wallet to add funds</div>
                                    <div className="flex flex-col items-start space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Icon name="user-shield" className="size-4" />
                                            <h4 className="text-sm">Secure Connection</h4>
                                        </div>
                                        <p className="text-sm text-primary-400">Transfers cannot be made without your approval.</p>
                                    </div>

                                    <div className="flex flex-col items-start space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Icon name="shield-check" className="size-4" />
                                            <h4 className="text-sm">Your Keys, Your Control</h4>
                                        </div>
                                        <p className="text-sm text-primary-400">We never have access to your private keys.</p>
                                    </div>

                                    <Button
                                        onClick={show}
                                        disabled={isConnecting}
                                        className="inset-shadow-search-btn w-full font-light"
                                    >
                                        {isConnecting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            'Connect Wallet'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }}
        </ConnectKitButton.Custom>
    );

    const handleSendTransaction = async () => {
        if (!connectedAddress || !targetAddress || !amount || !gasData.hasSufficientBalance) {
            const error = 'Missing required information or insufficient balance';
            toast.error(error);
            onTransactionError?.(error);
            return;
        }

        try {
            const tokenDetails = getTokenDetails(selectedChain, selectedToken);
            if (!tokenDetails) {
                const error = 'Token details not found';
                toast.error(error);
                onTransactionError?.(error);
                return;
            }

            let transaction;

            if (tokenDetails.isNative) {
                transaction = {
                    to: targetAddress as `0x${string}`,
                    value: parseEther(amount),
                };
            } else {
                const error = 'ERC20 transfers require contract interaction - please use native tokens for now';
                toast.error(error);
                onTransactionError?.(error);
                return;
            }

            await sendTransaction(transaction);

        } catch (error) {
            console.error('Transaction failed:', error);
            const errorMessage = 'Transaction failed. Please try again.';
            toast.error(errorMessage);
            onTransactionError?.(errorMessage);
        }
    };

    // Handle transaction status changes
    useEffect(() => {
        if (txHash) {
            toast.success('Transaction submitted! Waiting for confirmation...');
        }
    }, [txHash]);

    useEffect(() => {
        if (isTransactionSuccess && txHash) {
            toast.success('Transaction confirmed!');
            onTransactionSuccess?.(txHash);
        }
    }, [isTransactionSuccess, txHash, onTransactionSuccess]);

    useEffect(() => {
        if (txError) {
            const errorMessage = 'Transaction failed: ' + txError.message;
            toast.error(errorMessage);
            onTransactionError?.(errorMessage);
        }
    }, [txError, onTransactionError]);

    // Reset token when chain changes
    useEffect(() => {
        const tokens = getTopTokensForChain(selectedChain);
        if (tokens.length > 0 && !tokens.find(t => t.value === selectedToken)) {
            onTokenChange(tokens[0].value);
        }
    }, [selectedChain, selectedToken, getTopTokensForChain, onTokenChange]);

    if (!isConnected) {
        return <CustomConnectButton />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start flex-col justify-between border border-primary-100 rounded-lg py-2 border-dashed">
                <span className="px-2 text-sm text-primary-400 border-b border-b-primary-100 pb-1 border-dashed w-full">Connected Wallet</span>
                <div className="px-2 flex items-center justify-between w-full pt-1">
                    <p className="text-sm font-mono max-w-[200px] truncate">{connectedAddress}</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnect()}
                    >
                        <Unlink className="text-danger-500 size-4" />
                    </Button>
                </div>
            </div>

            <div>
                <Label htmlFor="chain" className="text-[13px] text-primary-400">Select Chain</Label>
                <Select value={selectedChain} onValueChange={onChainChange}>
                    <SelectTrigger className="mt-1 w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {supportedChainKeys.map((chainKey: string) => (
                            <SelectItem key={chainKey} value={chainKey}>
                                <div className="flex items-center gap-2">
                                    <Avatar className="size-5 rounded-full">
                                        <AvatarImage src={getChainIcon(chainKey)} alt={chainKey} />
                                        <AvatarFallback className="text-xs">
                                            {chainKey.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{chainKey.charAt(0).toUpperCase() + chainKey.slice(1)}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="token" className="text-[13px] text-primary-400">Select Token</Label>
                <Select value={selectedToken} onValueChange={onTokenChange}>
                    <SelectTrigger className="mt-1 w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {getTopTokensForChain(selectedChain).map((token: any) => (
                            <SelectItem key={token.value} value={token.value}>
                                <div className="flex items-center gap-2">
                                    <Avatar className="size-5 rounded-full">
                                        <AvatarImage src={getTokenIcon(token.symbol)} alt={token.symbol} />
                                        <AvatarFallback className="text-xs">
                                            {token.symbol.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{token.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="amount" className="text-[13px] text-primary-400">Enter Amount</Label>
                <div className="flex gap-2 mt-1">
                    <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => onAmountChange(e.target.value)}
                        className="flex-1"
                    />
                </div>
            </div>

            <GasEstimation
                connectedAddress={connectedAddress}
                targetAddress={targetAddress}
                amount={amount}
                selectedChain={selectedChain}
                selectedToken={selectedToken}
                isConnected={isConnected}
                show={true}
                onGasEstimated={setGasData}
            />

            <Button
                onClick={handleSendTransaction}
                disabled={!amount || parseFloat(amount) <= 0 || !gasData.hasSufficientBalance || isSendingTransaction}
                className="w-full"
            >
                {isSendingTransaction ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                    </>
                ) : (
                    'Send Transaction'
                )}
            </Button>
        </div>
    );
}