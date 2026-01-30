import React, { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Lock } from 'lucide-react';
import { useLockProgram, TIERS } from '../hooks/useLockProgram';
import type { TierType } from '../hooks/useLockProgram';
import { useTokenPrice } from '../hooks/useTokenPrice';

// Demo Mode - skip balance checks for UI testing
const DEMO_MODE = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

interface MissionTierCardProps {
    tier: TierType;
    title: ReactNode;
    description: ReactNode;
    cardNumber: string;
    onSuccess?: (signature: string) => void;
}

type CardStatus = 'idle' | 'checking' | 'confirming' | 'success' | 'error';

export const MissionTierCard: React.FC<MissionTierCardProps> = ({
    tier,
    title,
    description,
    cardNumber,
    onSuccess
}) => {
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();
    const { lockTokens, getTokenBalance, formatTokenAmount, loading, error: lockError } = useLockProgram();
    const { pricing, formatTokens, isPriceAvailable } = useTokenPrice();

    const [status, setStatus] = useState<CardStatus>('idle');
    const [txSignature, setTxSignature] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const tierPricing = pricing?.[tier];
    const tierInfo = TIERS[tier];

    const handleBuyClick = useCallback(async () => {
        // 1. Connect wallet if not connected
        if (!connected) {
            setVisible(true);
            return;
        }

        // 2. Check if pricing is available
        if (!tierPricing || tierPricing.tokens <= 0) {
            setErrorMessage('Price feed unavailable. Please try again later.');
            setStatus('error');
            return;
        }

        // 3. Check balance (skip in Demo Mode)
        setStatus('checking');
        setErrorMessage(null);

        try {
            // Skip balance check in Demo Mode
            if (!DEMO_MODE) {
                const balance = await getTokenBalance();
                const requiredAmount = BigInt(tierPricing.tokens);

                if (balance < requiredAmount) {
                    setErrorMessage(
                        `Insufficient balance! You need ${formatTokens(tierPricing.tokens)} tokens. ` +
                        `Current balance: ${formatTokenAmount(balance)}`
                    );
                    setStatus('error');
                    return;
                }
            }

            // 4. Execute lock
            setStatus('confirming');
            const result = await lockTokens(tier, requiredAmount);

            if (result) {
                setTxSignature(result.signature);
                setStatus('success');
                onSuccess?.(result.signature);
            } else {
                setErrorMessage(lockError || 'Transaction failed');
                setStatus('error');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'An error occurred');
            setStatus('error');
        }
    }, [
        connected,
        tierPricing,
        lockTokens,
        getTokenBalance,
        formatTokens,
        formatTokenAmount,
        lockError,
        tier,
        onSuccess,
        setVisible
    ]);

    const handleRetry = useCallback(() => {
        setStatus('idle');
        setErrorMessage(null);
        setTxSignature(null);
    }, []);

    const getButtonText = () => {
        if (!connected) return <><Lock className="w-4 h-4" /> LOCKED</>;
        switch (status) {
            case 'checking': return 'Checking Balance...';
            case 'confirming': return 'Confirm in Wallet...';
            case 'success': return '✓ Mission Locked!';
            case 'error': return 'Try Again';
            default: return 'Lock Tokens';
        }
    };

    const getCardBorderClass = () => {
        switch (status) {
            case 'success': return 'border-[#4fffa0] shadow-[0_0_30px_rgba(79,255,160,0.4)]';
            case 'error': return 'border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.2)]';
            default: return 'border-[#333] hover:border-[#4fffa0]';
        }
    };

    return (
        <div className="group cursor-pointer flex flex-col items-center">
            {/* Number above card - only show if provided */}
            {cardNumber && <span className="text-2xl text-white/50 mb-3 font-serif">{cardNumber}</span>}

            {/* Card Body */}
            <div
                className={`
                    w-full bg-[#0a0c10]/90 border p-4 md:p-5 rounded-lg 
                    transition-all duration-300 relative overflow-hidden backdrop-blur-md text-left
                    flex flex-col min-h-[180px] md:min-h-[200px]
                    ${getCardBorderClass()}
                `}
            >
                {/* Top Green Line Accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-[#4fffa0] shadow-[0_0_15px_#4fffa0] rounded-full" />

                {/* Tier Badge */}
                <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <span className={`
                        text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider
                        ${tier === 'elite' ? 'bg-yellow-500/20 text-yellow-400' :
                            tier === 'operator' ? 'bg-green-500/20 text-green-400' :
                                'bg-blue-500/20 text-blue-400'}
                    `}>
                        {tierInfo.name}
                    </span>
                </div>

                {/* Content */}
                <h3 className="text-white font-bold text-base md:text-lg mb-2 pr-24">
                    {title}
                    <span className="text-[#4fffa0] ml-2">${tierPricing?.usd || tierInfo.usd}</span>
                </h3>

                <p className="text-xs md:text-sm text-gray-400 leading-relaxed mb-2 flex-1">
                    {description}
                </p>

                {/* Token Amount */}
                {tierPricing && isPriceAvailable(tier) && (
                    <div className="text-xs text-[#4fffa0]/70 mb-3 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 bg-[#4fffa0] rounded-full animate-pulse" />
                        ≈ {tierPricing.tokens_formatted} Tokens
                    </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                    <div className="mb-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-400">
                        {errorMessage}
                    </div>
                )}

                <button
                    onClick={connected ? (status === 'error' ? handleRetry : handleBuyClick) : undefined}
                    disabled={!connected || loading || status === 'success' || status === 'confirming'}
                    className={`
                        w-full py-2.5 px-3 rounded-md font-bold text-sm transition-all duration-300
                        flex items-center justify-center gap-2
                        ${!connected
                            ? 'locked-btn !cursor-not-allowed'
                            : status === 'success'
                                ? 'bg-[#4fffa0] text-black cursor-default'
                                : status === 'error'
                                    ? 'bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30'
                                    : 'bg-transparent border border-[#4fffa0] text-[#4fffa0] hover:bg-[#4fffa0] hover:text-black'}
                        ${(loading || status === 'confirming') ? 'opacity-50 cursor-wait' : ''}
                    `}
                >
                    {(status === 'checking' || status === 'confirming') && (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    )}
                    {getButtonText()}
                </button>

                {/* Success TX Link */}
                {txSignature && status === 'success' && (
                    <a
                        href={`https://solscan.io/tx/${txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#4fffa0]/50 hover:text-[#4fffa0] mt-3 block text-center transition-colors"
                    >
                        View Transaction on Solscan ↗
                    </a>
                )}

                {/* Lock Duration Info - hidden to save space */}
                {/*<div className="hidden sm:flex mt-2 pt-2 border-t border-white/10 justify-between text-[10px] text-gray-500">
                    <span>Lock: {tierInfo.durationDays} Days</span>
                </div>*/}

                {/* Decorative Corner */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#4fffa0]/20" />
            </div>
        </div>
    );
};

export default MissionTierCard;
