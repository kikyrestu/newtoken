import React, { useState, useRef } from 'react';
import type { TouchEvent } from 'react';
import { ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { MissionTierCard } from './MissionTierCard';
import type { TierType } from '../hooks/useLockProgram';

interface MobileCardCarouselProps {
    onSuccess?: (tier: string, signature: string) => void;
    onCardClick?: (tier: TierType) => void;
    hidden?: boolean; // Hide carousel when modals (Instructions/Safety) are open
}

const TIERS: { tier: TierType; title: string; description: string; cardNumber: string }[] = [
    {
        tier: 'spectator',
        title: 'Observer',
        description: 'Watch the mission unfold live. Choose from all active drones in real time.',
        cardNumber: '01'
    },
    {
        tier: 'operator',
        title: 'Operator',
        description: 'Take control of your drone. Fly it remotely in real time.',
        cardNumber: '02'
    },
    {
        tier: 'elite',
        title: 'Elite Commander',
        description: 'Full control now + guaranteed spot for next mission.',
        cardNumber: '03'
    }
];

export const MobileCardCarousel: React.FC<MobileCardCarouselProps> = ({ onSuccess, onCardClick, hidden = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Swipe threshold
    const minSwipeDistance = 50;

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentIndex < TIERS.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
        if (isRightSwipe && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Swipe up detection for expand
    const [verticalTouchStart, setVerticalTouchStart] = useState<number | null>(null);

    const onVerticalTouchStart = (e: TouchEvent) => {
        setVerticalTouchStart(e.targetTouches[0].clientY);
    };

    const onVerticalTouchEnd = (e: TouchEvent) => {
        if (!verticalTouchStart) return;
        const distance = verticalTouchStart - e.changedTouches[0].clientY;
        if (distance > 50) {
            setIsExpanded(true);
        }
    };

    // Expanded state swipe handling (Close on swipe down)
    const onExpandedTouchStart = (e: TouchEvent) => {
        setVerticalTouchStart(e.targetTouches[0].clientY);
    };

    const onExpandedTouchEnd = (e: TouchEvent) => {
        if (!verticalTouchStart) return;
        const distance = verticalTouchStart - e.changedTouches[0].clientY;

        // Swipe Down (negative distance)
        if (distance < -50) {
            setIsExpanded(false);
        }
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
            {/* Collapsed State - Swipe Up Hint */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-4 px-4 transition-all duration-500 ease-out transform pointer-events-auto
                    ${isExpanded ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
                onTouchStart={onVerticalTouchStart}
                onTouchEnd={onVerticalTouchEnd}
            >
                <div className="flex flex-col items-center animate-bounce">
                    <ChevronUp className="w-6 h-6 text-[#00ff41]" />
                    <span className="text-[#00ff41] text-xs font-medium mt-1">
                        Swipe up to choose your role
                    </span>
                </div>

                {/* Preview dots */}
                <div className="flex justify-center gap-2 mt-4">
                    {TIERS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all
                                ${idx === currentIndex ? 'bg-[#00ff41] w-4' : 'bg-gray-600'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Expanded State - Card Carousel */}
            <div
                className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/98 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform pointer-events-auto
                    ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`}
                onTouchStart={onExpandedTouchStart}
                onTouchEnd={onExpandedTouchEnd}
            >
                {/* Close handle - Increased hit area */}
                <div
                    className="flex justify-center py-6 cursor-pointer active:opacity-50 transition-opacity"
                    onClick={() => setIsExpanded(false)}
                >
                    <div className="w-16 h-1.5 bg-gray-600 rounded-full" />
                </div>

                {/* Navigation arrows + card */}
                <div className="relative px-2 pb-6">
                    {/* Left arrow */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            currentIndex > 0 && setCurrentIndex(currentIndex - 1);
                        }}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-4
                            ${currentIndex === 0 ? 'text-gray-700' : 'text-[#00ff41]'}`}
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* Card container */}
                    <div
                        ref={containerRef}
                        className="overflow-hidden mx-8"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {TIERS.map((tier) => (
                                <div key={tier.tier} className="w-full flex-shrink-0 px-2">
                                    <MissionTierCard
                                        tier={tier.tier}
                                        title={tier.title}
                                        onClick={() => onCardClick?.(tier.tier)}
                                        onSuccess={(sig) => onSuccess?.(tier.tier, sig)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right arrow */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            currentIndex < TIERS.length - 1 && setCurrentIndex(currentIndex + 1);
                        }}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-4
                            ${currentIndex === TIERS.length - 1 ? 'text-gray-700' : 'text-[#00ff41]'}`}
                        disabled={currentIndex === TIERS.length - 1}
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center gap-3 pb-6">
                    {TIERS.map((tier, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`transition-all duration-300 ${idx === currentIndex
                                ? 'bg-[#00ff41] text-black px-3 py-1 rounded-full text-xs font-bold'
                                : 'bg-gray-800 text-gray-400 px-2 py-1 rounded-full text-xs'
                                }`}
                        >
                            {tier.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileCardCarousel;
