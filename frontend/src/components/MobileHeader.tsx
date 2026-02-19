import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Shield, Info, ArrowLeftRight, LayoutDashboard, FileText } from 'lucide-react';
import { TacticalWalletButton } from './TacticalWalletButton';

interface MobileHeaderProps {
    onSafetyClick: () => void;
    onInstructionsClick: () => void;
    onAboutClick: () => void;
    onSwapClick: () => void;
    onDashboardClick: () => void;
    showDashboard: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
    onSafetyClick,
    onInstructionsClick,
    onAboutClick,
    onSwapClick,
    onDashboardClick,
    showDashboard
}) => {
    const { connected } = useWallet();

    const pills = [
        { id: 'safety', label: 'Safety', icon: Shield, onClick: onSafetyClick, active: false },
        { id: 'instructions', label: 'Instructions', icon: Info, onClick: onInstructionsClick, active: false },
        { id: 'about', label: 'About', icon: FileText, onClick: onAboutClick, active: false },
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
                {/* Logo - Same as desktop (FLY + Drone + UA) */}
                <div className="flex items-center gap-1">
                    <img
                        src="/assets/fly-text.png"
                        alt="FLY"
                        className="h-6 object-contain"
                        style={{
                            filter: 'drop-shadow(0 0 6px rgba(0,255,65,0.6)) brightness(0) invert(1)',
                        }}
                    />
                    <img
                        src="/logo.png"
                        alt="Drone"
                        className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]"
                    />
                    <img
                        src="/assets/ua-text.png"
                        alt="UA"
                        className="h-6 object-contain"
                        style={{
                            filter: 'drop-shadow(0 0 6px rgba(0,255,65,0.6)) brightness(0) invert(1)',
                        }}
                    />
                </div>

                {/* Wallet Button - Compact for mobile */}
                <TacticalWalletButton compact />
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
