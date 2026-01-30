import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Eye, Gamepad2, Crown, Rocket } from 'lucide-react';

interface WelcomeGuideProps {
    onClose: () => void;
}

const slides = [
    {
        icon: Eye,
        title: "Observer",
        price: "$25",
        color: "from-blue-500/20 to-blue-600/10",
        borderColor: "border-blue-500/50",
        iconColor: "text-blue-400",
        description: "Watch the mission unfold live. Choose from all active drones in real time and experience the action from above.",
        features: ["Live drone feeds", "Real-time switching", "Mission replay access"]
    },
    {
        icon: Gamepad2,
        title: "Operator",
        price: "$150",
        color: "from-green-500/20 to-green-600/10",
        borderColor: "border-green-500/50",
        iconColor: "text-green-400",
        description: "Take control of your assigned drone. Fly it remotely in real time and complete mission objectives.",
        features: ["Full drone control", "Priority mission slots", "Operator badge"]
    },
    {
        icon: Crown,
        title: "Elite",
        price: "$250",
        color: "from-yellow-500/20 to-yellow-600/10",
        borderColor: "border-yellow-500/50",
        iconColor: "text-yellow-400",
        description: "The ultimate package. Control your drone now AND secure your spot for the next mission automatically.",
        features: ["All Operator benefits", "Next mission guaranteed", "Elite exclusive rewards"]
    }
];

export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            handleClose();
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const slide = slides[currentSlide];
    const Icon = slide.icon;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300
            ${isVisible ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'}`}
        >
            <div className={`relative w-full max-w-md transform transition-all duration-300
                ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
            >
                {/* Card */}
                <div className={`relative bg-gradient-to-br ${slide.color} 
                    border ${slide.borderColor} rounded-2xl p-6 
                    backdrop-blur-xl shadow-2xl overflow-hidden`}
                >
                    {/* Glow effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00ff41]/10 rounded-full blur-3xl" />

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white 
                            hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Slide indicator */}
                    <div className="flex justify-center gap-2 mb-6">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`w-2 h-2 rounded-full transition-all duration-300
                                    ${idx === currentSlide
                                        ? 'bg-[#00ff41] w-6'
                                        : 'bg-gray-600 hover:bg-gray-500'}`}
                            />
                        ))}
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className={`w-16 h-16 rounded-full bg-black/30 flex items-center justify-center
                            border ${slide.borderColor}`}>
                            <Icon className={`w-8 h-8 ${slide.iconColor}`} />
                        </div>
                    </div>

                    {/* Title & Price */}
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold text-white mb-1">{slide.title}</h2>
                        <span className={`text-3xl font-bold ${slide.iconColor}`}>{slide.price}</span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-center text-sm leading-relaxed mb-6">
                        {slide.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                        {slide.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                <span className={`w-1.5 h-1.5 rounded-full ${slide.iconColor} bg-current`} />
                                {feature}
                            </div>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={prevSlide}
                            disabled={currentSlide === 0}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium
                                transition-all ${currentSlide === 0
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-gray-300 hover:bg-white/10'}`}
                        >
                            <ChevronLeft size={16} />
                            Back
                        </button>

                        <button
                            onClick={nextSlide}
                            className="flex items-center gap-1 px-6 py-2 bg-[#00ff41] text-black 
                                rounded-lg text-sm font-bold hover:bg-[#00ff41]/90 transition-all"
                        >
                            {currentSlide === slides.length - 1 ? (
                                <>
                                    <Rocket size={16} />
                                    Let's Go!
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Skip link */}
                <button
                    onClick={handleClose}
                    className="w-full mt-4 text-center text-gray-500 text-sm hover:text-gray-400 transition-colors"
                >
                    Skip tutorial
                </button>
            </div>
        </div>
    );
};

export default WelcomeGuide;
