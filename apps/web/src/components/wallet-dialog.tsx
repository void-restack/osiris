// Updated WalletDialog with proper wagmi integration
import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { Loader2, Copy, CopyIcon, MoveDownLeft, MoveDownRight, CheckCircle, QrCode, RefreshCw, Wallet, X } from "lucide-react";
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

  // Wagmi hooks
  const { address: connectedAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

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
        { value: 'eth', label: 'Ethereum (ETH)', symbol: 'ETH' },
        { value: 'usdc', label: 'USD Coin (USDC)', symbol: 'USDC' },
        { value: 'usdt', label: 'Tether (USDT)', symbol: 'USDT' }
      ],
      polygon: [
        { value: 'matic', label: 'Polygon (MATIC)', symbol: 'MATIC' },
        { value: 'usdc', label: 'USD Coin (USDC)', symbol: 'USDC' },
        { value: 'usdt', label: 'Tether (USDT)', symbol: 'USDT' }
      ],
      arbitrum: [
        { value: 'eth', label: 'Ethereum (ETH)', symbol: 'ETH' },
        { value: 'usdc', label: 'USD Coin (USDC)', symbol: 'USDC' },
        { value: 'usdt', label: 'Tether (USDT)', symbol: 'USDT' }
      ],
      base: [
        { value: 'eth', label: 'Ethereum (ETH)', symbol: 'ETH' },
        { value: 'usdc', label: 'USD Coin (USDC)', symbol: 'USDC' }
      ]
    };

    return topTokens[selectedChain] || [];
  }, []);

  // Custom Connect Button Component using ConnectKitButton render props
  const CustomConnectButton = () => (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
        return (
          <div className="text-center flex flex-col items-center space-y-3 my-8">
            <div className="w-full flex flex-col items-center gap-3">
              <Icon className="size-12" name="wallet" />
              {isConnected ? (
                <>
                  <div className="bg-green-50 p-4 rounded-lg space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Connected Wallet:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnect()}
                      >
                        Disconnect
                      </Button>
                    </div>
                    <p className="text-sm text-green-800 font-mono">
                      {ensName ?? `${address?.slice(0, 8)}...${address?.slice(-6)}`}
                    </p>
                    {chain && (
                      <p className="text-xs text-green-600">
                        Connected to {chain.name}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm">Connect a wallet to add funds from your exchange</p>
                  <Button
                    onClick={show}
                    disabled={isConnecting}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
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
                </>
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
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Reset to initial state when closing
    setCurrentStep('wallet');
    setDepositMethod('transfer_crypto');
    setFundAmount('');
    setCustomTokenAddress('');
  };

  const handleNextStep = () => {
    if (currentStep === 'amount') setCurrentStep('review');
    else if (currentStep === 'review') setCurrentStep('processing');
  };

  const handleConfirmFunds = async () => {
    if (depositMethod === 'use_card') {
      try {
        await helioDepositMutation.mutateAsync({
          amount: fundAmount,
          paymentMethod: "helio_web3",
          userEmail: undefined,
          chargeType: "charge"
        });
        setCurrentStep('success');
      } catch (error) {
        console.error('Payment failed:', error);
        return;
      }
    } else {
      setCurrentStep('processing');
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep('success');
      }, 2000);
    }
  };

  // Reset chain selection when supportedChainKeys change
  useEffect(() => {
    if (!supportedChainKeys.includes(selectedChain) && supportedChainKeys.length > 0) {
      setSelectedChain(supportedChainKeys[0]);
    }
  }, [supportedChainKeys, selectedChain]);

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
              <div className="size-10 rounded-full bg-primary-200" />
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
                      <SelectItem value="connect_exchange">Connect Exchange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transfer Crypto Options */}
                {depositMethod === 'transfer_crypto' && (
                  <div className="text-center space-y-4">
                    <div className="p-6 rounded-lg bg-primary-50 border-2 border-dashed border-primary-200">
                      <QrCode className="size-24 mx-auto text-primary-600 mb-3" />
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
                  </div>
                )}

                {/* Connect Exchange Options */}
                {depositMethod === 'connect_exchange' && (
                  <div className="space-y-3">
                    {!isConnected ? (
                      <CustomConnectButton />
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-mono max-w-[200px] truncate">{connectedAddress}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnect()}
                          >
                            Disconnect
                          </Button>
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
                                  {chainKey.charAt(0).toUpperCase() + chainKey.slice(1)}
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
                                  {token.label}
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
                  <Button onClick={() => setCurrentStep('review')} className="flex-1">
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

          {/* Review, Processing, Success steps remain the same... */}
          {currentStep === 'review' && (
            <div className="mt-6 space-y-4 w-full">
              <div className="text-center">
                <h3 className="text-lg font-medium text-primary-800">Review Transaction</h3>
                <p className="text-sm text-primary-500">Please review your transaction details</p>
              </div>

              <div className="bg-primary-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-primary-600">Amount:</span>
                  <span className="text-sm font-medium text-primary-800">${fundAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-primary-600">Deposit Method:</span>
                  <span className="text-sm font-medium text-primary-800 capitalize">
                    {depositMethod === 'transfer_crypto' ? 'Transfer Crypto' :
                      depositMethod === 'use_card' ? 'Use Card' : 'Connect Exchange'}
                  </span>
                </div>
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
                  <div className="flex justify-between">
                    <span className="text-sm text-primary-600">Connected Wallet:</span>
                    <span className="text-sm font-medium text-primary-800 font-mono">
                      {connectedAddress?.slice(0, 8)}...{connectedAddress?.slice(-6)}
                    </span>
                  </div>
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
                  disabled={depositMethod === 'use_card' && helioDepositMutation.isPending}
                >
                  {depositMethod === 'use_card' ? 'Process Payment' : 'Confirm Transaction'}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="mt-6 text-center space-y-4 w-full">
              <Loader2 className="size-12 animate-spin mx-auto text-primary-600" />
              <div>
                <h3 className="text-lg font-medium text-primary-800">Processing Transaction</h3>
                <p className="text-sm text-primary-500">Please wait while we process your transaction...</p>
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

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-800">
                  <strong>Amount Added:</strong> ${fundAmount}
                </div>
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