import React from 'react';
import { X, Target, Wallet, CheckCircle, Lock, RefreshCw, Zap } from 'lucide-react';
import { ModalNavTabs } from './ModalNavTabs';

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isClosing?: boolean;
    onNavigate?: (tab: 'safety' | 'participation' | 'about') => void;
}

/**
 * GlassMorphism styled Instructions modal
 * Shows how to participate in the mission
 */
export const InstructionsModal: React.FC<InstructionsModalProps> = ({
    isOpen,
    onClose,
    isClosing = false,
    onNavigate
}) => {
    if (!isOpen) return null;

    const steps = [
        {
            icon: Wallet,
            title: "Connect Wallet",
            desc: "Connect your Solana Wallet (Phantom, Solflare, or compatible) to access the Mission Control Center."
        },
        {
            icon: Target,
            title: "Choose your Mission Role",
            desc: "Secure your spot as Observer, Recon Operator, or Elite Operator."
        },
        {
            icon: Lock,
            title: "Lock Mission Tokens",
            desc: "The required Mission Tokens are locked in escrow."
        },
        {
            icon: CheckCircle,
            title: "Confirm Participation",
            desc: "When the countdown ends, the mission starts within 15 minutes. You must confirm participation in your Wallet inside the Mission Control Center."
        },
        {
            icon: RefreshCw,
            title: "No confirmation → Refund",
            desc: "Tokens refunded at current market value. Remaining locked Tokens are burned. If technical issues occur (e.g. signal loss), an automatic refund is issued."
        },
        {
            icon: Zap,
            title: "Join the Mission",
            desc: "Participate in the exclusive drone mission. Upon mission completion: Tokens of confirmed participants are permanently burned. Participants receive rewards equivalent to 3% of the burned Token amount."
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
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors z-50 pointer-events-auto cursor-pointer"
                >
                    <X size={20} />
                </button>

                {/* Nav Tabs */}
                {onNavigate && <ModalNavTabs active="participation" onNavigate={onNavigate} />}

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    {/* Icon matching Safety modal style */}
                    <Target className="w-6 h-6 text-[#00ff41]" />
                    <div className="w-2 h-8 bg-[#00ff41]" />
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                        Mission <span className="text-[#00ff41]">Participation</span>
                    </h2>
                </div>

                {/* Steps */}
                <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-4 group">
                            <div className="flex-shrink-0 mt-1">
                                <step.icon className="w-5 h-5 text-[#00ff41] opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">{step.title}</h4>
                                <p className="text-xs text-gray-400 leading-relaxed text-justify">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default InstructionsModal;
