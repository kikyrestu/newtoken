import type { FC, ReactNode } from 'react';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';
// Phantom and Solflare are now Standard Wallets - no manual adapters needed
// WalletModalProvider removed - using custom NoWalletModal instead

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const DEFAULT_RPC = import.meta.env.VITE_RPC_ENDPOINT || '';

// Key for tracking intentional logout
export const WALLET_DISCONNECTED_KEY = '_wallet_user_disconnected';

if (import.meta.env.DEV) {
    console.log('[WalletContext] Module loaded');
    console.log('[WalletContext] API_BASE_URL:', API_BASE_URL);
    console.log('[WalletContext] DEFAULT_RPC from env:', DEFAULT_RPC || '(not set)');
}

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

    // W4 FIX: RPC fallback array for better reliability
    const FALLBACK_RPCS = [
        'https://api.mainnet-beta.solana.com',
        'https://solana-mainnet.g.alchemy.com/v2/demo'
    ];

    // Priority: Dynamic config > env variable > fallback array
    const endpoint = useMemo(() => {
        let finalEndpoint: string;

        if (dynamicRpc) {
            finalEndpoint = dynamicRpc;
            if (import.meta.env.DEV) console.log('[WalletContext] Using dynamic RPC:', finalEndpoint);
        } else if (DEFAULT_RPC) {
            finalEndpoint = DEFAULT_RPC;
            if (import.meta.env.DEV) console.log('[WalletContext] Using env RPC:', finalEndpoint);
        } else {
            // Use first fallback RPC instead of cluster API
            finalEndpoint = FALLBACK_RPCS[0];
            if (import.meta.env.DEV) console.log('[WalletContext] Using fallback RPC:', finalEndpoint);
        }

        return finalEndpoint;
    }, [dynamicRpc]);

    // Include Mobile Wallet Adapter for regular mobile browsers
    // This allows users to connect from Chrome/Safari without in-app browser
    const wallets = useMemo(() => {
        if (import.meta.env.DEV) console.log('[WalletContext] Initializing wallets with Mobile Wallet Adapter');

        // Only add MWA on mobile devices
        const isMobile = typeof window !== 'undefined' &&
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            return [
                new SolanaMobileWalletAdapter({
                    addressSelector: {
                        select: async (addresses: string[]) => addresses[0]
                    },
                    appIdentity: {
                        name: 'FlyUA',
                        uri: window.location.origin,
                        icon: '/logo.png'
                    },
                    authorizationResultCache: {
                        get: async () => {
                            try {
                                const cached = localStorage.getItem('mwa-auth-cache');
                                return cached ? JSON.parse(cached) : null;
                            } catch {
                                return null;
                            }
                        },
                        set: async (authResult) => {
                            try {
                                localStorage.setItem('mwa-auth-cache', JSON.stringify(authResult));
                            } catch {
                                // Ignore storage errors
                            }
                        },
                        clear: async () => {
                            try {
                                localStorage.removeItem('mwa-auth-cache');
                            } catch {
                                // Ignore storage errors
                            }
                        }
                    },
                    chain: 'mainnet-beta' as const,
                    onWalletNotFound: async () => {
                        console.log('[WalletContext] No mobile wallet found');
                    }
                })
            ];
        }

        // Desktop - rely on standard wallet adapters
        return [];
    }, []);

    // Rate limit protection: track consecutive errors and disable autoConnect if rate limited
    const errorCountRef = useRef(0);
    const [rateLimited, setRateLimited] = useState(false);

    // Error handler for wallet errors — detects rate limiting and stops retry loops
    const onError = useCallback((error: Error) => {
        console.error('[WalletContext] Wallet Error:', error.name, error.message);

        errorCountRef.current += 1;

        // Detect rate limit error or too many consecutive failures
        const isRateLimited = error.message?.toLowerCase().includes('rate limit');
        const tooManyErrors = errorCountRef.current >= 3;

        if (isRateLimited || tooManyErrors) {
            console.warn(`[WalletContext] 🛑 Rate limit detected (errors: ${errorCountRef.current}). Disabling autoConnect for 60s.`);
            setRateLimited(true);

            // Re-enable after 60 seconds cooldown
            setTimeout(() => {
                console.log('[WalletContext] ✅ Cooldown expired, re-enabling autoConnect');
                errorCountRef.current = 0;
                setRateLimited(false);
            }, 60000);
        }
    }, []);

    // Reset error count on successful connection
    useEffect(() => {
        // This effect doesn't directly observe connection, but rateLimited flag
        // will be cleared by the timeout above
    }, [rateLimited]);

    // Check if user intentionally disconnected or rate limited - if so, don't auto-connect
    // IMPORTANT: This must be BEFORE any early returns to satisfy React hooks rules
    const shouldAutoConnect = useMemo(() => {
        if (rateLimited) {
            console.log('[WalletContext] Rate limited, autoConnect disabled');
            return false;
        }
        const userDisconnected = localStorage.getItem(WALLET_DISCONNECTED_KEY);
        if (userDisconnected === 'true') {
            console.log('[WalletContext] User previously disconnected, autoConnect disabled');
            return false;
        }
        return true;
    }, [rateLimited]);

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
                autoConnect={shouldAutoConnect}
                onError={onError}
            >
                {/* No WalletModalProvider - using custom NoWalletModal in TacticalWalletButton */}
                {children}
            </WalletProvider>
        </ConnectionProvider>
    );
};
