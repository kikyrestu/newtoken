import type { FC, ReactNode } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const DEFAULT_RPC = import.meta.env.VITE_RPC_ENDPOINT || '';

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [dynamicRpc, setDynamicRpc] = useState<string | null>(null);

    // Fetch blockchain config from backend
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/settings/blockchain_config`, {
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.value?.rpc_url) {
                        setDynamicRpc(data.value.rpc_url);
                    }
                }
            } catch (err) {
                console.debug('[WalletContext] Using default RPC');
            }
        };
        fetchConfig();
    }, []);

    // Determine the network
    const network = WalletAdapterNetwork.Mainnet;

    // Priority: Dynamic config > env variable > cluster default
    const endpoint = useMemo(() => {
        if (dynamicRpc) {
            return dynamicRpc;
        }
        if (DEFAULT_RPC) {
            return DEFAULT_RPC;
        }
        return clusterApiUrl(network);
    }, [dynamicRpc, network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
