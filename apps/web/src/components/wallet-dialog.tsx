import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Copy, CopyIcon, MoveDownLeft, MoveDownRight, CheckCircle, QrCode, RefreshCw, Wallet } from "lucide-react";
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
import { ConnectKitButton, useModal } from "connectkit";
import { Icon } from "./ui/icon";

interface WalletDialogProps {
  address: any;
  index: number;
  getChainDisplayName: (chainValue: string) => string;
  handleCopyAddress: (address: string) => void;
  userServiceConnectionId?: string;
  formData: any;
}

export function WalletDialog({
  address,
  index,
  getChainDisplayName,
  handleCopyAddress,
  userServiceConnectionId,
  formData
}: WalletDialogProps) {
  const [selectedWalletAddress, setSelectedWalletAddress] = useState(address.address);
  const [currentStep, setCurrentStep] = useState<'wallet' | 'amount' | 'review' | 'processing' | 'success'>('wallet');
  const [depositMethod, setDepositMethod] = useState<'transfer_crypto' | 'use_card' | 'connect_exchange'>('transfer_crypto');
  const [selectedChain, setSelectedChain] = useState('polygon');
  const [selectedToken, setSelectedToken] = useState('matic');
  const [fundAmount, setFundAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const helioDepositMutation = useHelioDepositMutation();

  // Use ConnectKit's modal hook to control the modal behavior
  const { open, setOpen } = useModal({
    onConnect: (wallet: any) => {
      setIsConnecting(false);
      setIsWalletConnected(true);
      setConnectedWalletAddress(wallet.address || '');
    },
    onDisconnect: () => {
      setIsWalletConnected(false);
      setConnectedWalletAddress('');
    }
  });

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

  const handleAddFunds = () => {
    setCurrentStep('amount');
  };

  const handleBackToWallet = () => {
    setCurrentStep('wallet');
    setFundAmount('');
    setDepositMethod('transfer_crypto');
    setSelectedChain('polygon');
    setSelectedToken('matic');
  };

  const handleNextStep = () => {
    if (currentStep === 'amount') setCurrentStep('review');
    else if (currentStep === 'review') setCurrentStep('processing');
  };

  const handleConfirmFunds = async () => {
    if (depositMethod === 'use_card') {
      // Use Helio mutation for card payments
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
        // Stay on review step to show error
        return;
      }
    } else {
      // For other methods, show processing step
      setCurrentStep('processing');
      setIsProcessing(true);

      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep('success');
      }, 2000);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="border w-full rounded-lg p-3 bg-primary-25">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-1 flex-wrap">
                {address.chains.map((chain: string) => (
                  <span
                    key={`${index}-${chain}`}
                    className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded"
                  >
                    {getChainDisplayName(chain)}
                  </span>
                ))}
              </div>
            </div>

            <div className="font-mono text-sm text-primary-800 bg-white px-2 py-1 rounded border flex items-center justify-between">
              {address.address.slice(0, 10)}...{address.address.slice(-10)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyAddress(address.address)}
                className="ml-2 h-5 px-1"
              >
                <Copy className="size-3" />
              </Button>
            </div>

            {address.derivationPath && (
              <div className="text-xs text-primary-500">
                Path: {address.derivationPath} | Curve: {address.curve.replace('CURVE_', '')}
              </div>
            )}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-primary-200" />
              <div className="flex flex-col gap-1">
                {allWalletAddresses.length > 1 && (
                  <div className="flex flex-col gap-1">
                    <Select value={selectedWalletAddress} onValueChange={setSelectedWalletAddress}>
                      <SelectTrigger className="w-[200px] h-fit">
                        <SelectValue placeholder="Select wallet address" />
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
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleCopyAddress(selectedWalletAddress)}>
              <CopyIcon className="size-4 text-primary-400" />
            </Button>
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
                  variant="outline2"
                  icon={MoveDownLeft}
                  iconPlacement="left"
                  onClick={handleAddFunds}
                >
                  Add Funds
                </Button>
                <Button className="max-w-[168px] w-full px-2 py-0.5" variant="outline2" icon={MoveDownRight} iconPlacement="right">Withdraw Funds</Button>
              </div>

              {/* Show selected wallet address details */}
              <div className="mt-4 text-center">
                <div className="text-sm text-primary-600 font-mono bg-primary-50 px-3 py-2 rounded border">
                  {selectedWalletAddress}
                </div>
                {selectedAddress.chains && selectedAddress.chains.length > 0 && (
                  <div className="flex gap-1 flex-wrap justify-center mt-2">
                    {selectedAddress.chains.map((chain: string) => (
                      <span
                        key={chain}
                        className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded"
                      >
                        {getChainDisplayName(chain)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step Content */}
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
                  <>
                    <div className="">
                      <Label htmlFor="chain" className="text-[13px] text-primary-400">Select Chain</Label>
                      <Select value={selectedChain} onValueChange={setSelectedChain}>
                        <SelectTrigger className="mt-1 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="polygon">Polygon</SelectItem>
                          <SelectItem value="ethereum">Ethereum</SelectItem>
                          <SelectItem value="arbitrum">Arbitrum</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
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
                          {selectedChain === 'polygon' && (
                            <>
                              <SelectItem value="matic">Polygon Matic ($MATIC)</SelectItem>
                              <SelectItem value="usdc">USDC</SelectItem>
                            </>
                          )}
                          {selectedChain === 'ethereum' && (
                            <>
                              <SelectItem value="eth">Ethereum ($ETH)</SelectItem>
                              <SelectItem value="usdc">USDC</SelectItem>
                            </>
                          )}
                          {selectedChain === 'arbitrum' && (
                            <>
                              <SelectItem value="arb">Arbitrum ($ARB)</SelectItem>
                              <SelectItem value="usdc">USDC</SelectItem>
                            </>
                          )}
                          {selectedChain === 'base' && (
                            <>
                              <SelectItem value="eth">Ethereum ($ETH)</SelectItem>
                              <SelectItem value="usdc">USDC</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* QR Code Section */}
                    <div className="text-center space-y-3">
                      <div className="p-4 rounded-lg">
                        <QrCode className="size-24 mx-auto text-primary-600 mb-2" />
                        <p className="text-sm text-primary-600">Scan QR code to transfer assets to this wallet</p>
                        <p className="text-xs text-primary-500 font-mono mt-1">{selectedWalletAddress}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Use Card Options */}
                {depositMethod === 'use_card' && (
                  <div className="flex items-center flex-col gap-y-4 my-6">
                    <div className="flex items-center justify-center">
                      <img src="/helio.svg" alt="helio" className="size-14" />
                      <img src="/logo.png" alt="osiris" className="-translate-x-4 size-16" />
                    </div>
                    <p className="text-xl">Osiris uses a 3rd party</p>
                    {/* <Button
                      onClick={() => setCurrentStep('review')}
                      className="mt-3 w-full"
                      variant="outline2"
                    >
                      Continue to third party
                    </Button> */}
                  </div>
                )}

                {/* Connect Exchange Options */}
                {depositMethod === 'connect_exchange' && (
                  <div className="space-y-3">
                    {!isWalletConnected ? (
                      <div className="text-center flex flex-col items-center space-y-3 my-8">
                        <div className="w-full flex flex-col items-center gap-3">
                          <Icon className="size-12" name="wallet" />
                          <p className="text-sm">
                            Connect a wallet to add funds from your exchange
                          </p>
                          <ConnectKitButton
                            onClick={() => setOpen(true)}
                            mode="light"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-green-50 p-4 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700">Connected Wallet:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsWalletConnected(false);
                                setConnectedWalletAddress('');
                              }}
                            >
                              Disconnect
                            </Button>
                          </div>
                          <p className="text-sm text-green-800 font-mono">{connectedWalletAddress}</p>
                        </div>

                        <div>
                          <Label htmlFor="chain" className="text-[13px] text-primary-400">Select Chain</Label>
                          <Select value={selectedChain} onValueChange={setSelectedChain}>
                            <SelectTrigger className="mt-1 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="polygon">Polygon</SelectItem>
                              <SelectItem value="ethereum">Ethereum</SelectItem>
                              <SelectItem value="arbitrum">Arbitrum</SelectItem>
                              <SelectItem value="base">Base</SelectItem>
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
                              {selectedChain === 'polygon' && (
                                <>
                                  <SelectItem value="matic">Polygon Matic ($MATIC)</SelectItem>
                                  <SelectItem value="usdc">USDC</SelectItem>
                                </>
                              )}
                              {selectedChain === 'ethereum' && (
                                <>
                                  <SelectItem value="eth">Ethereum ($ETH)</SelectItem>
                                  <SelectItem value="usdc">USDC</SelectItem>
                                </>
                              )}
                              {selectedChain === 'arbitrum' && (
                                <>
                                  <SelectItem value="usdc">USDC</SelectItem>
                                </>
                              )}
                              {selectedChain === 'base' && (
                                <>
                                  <SelectItem value="eth">Ethereum ($ETH)</SelectItem>
                                  <SelectItem value="usdc">USDC</SelectItem>
                                </>
                              )}
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
                  <Button
                    onClick={handleNextStep}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                ) : depositMethod === 'use_card' ? (
                  <Button
                    onClick={() => setCurrentStep('review')}
                    className="flex-1"
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
                      <span className="text-sm font-medium text-primary-800 capitalize">{selectedToken}</span>
                    </div>
                  </>
                )}
                {depositMethod === 'connect_exchange' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-primary-600">Connected Wallet:</span>
                    <span className="text-sm font-medium text-primary-800 font-mono">
                      {connectedWalletAddress.slice(0, 8)}...{connectedWalletAddress.slice(-6)}
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

          <div>
          </div>
        </div>
      </DialogContent>
    </Dialog >
  );
}
