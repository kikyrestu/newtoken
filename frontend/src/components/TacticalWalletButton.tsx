import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { NoWalletModal } from './NoWalletModal';
import { WALLET_DISCONNECTED_KEY } from './WalletContextProvider';


interface TacticalWalletButtonProps {
    compact?: boolean;
}

/**
 * Tactical styled wallet button - DIRECT CONNECT (no modal)
 * Bypasses WalletModalProvider to avoid modal auto-close issues
 */
export const TacticalWalletButton: React.FC<TacticalWalletButtonProps> = ({ compact = false }) => {
    const { connected, publicKey, disconnect, connecting, wallet, wallets, select, connect } = useWallet();
    const [showNoWalletModal, setShowNoWalletModal] = useState(false);

    // Detect if on mobile device
    const isMobile = typeof window !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Find Mobile Wallet Adapter (for mobile browser connection)
    const mobileWalletAdapter = wallets.find(w =>
        w.adapter.name === 'Mobile Wallet Adapter' &&
        (w.adapter.readyState === WalletReadyState.Loadable || w.adapter.readyState === WalletReadyState.Installed)
    );

    // Find first TRULY installed wallet (Installed state only, not Loadable)
    // Loadable means it CAN be loaded but isn't necessarily present
    // This prevents triggering browser's Standard Wallet modal on mobile
    const installedWallet = wallets.find(w =>
        w.adapter.readyState === WalletReadyState.Installed
    );

    // On mobile: prefer MWA if no installed wallet detected (user is in regular browser)
    // On desktop: only use installed wallets
    const preferredWallet = isMobile && !installedWallet ? mobileWalletAdapter : installedWallet;



    // Auto-select preferred wallet on mount ONCE (MWA on mobile, installed wallet on desktop)
    // Guard with a ref to prevent repeated selections that trigger reconnection loops
    const autoSelectedRef = React.useRef(false);
    useEffect(() => {
        if (!wallet && preferredWallet && !autoSelectedRef.current) {
            autoSelectedRef.current = true;
            select(preferredWallet.adapter.name);
        }
    }, [wallet, preferredWallet, select]);

    // Format wallet address: 4xxx...xxxx4
    const formatAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const handleClick = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();


        if (connected) {
            try {
                await disconnect();
            } catch (err) {
                console.error('[TacticalWalletButton] Disconnect error:', err);
            }
        } else if (preferredWallet) {
            try {
                // Select wallet first if not already selected
                if (!wallet || wallet.adapter.name !== preferredWallet.adapter.name) {
                    select(preferredWallet.adapter.name);
                    // Wait a bit for selection to take effect
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // SECURITY FIX (W3): Add timeout for wallet connection (30 seconds)
                const CONNECT_TIMEOUT_MS = 30000;
                const connectPromise = connect();
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout - wallet did not respond in 30 seconds')), CONNECT_TIMEOUT_MS)
                );

                await Promise.race([connectPromise, timeoutPromise]);

                // Clear disconnect flag so autoConnect works next time
                localStorage.removeItem(WALLET_DISCONNECTED_KEY);
            } catch (err: any) {
                console.error('[TacticalWalletButton] Connect error:', err);
                // Show timeout-specific message
                if (err?.message?.includes('timeout')) {
                    alert('Wallet connection timed out. Please make sure your wallet app is open and try again.');
                } else if (isMobile && mobileWalletAdapter) {
                    // User rejected or other error - on mobile MWA failure, show modal
                    setShowNoWalletModal(true);
                } else if (err?.name !== 'WalletConnectionError') {
                    alert(`Wallet connection failed: ${err?.message || 'Unknown error'}`);
                }
            }
        } else {
            setShowNoWalletModal(true);
        }
    }, [connected, connecting, wallet, preferredWallet, isMobile, mobileWalletAdapter, select, connect, disconnect]);

    // Handle disconnect explicitly - separate function to ensure it works
    // IMPORTANT: This hook MUST be before any conditional returns to satisfy React Rules of Hooks
    const handleDisconnect = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        try {
            // Set flag FIRST so WalletProvider knows not to auto-reconnect
            localStorage.setItem(WALLET_DISCONNECTED_KEY, 'true');

            // Disconnect wallet
            await disconnect();

            // Reload page to reset WalletProvider state completely
            window.location.reload();
        } catch (err) {
            console.error('[TacticalWalletButton] Disconnect error:', err);
            // Still reload even on error to reset state
            window.location.reload();
        }
    }, [disconnect]);

    // No wallet installed - show install button with modal
    // IMPORTANT: This early return is now AFTER all hooks
    if (!installedWallet) {
        return (
            <>
                <button
                    onClick={() => setShowNoWalletModal(true)}
                    className={`group relative flex items-center gap-2 bg-black/30 backdrop-blur-sm text-gray-300 hover:text-[#00ff41] transition-all duration-300 overflow-hidden border border-yellow-500/50 hover:border-[#00ff41] animate-pulse ${compact ? 'px-2.5 py-1.5' : 'px-4 py-2.5'}`}
                    style={{
                        clipPath: compact ? 'none' : 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                        borderRadius: compact ? '4px' : undefined
                    }}
                >
                    <AlertCircle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-yellow-400 relative z-10`} />
                    <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold tracking-widest uppercase relative z-10`}>
                        {compact ? 'Install' : 'Install Wallet'}
                    </span>
                </button>
                {createPortal(
                    <NoWalletModal
                        isOpen={showNoWalletModal}
                        onClose={() => setShowNoWalletModal(false)}
                    />,
                    document.body
                )}
            </>
        );
    }


    // Render connected state - show address with separate disconnect button
    if (connected && publicKey) {
        return (
            <div className={`flex items-center gap-1 ${compact ? '' : 'gap-2'}`}>
                {/* Address display */}
                <div
                    className={`flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-[#00ff41] border border-[#00ff41]/30 ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}
                    style={{
                        clipPath: compact ? 'none' : 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                        borderRadius: compact ? '4px' : undefined
                    }}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
                    <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold tracking-wider`}>
                        {formatAddress(publicKey.toBase58())}
                    </span>
                </div>

                {/* Disconnect button */}
                <button
                    onClick={handleDisconnect}
                    className={`group flex items-center justify-center bg-black/30 backdrop-blur-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 border border-red-500/30 hover:border-red-500 ${compact ? 'p-1.5' : 'p-2'}`}
                    style={{
                        clipPath: compact ? 'none' : 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                        borderRadius: compact ? '4px' : undefined
                    }}
                    title="Disconnect Wallet"
                >
                    <LogOut className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={connecting}
            className={`group relative flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-gray-300 hover:text-[#00ff41] transition-all duration-300 overflow-hidden border border-[#00ff41]/30 hover:border-[#00ff41] ${compact ? 'px-2.5 py-1.5' : 'px-4 py-2.5'}`}
            style={{
                clipPath: compact ? 'none' : 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                borderRadius: compact ? '4px' : undefined
            }}
        >
            {/* Hover Background Slide */}
            <div className="absolute inset-0 bg-[#00ff41]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />

            {/* Icon */}
            <Wallet className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-[#00ff41] relative z-10`} />

            {/* Text */}
            <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold tracking-wider uppercase relative z-10`}>
                {connecting ? (
                    compact ? '...' : 'Connecting...'
                ) : (
                    compact ? 'Connect' : `Connect ${installedWallet?.adapter.name || 'Wallet'}`
                )}
            </span>

            {/* Tech Decor - corner accent */}
            <div className="absolute right-1 bottom-1 w-1 h-1 bg-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Top accent line */}
            <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-[#00ff41]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
};

export default TacticalWalletButton;

