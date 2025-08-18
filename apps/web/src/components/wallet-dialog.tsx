import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useDisconnect, useSendTransaction, useWaitForTransactionReceipt, useEstimateGas, useGasPrice } from "wagmi";
import { parseEther, parseUnits, formatEther } from "viem";
import { ConnectKitButton } from "connectkit";
import { Loader2, Copy, CopyIcon, MoveDownLeft, MoveDownRight, CheckCircle, X, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { hubQueries } from "@/lib/queries";
import { useHelioDepositMutation } from "@/lib/mutations";
import { Icon } from "./ui/icon";
import { ChainBadge } from "@/utils/chain-icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface WalletDialogProps {
  address: any;
  index: number;
  getChainDisplayName: (chainValue: string) => string;
  handleCopyAddress: (address: string) => void;
  userServiceConnectionId?: string;
  formData: any;
}

const getChainKeyFromValue = (chainValue: string): string | null => {
  const chainMap: Record<string, string> = {
    "evm:eip155:1": "ethereum",
    "evm:eip155:137": "polygon",
    "evm:eip155:8453": "base",
    "evm:eip155:42161": "arbitrum",
    "solana:mainnet-beta": "solana",
  };
  return chainMap[chainValue] || null;
};

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

export function WalletDialog({
  address,
  index,
  getChainDisplayName,
  handleCopyAddress,
  userServiceConnectionId,
  formData
}: WalletDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState(address.address);
  const [currentStep, setCurrentStep] = useState<'wallet' | 'amount' | 'review' | 'processing' | 'success'>('wallet');
  const [depositMethod, setDepositMethod] = useState<'transfer_crypto' | 'use_card' | 'connect_exchange'>('transfer_crypto');
  const [selectedChain, setSelectedChain] = useState('polygon');
  const [selectedToken, setSelectedToken] = useState('matic');
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);

  const { user } = useAuth();

  const { address: connectedAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const {
    sendTransaction,
    isPending: isSendingTransaction,
    data: txHash,
    error: txError
  } = useSendTransaction();

  const {
    isLoading: isWaitingForReceipt,
    isSuccess: isTransactionSuccess
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { data: currentGasPrice } = useGasPrice();

  const transactionForEstimation = useMemo(() => {
    if (!connectedAddress || !selectedWalletAddress || !fundAmount || !isConnected || depositMethod !== 'connect_exchange') {
      return null;
    }

    const tokenDetails = getTokenDetails(selectedChain, selectedToken);
    if (!tokenDetails) return null;

    if (tokenDetails.isNative) {
      return {
        account: connectedAddress,
        to: selectedWalletAddress as `0x${string}`,
        value: parseEther(fundAmount),
      };
    } else {
      // For ERC20 tokens, we'd need to estimate a contract call - useWriteContract
      return {
        account: connectedAddress,
        to: tokenDetails.address as `0x${string}`,
        value: 0n,
      };
    }
  }, [connectedAddress, selectedWalletAddress, fundAmount, selectedChain, selectedToken, isConnected, depositMethod]);

  const { data: estimatedGasData } = useEstimateGas(transactionForEstimation || undefined);

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

  const helioDepositMutation = useHelioDepositMutation();

  const { data: assetBalances, isLoading: isLoadingBalances } = useQuery(
    userServiceConnectionId
      ? hubQueries.assetBalancesOptions(userServiceConnectionId)
      : { queryKey: ['no-connection'], enabled: false }
  );

  const allWalletAddresses = assetBalances?.walletAddresses || [address.address];
  const walletBalance = assetBalances?.balances?.find(
    (balance: any) => balance.wallet.toLowerCase() === selectedWalletAddress.toLowerCase()
  );
  const totalBalance = walletBalance?.total || 0;

  const selectedAddress = formData?.addresses?.find(
    (addr: any) => addr.address.toLowerCase() === selectedWalletAddress.toLowerCase()
  ) || address;

  const supportedChainKeys = useMemo(() => {
    const configChains = selectedAddress.chains
      ?.map(getChainKeyFromValue)
      .filter(Boolean) || [];

    const balanceChains = walletBalance?.chains?.map((chainData: any) => chainData.chain.name) || [];

    return [...new Set([...configChains, ...balanceChains])];
  }, [selectedAddress.chains, walletBalance]);

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
                <>
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
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="text-xl text-pretty">Connect a wallet to add funds</div>
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon name="user-shield" className="size-4" />
                      <h4 className="text-sm">Some title here</h4>
                    </div>
                    <p className="text-sm text-primary-400">Transfers cannot be made without your approval.</p>
                  </div>

                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon name="shield-check" className="size-4" />
                      <h4 className="text-sm">Some title here</h4>
                    </div>
                    <p className="text-sm text-primary-400">Transfers cannot be made without your approval.</p>
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

  const handleAddFunds = () => {
    setCurrentStep('amount');
  };

  const handleBackToWallet = () => {
    setCurrentStep('wallet');
    setFundAmount('');
    setDepositMethod('transfer_crypto');
    setSelectedChain(supportedChainKeys[0] || 'polygon');
    setSelectedToken('matic');
    setCustomTokenAddress('');
    setTransactionHash('');
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Reset to initial state when closing
    setCurrentStep('wallet');
    setDepositMethod('transfer_crypto');
    setFundAmount('');
    setCustomTokenAddress('');
    setTransactionHash('');
  };

  const handleNextStep = () => {
    if (currentStep === 'amount') setCurrentStep('review');
    else if (currentStep === 'review') setCurrentStep('processing');
  };

  // Handle actual blockchain transaction
  const handleSendTransaction = async () => {
    if (!connectedAddress || !selectedWalletAddress || !fundAmount) {
      toast.error('Missing required information');
      return;
    }

    try {
      const tokenDetails = getTokenDetails(selectedChain, selectedToken);
      if (!tokenDetails) {
        toast.error('Token details not found');
        return;
      }

      let transaction;

      if (tokenDetails.isNative) {
        // Native token transfer
        transaction = {
          to: selectedWalletAddress as `0x${string}`,
          value: parseEther(fundAmount),
        };
      } else {
        // ERC20 token transfer - this would need a contract interaction
        // For now, we'll show an error since we need writeContract for ERC20s
        toast.error('ERC20 transfers require contract interaction - please use native tokens for now');
        return;
      }

      await sendTransaction(transaction);

    } catch (error) {
      console.error('Transaction failed:', error);
      toast.error('Transaction failed. Please try again.');
    }
  };

  const handleConfirmFunds = async () => {
    if (depositMethod === 'use_card') {
      try {
        const response = await helioDepositMutation.mutateAsync({
          amount: fundAmount,
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
          setTimeout(() => {
            handleCloseDialog();
          }, 2000);
        } else {
          toast.error('Payment initialization failed');
        }
      } catch (error) {
        console.error('Payment failed:', error);
        toast.error('Payment failed. Please try again.');
        return;
      }
    } else if (depositMethod === 'connect_exchange') {
      // Start the actual blockchain transaction
      setCurrentStep('processing');
      await handleSendTransaction();
    } else {
      // Transfer crypto - just show processing
      setCurrentStep('processing');
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep('success');
      }, 2000);
    }
  };

  // Handle transaction status changes
  useEffect(() => {
    if (txHash) {
      setTransactionHash(txHash);
      toast.success('Transaction submitted! Waiting for confirmation...');
    }
  }, [txHash]);

  useEffect(() => {
    if (isTransactionSuccess && currentStep === 'processing') {
      setCurrentStep('success');
      toast.success('Transaction confirmed!');
    }
  }, [isTransactionSuccess, currentStep]);

  useEffect(() => {
    if (txError) {
      toast.error('Transaction failed: ' + txError.message);
      setCurrentStep('review'); // Go back to review step
    }
  }, [txError]);

  // Reset chain selection when supportedChainKeys change
  useEffect(() => {
    if (!supportedChainKeys.includes(selectedChain) && supportedChainKeys.length > 0) {
      setSelectedChain(supportedChainKeys[0]);
    }
  }, [supportedChainKeys, selectedChain]);

  // Reset token when chain changes
  useEffect(() => {
    const tokens = getTopTokensForChain(selectedChain);
    if (tokens.length > 0 && !tokens.find(t => t.value === selectedToken)) {
      setSelectedToken(tokens[0].value);
    }
  }, [selectedChain, selectedToken, getTopTokensForChain]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div className="w-full rounded-lg p-3 bg-primary-25 cursor-pointer">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-primary-400">Wallet details</p>
              <div className="flex gap-1 flex-wrap">
                {address.chains.length > 0 && (
                  <>
                    {address.chains.slice(0, 2).map((chain: string, i: number) => (
                      <span
                        key={`${i}-${chain}`}
                        className={i !== 0 ? "-ml-4" : ""}
                        style={{ display: "inline-block" }}
                      >
                        <ChainBadge chainValue={chain} />
                      </span>
                    ))}
                    {address.chains.length > 2 && (
                      <span className="-ml-3 text-xs border border-primary-200 text-primary-800 bg-primary-100 px-2 flex items-center justify-center py-1 rounded-md font-mono">
                        +{address.chains.length - 2}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="font-mono text-sm text-primary-400 rounded flex items-center gap-3">
              <span className="text-lg text-primary-500">
                {isLoadingBalances ? (
                  <span className="inline-flex text-base items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <>${totalBalance.toFixed(2)}</>
                )}
              </span>
              <div className="size-1 rounded-full bg-primary-400" />
              <span>
                {address.address.slice(0, 6)}...{address.address.slice(-4)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopyAddress(address.address);
                }}
              >
                <Copy className="size-2 text-primary-400" />
              </Button>
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[400px] w-full p-6"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full">
                <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${selectedWalletAddress}`} alt="token" className="w-full h-full rounded-full" />
              </div>
              <div className="flex flex-col gap-1">
                {allWalletAddresses.length > 1 ? (
                  <Select value={selectedWalletAddress} onValueChange={setSelectedWalletAddress}>
                    <SelectTrigger className="w-fit h-fit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Wallet Addresses</SelectLabel>
                        {allWalletAddresses.map((walletAddr: string) => (
                          <SelectItem key={walletAddr} value={walletAddr}>
                            {walletAddr.slice(0, 8)}...{walletAddr.slice(-6)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : (
                  <div>
                    {allWalletAddresses.length === 1
                      ? allWalletAddresses[0].slice(0, 8) + '...' + allWalletAddresses[0].slice(-6)
                      : ''
                    }
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleCopyAddress(selectedWalletAddress)}>
                <CopyIcon className="size-4 text-primary-400" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCloseDialog}>
                <X className="size-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-col items-center justify-center">
          {currentStep === 'wallet' && (
            <>
              <div className="flex flex-col items-center justify-center pb-8">
                <h3 className="font-medium text-[13px] text-primary-300">Total Balance</h3>
                {isLoadingBalances ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-primary-400">Loading balances...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-medium text-primary-800">
                    {totalBalance.toFixed(2)} <span className="text-primary-300">USD</span>
                  </div>
                )}
              </div>

              <div className="flex w-full justify-center items-center gap-4">
                <Button
                  className="max-w-[168px] w-full px-2 py-0.5"
                  variant="outline"
                  icon={MoveDownLeft}
                  iconPlacement="left"
                  onClick={handleAddFunds}
                >
                  Add Funds
                </Button>
                <Button
                  className="max-w-[168px] w-full px-2 py-0.5"
                  variant="outline"
                  icon={MoveDownRight}
                  iconPlacement="right"
                >
                  Withdraw Funds
                </Button>
              </div>

              {/* Assets Display */}
              <div className="mt-4 text-center w-full">
                {walletBalance && walletBalance.chains && walletBalance.chains.length > 0 && (
                  <div className="w-full space-y-4">
                    {walletBalance.chains.map((chainData: any, chainIndex: number) => (
                      <div key={`chain-${chainIndex}`} className="rounded-lg border border-primary-50">
                        <div className="flex items-center justify-between border-b border-primary-50 py-3 px-4">
                          <div className="text-sm text-primary-400">Assets</div>
                          <div className="text-sm text-primary-400">Balance</div>
                        </div>

                        <div className="space-y-2">
                          <ScrollArea className="h-[160px]">
                            {chainData.assets.map((asset: any, assetIndex: number) => (
                              <div key={`asset-${chainIndex}-${assetIndex}`} className="flex items-center justify-between py-2 px-4 bg-white rounded">
                                <div className="flex items-center gap-3">
                                  <Avatar className="size-8 rounded-full">
                                    <AvatarImage src={asset.asset.icon} alt={asset.asset.symbol} />
                                    <AvatarFallback>
                                      <img src="/icons/default-token.svg" alt="token" className="w-6 h-6 rounded-full" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col items-start">
                                    <div className="text-sm text-primary-800">
                                      {asset.asset.name}
                                    </div>
                                    <div className="text-xs text-primary-400">
                                      {asset.asset.symbol}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-sm text-primary-800">
                                    {asset.balance.toFixed(6)} {asset.asset.symbol}
                                  </div>
                                  <div className="text-xs text-primary-400">
                                    ${asset.total.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Amount Step */}
          {currentStep === 'amount' && (
            <div className="space-y-4 w-full">
              <div className="space-y-3 w-full">
                <div className="w-full">
                  <Label htmlFor="deposit" className="text-[13px] text-primary-400">Deposit Method</Label>
                  <Select value={depositMethod} onValueChange={(value: 'transfer_crypto' | 'use_card' | 'connect_exchange') => setDepositMethod(value)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer_crypto">Transfer Crypto</SelectItem>
                      <SelectItem value="use_card">Use Card</SelectItem>
                      <SelectItem value="connect_exchange">Connect Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-t-primary-100 border-dashed" />

                {/* Transfer Crypto Options */}
                {depositMethod === 'transfer_crypto' && (
                  <div className="text-center space-y-4">
                    <div className="p-6 rounded-lg bg-primary-50 border-2 border-dashed border-primary-200">
                      <div className="size-24 mx-auto mb-3 flex items-center justify-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${selectedAddress.chains.some((chain: any) => chain.includes('solana'))
                            ? `solana:${selectedWalletAddress}`
                            : `${selectedWalletAddress}`
                            }`}
                          alt="QR Code for wallet address"
                          className="size-24"
                        />
                      </div>
                      <h4 className="text-sm font-medium text-primary-800 mb-2">Transfer any crypto to this address</h4>
                      <p className="text-xs text-primary-600 mb-3">
                        Send any token supported by your wallet's chains to this address
                      </p>
                      <div className="bg-white rounded border p-3">
                        <p className="text-xs text-primary-500 font-mono break-all">{selectedWalletAddress}</p>
                      </div>
                      <div className="flex gap-1 justify-center mt-3">
                        {selectedAddress.chains.map((chain: string) => (
                          <ChainBadge key={chain} chainValue={chain} size="sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Use Card Options */}
                {depositMethod === 'use_card' && (
                  <div className="flex items-center flex-col gap-y-4 my-6">
                    <div className="flex items-center justify-center">
                      <img src="/helio.svg" alt="helio" className="size-14" />
                      <img src="/logo.png" alt="osiris" className="-translate-x-4 size-16" />
                    </div>
                    <p className="text-xl">Osiris uses a 3rd party</p>

                    <div className="w-full space-y-3">
                      <Label htmlFor="card-amount" className="text-[13px] text-primary-400">Amount (USD)</Label>
                      <Input
                        id="card-amount"
                        type="number"
                        placeholder="0.00"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="w-full"
                        min="0.01"
                        step="0.01"
                      />
                      {/* <p className="text-xs text-primary-500 text-center">
                        Enter the amount you want to add to your wallet
                      </p> */}
                    </div>
                  </div>
                )}

                {/* Connect Exchange Options */}
                {depositMethod === 'connect_exchange' && (
                  <div className="space-y-3">
                    {!isConnected ? (
                      <CustomConnectButton />
                    ) : (
                      <>
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
                          <Select value={selectedChain} onValueChange={setSelectedChain}>
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
                          <Select value={selectedToken} onValueChange={setSelectedToken}>
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
                              value={fundAmount}
                              onChange={(e) => setFundAmount(e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBackToWallet} className="flex-1">
                  Back
                </Button>
                {depositMethod === 'transfer_crypto' ? (
                  <Button onClick={handleNextStep} className="flex-1">
                    Continue
                  </Button>
                ) : depositMethod === 'use_card' ? (
                  <Button
                    onClick={() => setCurrentStep('review')}
                    className="flex-1"
                    disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                  >
                    Continue to Payment
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextStep}
                    disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                    className="flex-1"
                  >
                    Send Funds
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="mt-6 space-y-4 w-full">
              <div className="text-center">
                <h3 className="text-lg font-medium text-primary-800">Review Payment</h3>
                <p className="text-sm text-primary-500">Please review your payment details</p>
              </div>

              <div className="bg-primary-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-primary-600">Amount:</span>
                  <span className="text-sm font-medium text-primary-800">${fundAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-primary-600">Payment Method:</span>
                  <span className="text-sm font-medium text-primary-800 capitalize">
                    {depositMethod === 'transfer_crypto' ? 'Transfer Crypto' :
                      depositMethod === 'use_card' ? 'Credit/Debit Card' : 'Connect Exchange'}
                  </span>
                </div>
                {depositMethod === 'use_card' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-primary-600">Email:</span>
                    <span className="text-sm font-medium text-primary-800">{user?.email}</span>
                  </div>
                )}
                {depositMethod === 'transfer_crypto' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-primary-600">Chain:</span>
                      <span className="text-sm font-medium text-primary-800 capitalize">{selectedChain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-primary-600">Token:</span>
                      <span className="text-sm font-medium text-primary-800 capitalize">
                        {selectedToken === 'custom' ? customTokenAddress : selectedToken}
                      </span>
                    </div>
                  </>
                )}
                {depositMethod === 'connect_exchange' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-primary-600">Connected Wallet:</span>
                      <span className="text-sm font-medium text-primary-800 font-mono">
                        {connectedAddress?.slice(0, 8)}...{connectedAddress?.slice(-6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-primary-600">Chain:</span>
                      <div className="flex items-center gap-1">
                        <Avatar className="size-4 rounded-full">
                          <AvatarImage src={getChainIcon(selectedChain)} alt={selectedChain} />
                          <AvatarFallback className="text-xs">
                            {selectedChain.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-primary-800 capitalize">{selectedChain}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-primary-600">Token:</span>
                      <div className="flex items-center gap-1">
                        <Avatar className="size-4 rounded-full">
                          <AvatarImage src={getTokenIcon(selectedToken)} alt={selectedToken} />
                          <AvatarFallback className="text-xs">
                            {selectedToken.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-primary-800 uppercase">{selectedToken}</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-primary-600">Target Wallet:</span>
                  <span className="text-sm font-medium text-primary-800 font-mono">
                    {selectedWalletAddress.slice(0, 8)}...{selectedWalletAddress.slice(-6)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('amount')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleConfirmFunds}
                  className="flex-1"
                  disabled={
                    (depositMethod === 'use_card' && helioDepositMutation.isPending) ||
                    (depositMethod === 'connect_exchange' && isSendingTransaction)
                  }
                >
                  {depositMethod === 'use_card' ? (
                    helioDepositMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )
                  ) : depositMethod === 'connect_exchange' ? (
                    isSendingTransaction ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Transaction'
                    )
                  ) : (
                    'Confirm Transaction'
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="mt-6 text-center space-y-4 w-full">
              <Loader2 className="size-12 animate-spin mx-auto text-primary-600" />
              <div>
                <h3 className="text-lg font-medium text-primary-800">
                  {depositMethod === 'connect_exchange' ? 'Processing Transaction' : 'Processing Payment'}
                </h3>
                <p className="text-sm text-primary-500">
                  {depositMethod === 'connect_exchange'
                    ? 'Please wait while your transaction is confirmed on the blockchain...'
                    : 'Please wait while we process your transaction...'}
                </p>
                {transactionHash && (
                  <p className="text-xs text-primary-400 font-mono mt-2 break-all">
                    Tx: {transactionHash}
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="mt-6 text-center space-y-4">
              <CheckCircle className="size-12 mx-auto text-green-600" />
              <div>
                <h3 className="text-lg font-medium text-primary-800">Transaction Successful!</h3>
                <p className="text-sm text-primary-500">Your funds have been added successfully.</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <div className="text-sm text-green-800">
                  <strong>Amount Added:</strong> ${fundAmount}
                </div>
                {transactionHash && (
                  <div className="text-xs text-green-700 font-mono break-all">
                    <strong>Transaction:</strong> {transactionHash}
                  </div>
                )}
              </div>

              <Button onClick={handleBackToWallet} className="w-full">
                Back to Wallet
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
