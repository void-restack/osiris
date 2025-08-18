import { ChainBadge } from "@/utils/chain-icons";

interface TransferCryptoDepositProps {
  walletAddress: string;
  chains: string[];
  className?: string;
}

export function TransferCryptoDeposit({
  walletAddress,
  chains,
  className = ""
}: TransferCryptoDepositProps) {
  const isSolanaChain = chains.some((chain: string) => chain.includes('solana'));
  const qrCodeData = isSolanaChain ? `solana:${walletAddress}` : walletAddress;

  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="p-6 rounded-lg bg-primary-50 border-2 border-dashed border-primary-200">
        <div className="size-24 mx-auto mb-3 flex items-center justify-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${qrCodeData}`}
            alt="QR Code for wallet address"
            className="size-24"
          />
        </div>
        <h4 className="text-sm font-medium text-primary-800 mb-2">
          Transfer any crypto to this address
        </h4>
        <p className="text-xs text-primary-600 mb-3">
          Send any token supported by your wallet's chains to this address
        </p>
        <div className="bg-white rounded border p-3">
          <p className="text-xs text-primary-500 font-mono break-all">
            {walletAddress}
          </p>
        </div>
        <div className="flex gap-1 justify-center mt-3">
          {chains.map((chain: string) => (
            <ChainBadge key={chain} chainValue={chain} size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
