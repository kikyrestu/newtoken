import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Eye, Gamepad2, Crown } from 'lucide-react';

interface WelcomeGuideProps {
    onClose: () => void;
}

const slides = [
    {
        icon: Eye,
        tier: 'Observer',
        price: '$25',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        title: 'Watch the Mission',
        description: 'Spectate live drone feeds and choose which drones to follow in real-time. Perfect for first-time participants.',
        features: ['Live drone camera feeds', 'Choose any active drone', 'Full mission replay access']
    },
    {
        icon: Gamepad2,
        tier: 'Operator',
        price: '$150',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        title: 'Control Your Drone',
        description: 'Take direct control of your assigned drone. Fly it remotely and complete mission objectives.',
        features: ['Full drone control', 'Real-time telemetry', 'Mission completion rewards']
    },
    {
        icon: Crown,
        tier: 'Elite',
        price: '$250',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        title: 'Elite Commander',
        description: 'All Operator perks plus guaranteed slot for the next mission. The ultimate commitment.',
        features: ['Everything in Operator', 'Next mission guaranteed', 'Priority support access']
    }
];

export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            localStorage.setItem('welcome_guide_seen', 'true');
            onClose();
        }, 300);
    };

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const slide = slides[currentSlide];
    const IconComponent = slide.icon;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`relative w-full max-w-md bg-[#0a0c10]/95 border border-[#00ff41]/30 rounded-xl overflow-hidden shadow-[0_0_60px_rgba(0,255,65,0.2)] transition-transform duration-300 ${isExiting ? 'scale-95' : 'scale-100'}`}>

                {/* Top accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-[#00ff41] shadow-[0_0_15px_#00ff41] rounded-full" />

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-10"
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="p-6 pt-8">
                    {/* Slide indicator */}
                    <div className="flex justify-center gap-2 mb-6">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide
                                        ? 'w-6 bg-[#00ff41]'
                                        : 'bg-gray-600 hover:bg-gray-500'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Icon */}
                    <div className={`mx-auto w-16 h-16 rounded-full ${slide.bgColor} ${slide.borderColor} border flex items-center justify-center mb-4`}>
                        <IconComponent className={`w-8 h-8 ${slide.color}`} />
                    </div>

                    {/* Tier & Price */}
                    <div className="text-center mb-4">
                        <span className={`text-xs font-bold uppercase tracking-widest ${slide.color}`}>
                            {slide.tier}
                        </span>
                        <span className="text-white text-2xl font-bold ml-2">{slide.price}</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white text-center mb-3">
                        {slide.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
                        {slide.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                        {slide.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                <span className={`w-1.5 h-1.5 rounded-full ${slide.color.replace('text-', 'bg-')}`} />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={prevSlide}
                            disabled={currentSlide === 0}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${currentSlide === 0
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <ChevronLeft size={16} />
                            Back
                        </button>

                        <button
                            onClick={nextSlide}
                            className="flex items-center gap-1 px-6 py-2 bg-[#00ff41]/20 border border-[#00ff41]/50 text-[#00ff41] rounded-lg text-sm font-medium hover:bg-[#00ff41]/30 transition-colors"
                        >
                            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                            {currentSlide < slides.length - 1 && <ChevronRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Hook to manage welcome guide visibility
 * Only shows for non-connected wallet users who haven't seen it
 */
export const useWelcomeGuide = (isWalletConnected: boolean) => {
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        // Don't show if wallet is connected
        if (isWalletConnected) {
            setShowGuide(false);
            return;
        }

        // Check if user has already seen the guide
        const hasSeen = localStorage.getItem('welcome_guide_seen');
        if (!hasSeen) {
            // Small delay for better UX
            const timer = setTimeout(() => setShowGuide(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [isWalletConnected]);

    const closeGuide = () => setShowGuide(false);
    const resetGuide = () => {
        localStorage.removeItem('welcome_guide_seen');
        setShowGuide(true);
    };

    return { showGuide, closeGuide, resetGuide };
};

export default WelcomeGuide;
