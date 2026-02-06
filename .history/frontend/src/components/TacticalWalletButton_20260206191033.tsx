import React, { useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';

console.log('[TacticalWalletButton] Module loaded');

/**
 * Tactical styled wallet button - DIRECT CONNECT (no modal)
 * Bypasses WalletModalProvider to avoid modal auto-close issues
 */
export const TacticalWalletButton: React.FC = () => {
    const { connected, publicKey, disconnect, connecting, wallet, wallets, select, connect } = useWallet();

    // Find first installed wallet (usually Phantom)
    const installedWallet = wallets.find(w =>
        w.adapter.readyState === WalletReadyState.Installed ||
        w.adapter.readyState === WalletReadyState.Loadable
    );

    // Log wallet state on every render
    console.log('[TacticalWalletButton] Rendering:', {
        connected,
        connecting,
        publicKey: publicKey?.toBase58() || null,
        wallet: wallet?.adapter?.name || null,
        installedWallet: installedWallet?.adapter?.name || 'none',
        availableWallets: wallets.map(w => ({
            name: w.adapter.name,
            readyState: w.adapter.readyState,
        }))
    });

    // Auto-select first installed wallet on mount
    useEffect(() => {
        if (!wallet && installedWallet) {
            console.log('[TacticalWalletButton] Auto-selecting:', installedWallet.adapter.name);
            select(installedWallet.adapter.name);
        }
    }, [wallet, installedWallet, select]);

    // Format wallet address: 4xxx...xxxx4
    const formatAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const handleClick = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        console.log('[TacticalWalletButton] Button clicked!', { connected, connecting });

        if (connected) {
            console.log('[TacticalWalletButton] Disconnecting...');
            try {
                await disconnect();
                console.log('[TacticalWalletButton] Disconnected successfully');
            } catch (err) {
                console.error('[TacticalWalletButton] Disconnect error:', err);
            }
        } else if (installedWallet) {
            console.log('[TacticalWalletButton] Connecting to:', installedWallet.adapter.name);
            try {
                // Select wallet first if not already selected
                if (!wallet || wallet.adapter.name !== installedWallet.adapter.name) {
                    select(installedWallet.adapter.name);
                    // Wait a bit for selection to take effect
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                // Now connect - this should trigger the extension popup!
                await connect();
                console.log('[TacticalWalletButton] Connection initiated!');
            } catch (err: any) {
                console.error('[TacticalWalletButton] Connect error:', err);
                // User rejected or other error
                if (err?.name !== 'WalletConnectionError') {
                    alert(`Wallet connection failed: ${err?.message || 'Unknown error'}`);
                }
            }
        } else {
            console.log('[TacticalWalletButton] No wallet installed!');
            window.open('https://phantom.app/', '_blank');
        }
    }, [connected, connecting, wallet, installedWallet, select, connect, disconnect]);

    // No wallet installed - show install button
    if (!installedWallet) {
        return (
            <button
                onClick={() => window.open('https://phantom.app/', '_blank')}
                className="group relative flex items-center gap-2 px-4 py-2.5 bg-black/30 backdrop-blur-sm text-gray-300 hover:text-[#00ff41] transition-all duration-300 overflow-hidden border border-[#00ff41]/30 hover:border-[#00ff41]"
                style={{
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
                }}
            >
                <AlertCircle className="w-4 h-4 text-yellow-400 relative z-10" />
                <span className="text-xs font-bold tracking-widest uppercase relative z-10">
                    Install Phantom
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={connecting}
            className="group relative flex items-center gap-2 px-4 py-2.5 bg-black/30 backdrop-blur-sm text-gray-300 hover:text-[#00ff41] transition-all duration-300 overflow-hidden border border-[#00ff41]/30 hover:border-[#00ff41]"
            style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
            }}
        >
            {/* Hover Background Slide */}
            <div className="absolute inset-0 bg-[#00ff41]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />

            {/* Icon */}
            {connected ? (
                <LogOut className="w-4 h-4 text-[#00ff41] relative z-10" />
            ) : (
                <Wallet className="w-4 h-4 text-[#00ff41] relative z-10" />
            )}

            {/* Text */}
            <span className="text-xs font-bold tracking-widest uppercase relative z-10">
                {connecting ? (
                    'Connecting...'
                ) : connected && publicKey ? (
                    formatAddress(publicKey.toBase58())
                ) : (
                    `Connect ${installedWallet.adapter.name}`
                )}
            </span>

            {/* Connected indicator dot */}
            {connected && (
                <div className="relative z-10 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
                </div>
            )}

            {/* Tech Decor - corner accent */}
            <div className="absolute right-1 bottom-1 w-1 h-1 bg-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Top accent line */}
            <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-[#00ff41]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
};

export default TacticalWalletButton;

