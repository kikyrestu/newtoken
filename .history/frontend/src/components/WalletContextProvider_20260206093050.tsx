import type { FC, ReactNode } from 'react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
// Phantom and Solflare are now Standard Wallets - no manual adapters needed
import {
    WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const DEFAULT_RPC = import.meta.env.VITE_RPC_ENDPOINT || '';

console.log('[WalletContext] Module loaded');
console.log('[WalletContext] API_BASE_URL:', API_BASE_URL);
console.log('[WalletContext] DEFAULT_RPC from env:', DEFAULT_RPC || '(not set)');

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [dynamicRpc, setDynamicRpc] = useState<string | null>(null);
    const [configLoaded, setConfigLoaded] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);

    console.log('[WalletContext] Component rendering, configLoaded:', configLoaded);

    // Fetch blockchain config from backend
    useEffect(() => {
        console.log('[WalletContext] useEffect: Fetching blockchain config...');

        const fetchConfig = async () => {
            const configUrl = `${API_BASE_URL}/settings/blockchain_config`;
            console.log('[WalletContext] Fetching from:', configUrl);

            try {
                const response = await fetch(configUrl, {
                    headers: { 'Accept': 'application/json' }
                });

                console.log('[WalletContext] Response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('[WalletContext] Config response:', data);

                    if (data.success && data.value?.rpc_url) {
                        console.log('[WalletContext] Using dynamic RPC:', data.value.rpc_url);
                        setDynamicRpc(data.value.rpc_url);
                    } else {
                        console.warn('[WalletContext] No rpc_url in response, using fallback');
                    }
                } else {
                    const errorText = await response.text();
                    console.error('[WalletContext] Config fetch failed:', response.status, errorText);
                    setConfigError(`HTTP ${response.status}`);
                }
            } catch (err) {
                console.error('[WalletContext] Config fetch error:', err);
                setConfigError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                console.log('[WalletContext] Config loading complete');
                setConfigLoaded(true);
            }
        };
        fetchConfig();
    }, []);

    // Priority: Dynamic config > env variable > cluster default
    const endpoint = useMemo(() => {
        let finalEndpoint: string;

        if (dynamicRpc) {
            finalEndpoint = dynamicRpc;
            console.log('[WalletContext] Using dynamic RPC endpoint:', finalEndpoint);
        } else if (DEFAULT_RPC) {
            finalEndpoint = DEFAULT_RPC;
            console.log('[WalletContext] Using env RPC endpoint:', finalEndpoint);
        } else {
            finalEndpoint = clusterApiUrl(WalletAdapterNetwork.Mainnet);
            console.log('[WalletContext] Using Solana mainnet cluster:', finalEndpoint);
        }

        return finalEndpoint;
    }, [dynamicRpc]);

    // Standard wallets (Phantom, Solflare, etc.) are auto-detected
    // Empty array = use only standard wallet adapters
    const wallets = useMemo(() => {
        console.log('[WalletContext] Initializing wallets array (empty = auto-detect standard wallets)');
        return [];
    }, []);

    // Error handler for wallet errors
    const onError = useCallback((error: Error) => {
        console.error('[WalletContext] Wallet Error:', error.name, error.message);
        console.error('[WalletContext] Error stack:', error.stack);
    }, []);

    // Don't render until config is loaded to prevent connection issues
    if (!configLoaded) {
        console.log('[WalletContext] Waiting for config to load...');
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="text-[#00ff41] animate-pulse">Initializing wallet...</div>
            </div>
        );
    }

    console.log('[WalletContext] Rendering providers with endpoint:', endpoint);
    if (configError) {
        console.warn('[WalletContext] Config had error but continuing:', configError);
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
