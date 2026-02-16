import React, { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { X, AlertCircle, Gift, ChevronRight, Home, Loader2, CheckCircle } from 'lucide-react';
import { useLockProgram } from '../hooks/useLockProgram';
import type { TierType } from '../hooks/useLockProgram';
import { useTokenPrice } from '../hooks/useTokenPrice';

interface TierDetailModalProps {
    tier: TierType;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (signature: string) => void;
}

type ModalStep = 'details' | 'confirm' | 'processing' | 'success';

// Tier-specific content based on Vanja's requirements
const TIER_CONTENT = {
    spectator: {
        displayName: 'Observer',
        tagline: 'See the Mission Unfold',
        features: [
            'Monitor active drones in real time',
            'Live access to drone camera feeds',
            'Tactical overview of the mission area',
            'Select and follow mission assets',
            'Tag objects of interest within target zone',
            'Earn Mission Points for future benefits'
        ],
        rewards: ['3% Token Reward', 'Early Access Discount'],
        roleFocus: 'Role focus: situational awareness and visual intelligence',
        maxSlots: 1000,
        cta: 'Secure your Observer Slot'
    },
    operator: {
        displayName: 'Recon Drone Operator',
        tagline: 'Seek. Identify. Mark.',
        features: [
            'Live control of one assigned drone',
            'Real-time flight and camera operation',
            'Expanded tactical overview of mission area',
            'Identify and tag objects in the target zone',
            'Automated indirect command interaction',
            'Earn increased Mission Points'
        ],
        rewards: ['3% Token Reward', 'Early Access Discount'],
        roleFocus: 'Role focus: reconnaissance and supervised operational support',
        maxSlots: 700,
        cta: 'Claim your Recon Operator Position'
    },
    elite: {
        displayName: 'Advanced Drone Operator',
        tagline: 'Seek. Identify. Execute.',
        features: [
            'Live control of one assigned drone',
            'Real-time flight and camera operation',
            'Expanded tactical overview with priority tasking',
            'High-activity role in mission execution',
            'Priority assignments and direct command interaction',
            'Earn priority Mission Points'
        ],
        rewards: ['3% Token Reward', 'Early Access Discount'],
        roleFocus: 'Role focus: execution, intervention, and mission continuity',
        maxSlots: 300,
        cta: 'Secure your Elite Operator Slot'
    }
};

export const TierDetailModal: React.FC<TierDetailModalProps> = ({
    tier,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { connected } = useWallet();
    const { lockTokens, getTokenBalance, formatTokenAmount, getSolscanUrl, loading } = useLockProgram();
    const { pricing, formatTokens } = useTokenPrice();

    const [step, setStep] = useState<ModalStep>('details');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);
    const [assignedSlot, setAssignedSlot] = useState<number | null>(null);

    const tierContent = TIER_CONTENT[tier];
    const tierPricing = pricing?.[tier];

    const handleBuyClick = useCallback(() => {
        if (!connected) {
            setErrorMessage('Please connect your wallet to continue');
            return;
        }
        // Move to confirmation step
        setStep('confirm');
        setErrorMessage(null);
    }, [connected]);

    const handleConfirmPurchase = useCallback(async () => {
        if (!tierPricing || tierPricing.tokens <= 0) {
            setErrorMessage('Price not available. Please try again later.');
            return;
        }

        setStep('processing');
        setErrorMessage(null);

        try {
            const requiredAmount = BigInt(tierPricing.tokens);

            // Check balance
            const balance = await getTokenBalance();
            if (balance < requiredAmount) {
                setErrorMessage(
                    `Insufficient balance! You need ${formatTokens(tierPricing.tokens)} tokens. ` +
                    `Current balance: ${formatTokenAmount(balance)}`
                );
                setStep('confirm');
                return;
            }

            // Execute lock
            const result = await lockTokens(tier, requiredAmount);

            if (result) {
                setTxSignature(result.signature);
                // Simulate slot assignment (would come from backend)
                setAssignedSlot(Math.floor(Math.random() * 100) + 1);
                setStep('success');
                onSuccess?.(result.signature);
            } else {
                setErrorMessage('Transaction failed. Please try again.');
                setStep('confirm');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'An error occurred');
            setStep('confirm');
        }
    }, [tierPricing, lockTokens, getTokenBalance, formatTokens, formatTokenAmount, tier, onSuccess]);

    const handleClose = () => {
        setStep('details');
        setErrorMessage(null);
        setTxSignature(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
            <div className="relative w-full max-w-md bg-[#0a0c10] border border-[#00ff41]/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,255,65,0.1)]">

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-50 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto cursor-pointer"
                >
                    <X size={20} />
                </button>

                {/* Step 1: Details */}
                {step === 'details' && (
                    <div className="p-6">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-1">{tierContent.displayName}</h2>
                            <p className="text-[#00ff41]">{tierContent.tagline}</p>
                        </div>

                        {/* Features */}
                        <div className="mb-4">
                            {tierContent.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-2 mb-2 text-gray-300 text-sm">
                                    <span className="text-[#00ff41] mt-0.5">›</span>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Role Focus */}
                        <div className="mb-4 p-3 bg-[#0a0c10] border border-gray-800 rounded mx-auto text-center">
                            <i className="text-xs text-blue-300">{tierContent.roleFocus}</i>
                        </div>

                        {/* Rewards */}
                        <div className="mb-4 p-3 bg-[#00ff41]/5 border border-[#00ff41]/20 rounded-lg">
                            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Gift size={14} className="text-[#00ff41]" /> Rewards:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tierContent.rewards.map((reward, i) => (
                                    <span key={i} className="text-xs bg-[#00ff41]/10 text-[#00ff41] px-2 py-1 rounded">
                                        {reward}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <p className="text-center text-[#00ff41] text-sm font-bold mb-4">
                            {tierContent.cta}
                        </p>

                        {/* Price Display */}
                        {tierPricing && (
                            <div className="text-center mb-4">
                                <div className="flex items-center justify-center gap-2 text-sm">
                                    <span className="text-gray-500 line-through">
                                        ${tier === 'spectator' ? 25 : tier === 'operator' ? 175 : 275}
                                    </span>
                                    <span className="text-[#00ff41] font-bold text-lg">
                                        ${tierPricing.current_price}
                                    </span>
                                </div>
                                <div className="text-gray-400 text-xs mt-1">
                                    ({tierPricing.tokens_formatted} Token)
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle size={16} />
                                {errorMessage}
                            </div>
                        )}

                        {/* BUY Button */}
                        <button
                            onClick={handleBuyClick}
                            className="w-full py-3 bg-transparent border-2 border-[#00ff41] text-[#00ff41] font-bold rounded-lg
                                hover:bg-[#00ff41] hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            BUY <ChevronRight size={18} />
                        </button>
                    </div>
                )}

                {/* Step 2: Confirm Token Amount */}
                {step === 'confirm' && (
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-1">{tierContent.displayName}</h2>
                            <p className="text-[#00ff41]">{tierContent.tagline}</p>
                        </div>

                        <p className="text-gray-400 text-center mb-6">
                            Use tokens to purchase your slot—they'll be locked securely upon buy.
                        </p>

                        {/* Token Amount Display */}
                        {tierPricing && (
                            <div className="text-center p-6 bg-[#00ff41]/5 border border-[#00ff41]/30 rounded-lg mb-6">
                                <div className="text-3xl font-bold text-white mb-2">
                                    {tierPricing.tokens_formatted} Token
                                </div>
                                <div className="text-[#00ff41]">~ ${tierPricing.current_price}</div>
                            </div>
                        )}

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle size={16} />
                                {errorMessage}
                            </div>
                        )}

                        {/* Secure Spot Button */}
                        <button
                            onClick={handleConfirmPurchase}
                            disabled={loading}
                            className="w-full py-3 bg-transparent border-2 border-[#00ff41] text-[#00ff41] font-bold rounded-lg
                                hover:bg-[#00ff41] hover:text-black transition-all duration-300 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Secure Spot'}
                        </button>

                        <button
                            onClick={() => setStep('details')}
                            className="w-full mt-3 py-2 text-gray-400 hover:text-white text-sm"
                        >
                            ← Back
                        </button>
                    </div>
                )}

                {/* Step 3: Processing */}
                {step === 'processing' && (
                    <div className="p-6 text-center">
                        <Loader2 className="w-16 h-16 text-[#00ff41] animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Processing Transaction</h2>
                        <p className="text-gray-400">Please confirm in your wallet...</p>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 'success' && (
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <CheckCircle className="w-16 h-16 text-[#00ff41] mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-[#00ff41] mb-2">Congratulations!</h2>
                            <p className="text-white text-lg mb-1">
                                You are {tierContent.displayName} #{assignedSlot}
                            </p>
                            <p className="text-gray-400">
                                The mission starts in <span className="text-[#00ff41]">[25]</span> days
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                                You locked {tierPricing?.tokens_formatted} tokens until unlock date
                            </p>
                        </div>

                        {/* TX Link */}
                        {txSignature && (
                            <a
                                href={getSolscanUrl(txSignature)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-center text-xs text-[#00ff41]/50 hover:text-[#00ff41] mb-4"
                            >
                                View Transaction on Solscan ↗
                            </a>
                        )}

                        {/* Control Center Button */}
                        <button
                            onClick={handleClose}
                            className="w-full py-3 bg-[#00ff41] text-black font-bold rounded-lg
                                hover:bg-[#00ff41]/80 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <Home size={18} /> Control Center
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TierDetailModal;
