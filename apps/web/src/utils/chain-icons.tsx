import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';
import React from 'react';

export const getChainIcon = (chainValue: string): string | null => {
  const chainIconMap: Record<string, string> = {
    "evm:eip155:1": "/ethereum.svg",
    "evm:eip155:137": "/polygon.svg",
    "evm:eip155:999": "/hyperliquid.svg",
    "evm:eip155:8453": "/base.svg",
    "evm:eip155:42161": "/arb.png",
    "solana:mainnet-beta": "/solana.svg",
    // Fallbacks
    "ethereum": "/ethereum.svg",
    "polygon": "/polygon.svg",
    "arbitrum": "/arb.png",
    "base": "/base.svg",
    "solana": "/solana.svg",
  };

  return chainIconMap[chainValue.toLowerCase()] || null;
};

export const getChainDisplayName = (chainValue: string): string => {
  const chainNameMap: Record<string, string> = {
    "evm:eip155:1": "Ethereum",
    "evm:eip155:137": "Polygon",
    "evm:eip155:999": "Hyperliquid",
    "evm:eip155:8453": "Base",
    "evm:eip155:42161": "Arbitrum",
    "solana:mainnet-beta": "Solana",
  };

  return chainNameMap[chainValue] || chainValue;
};

interface ChainBadgeProps {
  chainValue: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export const ChainBadge: React.FC<ChainBadgeProps> = ({
  chainValue,
  onRemove,
}) => {
  const iconPath = getChainIcon(chainValue);
  const displayName = getChainDisplayName(chainValue);

  return (
    <div className="flex bg-primary-100 border border-primary-200 rounded-md p-1">
      {iconPath && (
        <img
          src={iconPath}
          alt={displayName}
          className={`object-contain size-6`}
        />
      )}
      {onRemove && (
        <Button variant="ghost" size="icon" type='button' onClick={onRemove}>
          <XIcon />
        </Button>
      )}
    </div>
  );
};