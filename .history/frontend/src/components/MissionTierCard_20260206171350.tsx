import React from 'react';
import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { TIERS } from '../hooks/useLockProgram';
import type { TierType } from '../hooks/useLockProgram';
import { useTokenPrice } from '../hooks/useTokenPrice';

interface MissionTierCardProps {
    tier: TierType;
    title: ReactNode;
    // description is now external to the card logic
    onSuccess?: (signature: string) => void;
    isLocked?: boolean;
    lockedSignature?: string | null;
    onClick?: () => void; // New prop for modal trigger
}

export const MissionTierCard: React.FC<MissionTierCardProps> = ({
    tier,
    title,
    onClick,
    isLocked = false,
    lockedSignature: _lockedSignature = null
}) => {
    const { pricing } = useTokenPrice();

    const tierPricing = pricing?.[tier];
    const tierInfo = TIERS[tier];

    // Badge names per Vanja's requirements
    const badgeNames = {
        spectator: 'SPECTATOR',
        operator: 'RECON OPERATOR',
        elite: 'ELITE OPERATOR'
    };

    // Taglines per Vanja's requirements
    const taglines = {
        spectator: 'See the Mission Unfold',
        operator: 'Seek. Identify. Mark.',
        elite: 'Seek. Identify. Execute.'
    };

    // Card status logic
    const isSuccess = isLocked;
    const borderClass = isSuccess
        ? 'border-[#00ff41] shadow-[0_0_30px_rgba(0,255,65,0.4)]'
        : 'border-[#333] hover:border-[#00ff41] group-hover:shadow-[0_0_25px_rgba(0,255,65,0.15)]';

    return (
        <div
            onClick={onClick}
            className={`
                group cursor-pointer flex flex-col items-center w-full
                transition-transform duration-300 hover:scale-[1.02]
            `}
        >
            {/* Card Body */}
            <div
                className={`
                    w-full bg-[#0a0c10]/90 border rounded-lg p-5 md:p-6
                    relative overflow-hidden backdrop-blur-md text-left
                    min-h-[140px] flex flex-col justify-between
                    ${borderClass} transition-all duration-300
                `}
            >
                {/* Top Green Line Accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-[#00ff41] shadow-[0_0_15px_#00ff41] rounded-full" />

                {/* Title & Badge Row */}
                <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-white font-bold text-lg md:text-xl">
                            {title}
                        </h3>
                        {/* Tier Badge - now in flow, not absolute */}
                        <span className={`
                            text-[10px] px-2 py-1 rounded border font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0
                            ${tier === 'elite' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                tier === 'operator' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                    'bg-blue-500/10 border-blue-500/30 text-blue-400'}
                        `}>
                            {badgeNames[tier]}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{taglines[tier]}</p>

                    {/* Price Display - Only current price, no strikethrough */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#00ff41]">
                            ${tierPricing?.current_price ?? tierPricing?.usd ?? tierInfo.usd}
                        </span>
                    </div>
                </div>

                {/* Locked Status */}
                {isSuccess ? (
                    <div className="mt-4 w-full py-2 bg-[#00ff41]/10 border border-[#00ff41] rounded flex items-center justify-center gap-2 text-[#00ff41] font-bold text-sm">
                        <Lock size={14} /> LOCKED
                    </div>
                ) : (
                    <div className="mt-4 w-full py-2 bg-[#333]/50 border border-[#444] rounded flex items-center justify-center gap-2 text-gray-500 text-sm group-hover:bg-[#00ff41] group-hover:text-black group-hover:border-[#00ff41] transition-colors">
                        <Lock size={14} /> LOCKED
                    </div>
                )}

                {/* Decorative Corner */}
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#00ff41]/20 group-hover:border-[#00ff41]/60 transition-colors" />
            </div>
        </div>
    );
};

export default MissionTierCard;
