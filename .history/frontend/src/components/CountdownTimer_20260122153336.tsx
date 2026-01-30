import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';

interface CountdownTimerProps {
    /**
     * Unix timestamp when the lock expires (in seconds)
     * Can be from blockchain or backend
     */
    unlockTimestamp?: number;

    /**
     * Callback when countdown reaches zero
     */
    onComplete?: () => void;

    /**
     * Size variant
     */
    size?: 'sm' | 'md' | 'lg';

    /**
     * Show labels under digits
     */
    showLabels?: boolean;

    /**
     * Custom class for container
     */
    className?: string;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number; // total seconds remaining
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
    unlockTimestamp,
    onComplete,
    size = 'lg',
    showLabels = true,
    className = ''
}) => {
    const { connection } = useConnection();
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0
    });
    const [blockchainTime, setBlockchainTime] = useState<number | null>(null);
    const [synced, setSynced] = useState(false);

    // ========================================================================
    // Blockchain Time Sync
    // ========================================================================

    /**
     * Sync with blockchain clock for accuracy
     */
    const syncBlockchainTime = useCallback(async () => {
        try {
            const slot = await connection.getSlot();
            const blockTime = await connection.getBlockTime(slot);

            if (blockTime) {
                setBlockchainTime(blockTime);
                setSynced(true);
            }
        } catch (error) {
            console.warn('Failed to sync blockchain time, using local time:', error);
            // Fallback to local time
            setBlockchainTime(Math.floor(Date.now() / 1000));
            setSynced(false);
        }
    }, [connection]);

    // Initial sync and periodic re-sync
    useEffect(() => {
        syncBlockchainTime();

        // Re-sync every 5 minutes to stay accurate
        const syncInterval = setInterval(syncBlockchainTime, 5 * 60 * 1000);

        return () => clearInterval(syncInterval);
    }, [syncBlockchainTime]);

    // ========================================================================
    // Countdown Logic
    // ========================================================================

    useEffect(() => {
        if (!unlockTimestamp || !blockchainTime) return;

        const syncedAtLocal = Date.now();

        const updateCountdown = () => {
            // Calculate current time based on blockchain sync point
            const elapsedSinceSync = Math.floor((Date.now() - syncedAtLocal) / 1000);
            const currentTime = blockchainTime + elapsedSinceSync;
            const diff = unlockTimestamp - currentTime;

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
                onComplete?.();
                return;
            }

            setTimeLeft({
                days: Math.floor(diff / (60 * 60 * 24)),
                hours: Math.floor((diff % (60 * 60 * 24)) / (60 * 60)),
                minutes: Math.floor((diff % (60 * 60)) / 60),
                seconds: diff % 60,
                total: diff
            });
        };

        // Initial update
        updateCountdown();

        // Update every second
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [unlockTimestamp, blockchainTime, onComplete]);

    // ========================================================================
    // Formatting
    // ========================================================================

    const formatNumber = useCallback((n: number): string => {
        return String(n).padStart(2, '0');
    }, []);

    const displayTime = useMemo(() => ({
        days: formatNumber(timeLeft.days),
        hours: formatNumber(timeLeft.hours),
        minutes: formatNumber(timeLeft.minutes),
        seconds: formatNumber(timeLeft.seconds)
    }), [timeLeft, formatNumber]);

    // ========================================================================
    // Size Classes
    // ========================================================================

    const sizeClasses = useMemo(() => {
        switch (size) {
            case 'sm':
                return {
                    digits: 'text-2xl md:text-3xl',
                    separator: 'text-xl',
                    labels: 'text-[10px]'
                };
            case 'md':
                return {
                    digits: 'text-4xl md:text-5xl',
                    separator: 'text-3xl',
                    labels: 'text-xs'
                };
            case 'lg':
            default:
                return {
                    digits: 'text-5xl md:text-7xl',
                    separator: 'text-4xl',
                    labels: 'text-xs'
                };
        }
    }, [size]);

    // ========================================================================
    // Render
    // ========================================================================

    // If no timestamp, show placeholder
    if (!unlockTimestamp) {
        return (
            <div className={`countdown-display ${className}`}>
                <div className={`
                    ${sizeClasses.digits} font-mono font-bold text-[#4fffa0]/30 
                    tracking-wider
                `}>
                    --:--:--:--
                </div>
            </div>
        );
    }

    // If countdown complete
    if (timeLeft.total <= 0) {
        return (
            <div className={`countdown-display ${className}`}>
                <div className={`
                    ${sizeClasses.digits} font-mono font-bold text-[#4fffa0] 
                    tracking-wider animate-pulse
                `}>
                    UNLOCKED
                </div>
                {showLabels && (
                    <div className="text-center mt-2">
                        <span className="text-xs text-[#4fffa0]">Ready to claim!</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`countdown-display ${className}`}>
            {/* Main Timer Display */}
            <div className="flex items-center justify-center">
                {/* Days */}
                <div className="flex flex-col items-center">
                    <span className={`
                        ${sizeClasses.digits} font-mono font-bold text-[#4fffa0] 
                        tracking-wider drop-shadow-[0_0_10px_#4fffa0]
                    `}>
                        {displayTime.days}
                    </span>
                    {showLabels && (
                        <span className={`${sizeClasses.labels} text-gray-400 mt-1 uppercase tracking-widest`}>
                            Days
                        </span>
                    )}
                </div>

                <span className={`${sizeClasses.separator} text-[#4fffa0]/50 mx-1 md:mx-2 font-mono font-bold`}>:</span>

                {/* Hours */}
                <div className="flex flex-col items-center">
                    <span className={`
                        ${sizeClasses.digits} font-mono font-bold text-[#4fffa0] 
                        tracking-wider drop-shadow-[0_0_10px_#4fffa0]
                    `}>
                        {displayTime.hours}
                    </span>
                    {showLabels && (
                        <span className={`${sizeClasses.labels} text-gray-400 mt-1 uppercase tracking-widest`}>
                            Hrs
                        </span>
                    )}
                </div>

                <span className={`${sizeClasses.separator} text-[#4fffa0]/50 mx-1 md:mx-2 font-mono font-bold`}>:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                    <span className={`
                        ${sizeClasses.digits} font-mono font-bold text-[#4fffa0] 
                        tracking-wider drop-shadow-[0_0_10px_#4fffa0]
                    `}>
                        {displayTime.minutes}
                    </span>
                    {showLabels && (
                        <span className={`${sizeClasses.labels} text-gray-400 mt-1 uppercase tracking-widest`}>
                            Min
                        </span>
                    )}
                </div>

                <span className={`${sizeClasses.separator} text-[#4fffa0]/50 mx-1 md:mx-2 font-mono font-bold`}>:</span>

                {/* Seconds */}
                <div className="flex flex-col items-center">
                    <span className={`
                        ${sizeClasses.digits} font-mono font-bold text-[#4fffa0] 
                        tracking-wider drop-shadow-[0_0_10px_#4fffa0]
                        ${timeLeft.total <= 60 ? 'animate-pulse' : ''}
                    `}>
                        {displayTime.seconds}
                    </span>
                    {showLabels && (
                        <span className={`${sizeClasses.labels} text-gray-400 mt-1 uppercase tracking-widest`}>
                            Sec
                        </span>
                    )}
                </div>
            </div>

            {/* Sync Status Indicator */}
            <div className="flex justify-center mt-2">
                <div className={`
                    flex items-center gap-1 text-[10px] 
                    ${synced ? 'text-[#4fffa0]/50' : 'text-yellow-500/50'}
                `}>
                    <span className={`
                        w-1.5 h-1.5 rounded-full 
                        ${synced ? 'bg-[#4fffa0]' : 'bg-yellow-500'}
                    `} />
                    {synced ? 'Synced with blockchain' : 'Using local time'}
                </div>
            </div>
        </div>
    );
};

export default CountdownTimer;
