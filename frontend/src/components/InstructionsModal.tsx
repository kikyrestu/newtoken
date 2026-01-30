import React from 'react';
import { X, Rocket, Target, Clock, Wallet, Gift, CheckCircle } from 'lucide-react';

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isClosing?: boolean;
}

/**
 * GlassMorphism styled Instructions modal
 * Shows how to participate in the mission
 */
export const InstructionsModal: React.FC<InstructionsModalProps> = ({
    isOpen,
    onClose,
    isClosing = false
}) => {
    if (!isOpen) return null;

    const steps = [
        {
            icon: Wallet,
            title: "1. Connect Wallet",
            desc: "Connect your Solana wallet (Phantom, Solflare, etc.) to access the mission control panel."
        },
        {
            icon: Target,
            title: "2. Choose Your Tier",
            desc: "Select Observer ($25), Operator ($150), or Elite ($250) based on your commitment level."
        },
        {
            icon: Clock,
            title: "3. Lock Tokens",
            desc: "Your tokens will be locked in a secure escrow until the mission countdown ends."
        },
        {
            icon: Rocket,
            title: "4. Join the Mission",
            desc: "Participate in the exclusive drone mission with your tier-based access level."
        },
        {
            icon: Gift,
            title: "5. Claim Rewards",
            desc: "After the mission, unlock your tokens and receive your tier-specific rewards."
        }
    ];

    return (
        <div className="w-full max-w-xl pointer-events-auto">
            {/* Styled Modal with TV Animation */}
            <div
                className={`relative bg-[#0a0c10]/95 border border-[#00ff41]/60 p-6 rounded-lg 
                    overflow-hidden backdrop-blur-md shadow-[0_0_40px_rgba(0,255,65,0.3)]
                    ${isClosing ? 'animate-tv-off' : 'animate-tv-on'}`}
                style={{ transformOrigin: 'center center' }}
            >
                {/* Top accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[3px] bg-[#00ff41] shadow-[0_0_15px_#00ff41] rounded-full" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Rocket className="w-6 h-6 text-[#00ff41]" />
                    <h2 className="text-lg font-bold text-white">
                        Mission <span className="text-[#00ff41]">Instructions</span>
                    </h2>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00ff41]/10 flex items-center justify-center mt-0.5">
                                <step.icon className="w-4 h-4 text-[#00ff41]" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-white mb-0.5">{step.title}</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer note */}
                <div className="mt-6 pt-4 border-t border-[#00ff41]/20">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle className="w-4 h-4 text-[#00ff41]" />
                        <span>Early participants get up to 20% discount on all tiers!</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructionsModal;
