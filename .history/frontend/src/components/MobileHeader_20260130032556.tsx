import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Shield, Info, ArrowLeftRight, LayoutDashboard } from 'lucide-react';
import { TacticalWalletButton } from './TacticalWalletButton';

interface MobileHeaderProps {
    onSafetyClick: () => void;
    onInstructionsClick: () => void;
    onSwapClick: () => void;
    onDashboardClick: () => void;
    showDashboard: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
    onSafetyClick,
    onInstructionsClick,
    onSwapClick,
    onDashboardClick,
    showDashboard
}) => {
    const { connected } = useWallet();

    const pills = [
        { id: 'safety', label: 'Safety', icon: Shield, onClick: onSafetyClick, active: false },
        { id: 'instructions', label: 'Instructions', icon: Info, onClick: onInstructionsClick, active: false },
        { id: 'swap', label: 'Swap', icon: ArrowLeftRight, onClick: onSwapClick, active: false },
        ...(connected ? [{
            id: 'dashboard',
            label: showDashboard ? 'Back' : 'Dashboard',
            icon: LayoutDashboard,
            onClick: onDashboardClick,
            active: showDashboard
        }] : [])
    ];

    return (
        <header className="md:hidden flex flex-col gap-2 p-2 pointer-events-auto">
            {/* Row 1: Logo + Wallet */}
            <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="w-8 h-8 rounded border border-[#00ff41]/50 bg-black/50 
                            flex items-center justify-center backdrop-blur-sm">
                            <div className="w-3 h-3 bg-[#00ff41] rounded-sm animate-pulse" />
                        </div>
                        {/* Corner accents */}
                        <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-[#00ff41]" />
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-[#00ff41]" />
                        <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l border-[#00ff41]" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-[#00ff41]" />
                    </div>
                    <div className="font-mono">
                        <div className="text-[#00ff41] text-xs font-bold tracking-wider">DEFENSE</div>
                        <div className="text-[#00ff41]/70 text-[10px] tracking-widest">PROTOCOL</div>
                    </div>
                </div>

                {/* Wallet Button */}
                <TacticalWalletButton />
            </div>

            {/* Row 2: Action Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {pills.map((pill) => {
                    const Icon = pill.icon;
                    return (
                        <button
                            key={pill.id}
                            onClick={pill.onClick}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                                border transition-all duration-200 whitespace-nowrap text-xs font-medium
                                ${pill.active
                                    ? 'bg-[#00ff41] text-black border-[#00ff41]'
                                    : 'bg-black/50 text-[#00ff41] border-[#00ff41]/50 hover:bg-[#00ff41]/20 hover:border-[#00ff41]'
                                }`}
                        >
                            <Icon size={12} />
                            {pill.label}
                        </button>
                    );
                })}
            </div>
        </header>
    );
};

export default MobileHeader;
