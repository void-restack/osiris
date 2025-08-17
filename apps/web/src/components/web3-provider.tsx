import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, polygon, arbitrum, base, optimism, sepolia } from "wagmi/chains";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { queryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";

const config = createConfig(
    getDefaultConfig({
        chains: [mainnet, polygon, arbitrum, base, optimism, sepolia],
        transports: {
            [mainnet.id]: http(),
            [polygon.id]: http(),
            [arbitrum.id]: http(),
            [base.id]: http(),
        },
        walletConnectProjectId: "766497721a9517233aeace3c8e268dd6",
        appName: "Osiris",
    }),
);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>{children}</ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};