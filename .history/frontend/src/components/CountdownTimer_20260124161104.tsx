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

    showStatus?: boolean;

    variant?: 'default' | 'device';

    /**
     * Custom font size in pixels (for device variant)
     */
    customFontSize?: number;

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
    showStatus = true,
    variant = 'default',
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
                <div
                    className="w-full h-full flex items-center justify-center font-orbitron font-bold text-[#00ff41]/30 tabular-nums tracking-wider"
                    style={{ fontSize: '36px' }}
                >
                    00:00:00:00
                </div>
            </div>
        );
    }

    // If countdown complete
    if (timeLeft.total <= 0) {
        return (
            <div className={`countdown-display ${className}`}>
                <div
                    className="w-full h-full flex items-center justify-center font-mono font-bold text-[#4fffa0] tabular-nums tracking-wider animate-pulse"
                    style={{ fontSize: '36px' }}
                >
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
            {variant === 'device' ? (
                <div
                    className="w-full h-full flex items-center justify-center font-orbitron font-bold text-[#00ff41] tabular-nums tracking-wider"
                    style={{ fontSize: '28px' }}
                >
                    <span className="leading-none whitespace-nowrap">
                        {displayTime.days}:{displayTime.hours}:{displayTime.minutes}:{displayTime.seconds}
                    </span>
                </div>
            ) : (
                <div className="flex items-center justify-center gap-0.5 md:gap-1">
                    {/* Days (only show if > 0) */}
                    {timeLeft.days > 0 && (
                        <>
                            <div className="flex flex-col items-center min-w-[30px] md:min-w-[35px]">
                                <span className={`
                                ${size === 'lg' ? 'text-2xl md:text-3xl' : sizeClasses.digits} 
                                font-orbitron font-bold text-[#00ff41] tabular-nums
                                tracking-tighter drop-shadow-[0_0_3px_#4fffa0]
                            `}>
                                    {displayTime.days}
                                </span>
                                {showLabels && (
                                    <span className={`text-[8px] md:text-[10px] text-gray-400 mt-0 uppercase tracking-tighter`}>
                                        Days
                                    </span>
                                )}
                            </div>
                            <span className={`${sizeClasses.separator} text-[#00ff41]/50 text-lg md:text-xl font-orbitron font-bold`}>:</span>
                        </>
                    )}

                    {/* Hours */}
                    <div className="flex flex-col items-center min-w-[25px] md:min-w-[30px]">
                        <span className={`
                        ${size === 'lg' ? 'text-2xl md:text-3xl' : sizeClasses.digits} 
                        font-orbitron font-bold text-[#00ff41] tabular-nums
                        tracking-tighter drop-shadow-[0_0_3px_#4fffa0]
                    `}>
                            {displayTime.hours}
                        </span>
                        {showLabels && (
                            <span className={`text-[8px] md:text-[10px] text-gray-400 mt-0 uppercase tracking-tighter`}>
                                Hrs
                            </span>
                        )}
                    </div>

                    <span className={`${sizeClasses.separator} text-[#00ff41]/50 text-lg md:text-xl font-orbitron font-bold`}>:</span>

                    {/* Minutes */}
                    <div className="flex flex-col items-center min-w-[25px] md:min-w-[30px]">
                        <span className={`
                        ${size === 'lg' ? 'text-2xl md:text-3xl' : sizeClasses.digits} 
                        font-orbitron font-bold text-[#00ff41] tabular-nums
                        tracking-tighter drop-shadow-[0_0_3px_#4fffa0]
                    `}>
                            {displayTime.minutes}
                        </span>
                        {showLabels && (
                            <span className={`text-[8px] md:text-[10px] text-gray-400 mt-0 uppercase tracking-tighter`}>
                                Min
                            </span>
                        )}
                    </div>

                    <span className={`${sizeClasses.separator} text-[#00ff41]/50 text-lg md:text-xl font-orbitron font-bold`}>:</span>

                    {/* Seconds */}
                    <div className="flex flex-col items-center min-w-[25px] md:min-w-[30px]">
                        <span className={`
                        ${size === 'lg' ? 'text-2xl md:text-3xl' : sizeClasses.digits} 
                        font-orbitron font-bold text-[#00ff41] tabular-nums
                        tracking-tighter drop-shadow-[0_0_3px_#4fffa0]
                        ${timeLeft.total <= 60 ? 'animate-pulse' : ''}
                    `}>
                            {displayTime.seconds}
                        </span>
                        {showLabels && (
                            <span className={`text-[8px] md:text-[10px] text-gray-400 mt-0 uppercase tracking-tighter`}>
                                Sec
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Sync Status Indicator */}
            {showStatus && variant !== 'device' && (
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
            )}
        </div>
    );
};

export default CountdownTimer;
