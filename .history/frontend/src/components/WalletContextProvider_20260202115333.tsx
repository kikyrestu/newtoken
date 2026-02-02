import type { FC, ReactNode } from 'react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
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
    const [configLoaded, setConfigLoaded] = useState(false);

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
                        console.log('[WalletContext] Using dynamic RPC:', data.value.rpc_url);
                        setDynamicRpc(data.value.rpc_url);
                    }
                }
            } catch (err) {
                console.debug('[WalletContext] Using default RPC');
            } finally {
                setConfigLoaded(true);
            }
        };
        fetchConfig();
    }, []);

    // Priority: Dynamic config > env variable > cluster default
    const endpoint = useMemo(() => {
        if (dynamicRpc) {
            return dynamicRpc;
        }
        if (DEFAULT_RPC) {
            return DEFAULT_RPC;
        }
        // Fallback to mainnet if nothing configured
        return clusterApiUrl(WalletAdapterNetwork.Mainnet);
    }, [dynamicRpc]);

    // Detect network from RPC URL
    const network = useMemo(() => {
        const rpc = endpoint.toLowerCase();
        if (rpc.includes('devnet')) {
            return WalletAdapterNetwork.Devnet;
        }
        if (rpc.includes('testnet')) {
            return WalletAdapterNetwork.Testnet;
        }
        return WalletAdapterNetwork.Mainnet;
    }, [endpoint]);

    // Multiple wallet adapters for better compatibility
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
        ],
        [network]
    );

    // Error handler for wallet errors
    const onError = useCallback((error: Error) => {
        console.error('[Wallet Error]', error);
    }, []);

    // Don't render until config is loaded to prevent connection issues
    if (!configLoaded) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="text-[#00ff41] animate-pulse">Initializing wallet...</div>
            </div>
        );
    }

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider
                wallets={wallets}
                autoConnect={false}
                onError={onError}
            >
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
