import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Copy, CopyIcon, MoveDownLeft, MoveDownRight, CheckCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { ChainBadge } from "@/utils/chain-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UseCardDeposit } from "./use-card-deposit";
import { ConnectWalletDeposit } from "./connect-wallet-deposit";
import { toast } from "sonner";
import { TransferCryptoDeposit } from "./tranfer-crypto-deposit";

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
  const [fundAmount, setFundAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState<string>('');

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

  const handleAddFunds = () => {
    setIsDialogOpen(true);
    setCurrentStep('amount');
  };

  const handleWithdrawFunds = () => {
    // TODO: Implement withdraw functionality
    toast.info('Withdraw functionality coming soon!');
  };

  const handleBackToWallet = () => {
    setCurrentStep('wallet');
    setFundAmount('');
    setDepositMethod('transfer_crypto');
    setSelectedChain(supportedChainKeys[0] || 'polygon');
    setSelectedToken('matic');
    setTransactionHash('');
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Reset to initial state when closing
    setCurrentStep('wallet');
    setDepositMethod('transfer_crypto');
    setFundAmount('');
    setTransactionHash('');
  };

  const handleNextStep = () => {
    if (currentStep === 'amount') setCurrentStep('review');
    else if (currentStep === 'review') setCurrentStep('processing');
  };

  const handleTransactionSuccess = (txHash: string) => {
    setTransactionHash(txHash);
    setCurrentStep('success');
  };

  const handleTransactionError = (error: string) => {
    // Stay in review step or go back to amount step
    setCurrentStep('review');
  };

  const handleCardPaymentSuccess = () => {
    setTimeout(() => {
      handleCloseDialog();
    }, 2000);
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

      <div className="flex items-center gap-2 w-full">
        <Button
          className="w-full px-2 py-0.5"
          variant="outline"
          icon={MoveDownLeft}
          iconPlacement="left"
          onClick={handleAddFunds}
        >
          Add Funds
        </Button>
        <Button
          className="w-full px-2 py-0.5"
          variant="outline"
          icon={MoveDownRight}
          iconPlacement="right"
          onClick={handleWithdrawFunds}
        >
          Withdraw Funds
        </Button>
      </div>

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
                <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${selectedWalletAddress}`} alt="wallet" className="w-full h-full rounded-full" />
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
                  <TransferCryptoDeposit
                    walletAddress={selectedWalletAddress}
                    chains={selectedAddress.chains}
                  />
                )}

                {/* Use Card Options */}
                {depositMethod === 'use_card' && (
                  <UseCardDeposit
                    amount={fundAmount}
                    onAmountChange={setFundAmount}
                    onSuccess={handleCardPaymentSuccess}
                    onError={(error) => toast.error(error)}
                    className="my-6"
                  />
                )}

                {/* Connect Exchange Options */}
                {depositMethod === 'connect_exchange' && (
                  <ConnectWalletDeposit
                    supportedChainKeys={supportedChainKeys}
                    selectedChain={selectedChain}
                    onChainChange={setSelectedChain}
                    selectedToken={selectedToken}
                    onTokenChange={setSelectedToken}
                    amount={fundAmount}
                    onAmountChange={setFundAmount}
                    targetAddress={selectedWalletAddress}
                    onTransactionSuccess={handleTransactionSuccess}
                    onTransactionError={handleTransactionError}
                  />
                )}
              </div>

              {depositMethod !== 'connect_exchange' && (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBackToWallet} className="flex-1">
                    Back
                  </Button>
                  {depositMethod === 'transfer_crypto' && (
                    <Button onClick={handleNextStep} className="flex-1">
                      Continue
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="mt-6 text-center space-y-4 w-full">
              <Loader2 className="size-12 animate-spin mx-auto text-primary-600" />
              <div>
                <h3 className="text-lg font-medium text-primary-800">Processing Transaction</h3>
                <p className="text-sm text-primary-500">Please wait while your transaction is confirmed...</p>
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
