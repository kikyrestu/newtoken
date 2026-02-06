import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut } from 'lucide-react';

console.log('[TacticalWalletButton] Module loaded');

/**
 * Tactical styled wallet button matching Safety Protocol aesthetic
 */
export const TacticalWalletButton: React.FC = () => {
    const { connected, publicKey, disconnect, connecting, wallet, wallets } = useWallet();
    const { visible, setVisible } = useWalletModal();

    // Log wallet state on every render
    console.log('[TacticalWalletButton] Rendering with state:', {
        connected,
        connecting,
        publicKey: publicKey?.toBase58() || null,
        wallet: wallet?.adapter?.name || null,
        modalVisible: visible,
        availableWallets: wallets.map(w => ({
            name: w.adapter.name,
            readyState: w.adapter.readyState,
            connected: w.adapter.connected
        }))
    });

    // Log when wallet state changes
    useEffect(() => {
        console.log('[TacticalWalletButton] Wallet state changed:', {
            connected,
            connecting,
            publicKey: publicKey?.toBase58() || null,
            walletName: wallet?.adapter?.name || null
        });
    }, [connected, connecting, publicKey, wallet]);

    // Log available wallets on mount
    useEffect(() => {
        console.log('[TacticalWalletButton] Available wallets:', wallets.map(w => ({
            name: w.adapter.name,
            readyState: w.adapter.readyState,
            icon: w.adapter.icon ? 'has icon' : 'no icon'
        })));

        if (wallets.length === 0) {
            console.warn('[TacticalWalletButton] No wallets detected! Check if Phantom/Solflare extension is installed');
        }
    }, [wallets]);

    // Format wallet address: 4xxx...xxxx4
    const formatAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const handleClick = (e: React.MouseEvent) => {
        // CRITICAL: Stop event propagation to prevent modal from immediately closing
        e.stopPropagation();
        e.preventDefault();

        console.log('[TacticalWalletButton] Button clicked! Current state:', { connected, connecting, visible });

        if (connected) {
            console.log('[TacticalWalletButton] Disconnecting wallet...');
            disconnect().then(() => {
                console.log('[TacticalWalletButton] Wallet disconnected successfully');
            }).catch((err) => {
                console.error('[TacticalWalletButton] Disconnect error:', err);
            });
        } else {
            console.log('[TacticalWalletButton] Opening wallet modal...');
            // Use setTimeout to ensure modal opens after click event fully completes
            setTimeout(() => {
                setVisible(true);
                console.log('[TacticalWalletButton] setVisible(true) called after timeout');
            }, 10);
        }
    };

    // Listen for modal visibility changes
    useEffect(() => {
        console.log('[TacticalWalletButton] Modal visibility changed:', visible);
    }, [visible]);

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
                    'Connect Wallet'
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
