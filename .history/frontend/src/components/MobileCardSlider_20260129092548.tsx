import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TierType } from '../hooks/useLockProgram';

interface MobileCardSliderProps {
    children: React.ReactNode[];
    tierLabels?: string[];
}

/**
 * Mobile-optimized card slider
 * - Swipe up to reveal cards
 * - Horizontal slide between cards (one at a time)
 */
export const MobileCardSlider: React.FC<MobileCardSliderProps> = ({
    children,
    tierLabels = ['Observer', 'Operator', 'Elite']
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const totalCards = children.length;

    // Handle horizontal swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart || !touchStartY) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStart - touchEndX;
        const diffY = touchStartY - touchEndY;

        // Horizontal swipe (more horizontal than vertical)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0 && currentIndex < totalCards - 1) {
                // Swipe left → next card
                setCurrentIndex(prev => prev + 1);
            } else if (diffX < 0 && currentIndex > 0) {
                // Swipe right → prev card
                setCurrentIndex(prev => prev - 1);
            }
        }

        // Vertical swipe for expand/collapse
        if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
            if (diffY > 0) {
                setIsExpanded(true);
            } else {
                setIsExpanded(false);
            }
        }

        setTouchStart(null);
        setTouchStartY(null);
    };

    const goToCard = (index: number) => {
        setCurrentIndex(index);
    };

    const nextCard = () => {
        if (currentIndex < totalCards - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Collapsed State - Swipe up hint */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full py-4 bg-gradient-to-t from-black/90 to-black/60 backdrop-blur-md border-t border-[#00ff41]/20"
                >
                    <div className="flex flex-col items-center gap-1 animate-bounce">
                        <ChevronUp className="w-5 h-5 text-[#00ff41]" />
                        <span className="text-xs text-[#00ff41] font-medium uppercase tracking-wider">
                            Swipe up to choose tier
                        </span>
                    </div>
                </button>
            )}

            {/* Expanded State - Card Slider */}
            {isExpanded && (
                <div
                    ref={containerRef}
                    className="bg-black/95 backdrop-blur-md border-t border-[#00ff41]/30 pb-safe"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Collapse handle */}
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="w-full py-2 flex justify-center"
                    >
                        <div className="w-12 h-1 bg-gray-600 rounded-full" />
                    </button>

                    {/* Tab indicators */}
                    <div className="flex justify-center gap-2 mb-3">
                        {tierLabels.map((label, idx) => (
                            <button
                                key={idx}
                                onClick={() => goToCard(idx)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${idx === currentIndex
                                        ? 'bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/50'
                                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Card container */}
                    <div className="relative overflow-hidden">
                        <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {React.Children.map(children, (child, idx) => (
                                <div
                                    key={idx}
                                    className="w-full flex-shrink-0 px-4 pb-4"
                                >
                                    {child}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation arrows */}
                    <div className="flex justify-between px-4 pb-4">
                        <button
                            onClick={prevCard}
                            disabled={currentIndex === 0}
                            className={`p-2 rounded-full ${currentIndex === 0
                                    ? 'text-gray-600'
                                    : 'text-[#00ff41] bg-[#00ff41]/10 active:bg-[#00ff41]/20'
                                }`}
                        >
                            <ChevronLeft size={24} />
                        </button>

                        {/* Dot indicators */}
                        <div className="flex items-center gap-2">
                            {children.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                            ? 'w-4 bg-[#00ff41]'
                                            : 'bg-gray-600'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextCard}
                            disabled={currentIndex === totalCards - 1}
                            className={`p-2 rounded-full ${currentIndex === totalCards - 1
                                    ? 'text-gray-600'
                                    : 'text-[#00ff41] bg-[#00ff41]/10 active:bg-[#00ff41]/20'
                                }`}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileCardSlider;
