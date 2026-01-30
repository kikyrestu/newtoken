import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useLockProgram } from '../hooks/useLockProgram';
import { useTerminalSound } from '../hooks/useTerminalSound';
import { useTypingAnimation, useGlitchText, useScrambleReveal, useCountUp } from '../hooks/useTypingAnimation';
import '../styles/hologram.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TabType = 'overview' | 'active' | 'history';

// ============================================================================
// HOLOGRAPHIC DASHBOARD COMPONENT
// ============================================================================

export const UserDashboard: React.FC = () => {
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();
    const {
        dashboard,
        nextUnlock,
        loading,
        error,
        hasActiveLocks,
        canUnlockAny,
        unlockableLocks,
        refetch,
        tierDisplayName,
        getTierColor,
        walletAddress
    } = useUserDashboard();
    const { unlockTokens, loading: unlockLoading, formatTokenAmount } = useLockProgram();
    const { playClick, playBeep, playPowerOn } = useTerminalSound();

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [unlockingId, setUnlockingId] = useState<number | null>(null);
    const [initialized, setInitialized] = useState(false);

    // Play power on sound when dashboard loads
    useEffect(() => {
        if (dashboard && !initialized) {
            playPowerOn();
            setInitialized(true);
        }
    }, [dashboard, initialized, playPowerOn]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleTabChange = (tab: TabType) => {
        playClick();
        setActiveTab(tab);
    };

    const handleUnlock = async (lockId: number) => {
        playBeep();
        setUnlockingId(lockId);
        try {
            const signature = await unlockTokens();
            if (signature) {
                refetch();
            }
        } finally {
            setUnlockingId(null);
        }
    };

    const handleRefresh = () => {
        playClick();
        refetch();
    };

    // ========================================================================
    // NOT CONNECTED STATE
    // ========================================================================

    if (!connected) {
        return (
            <div className="holo-terminal p-6 relative">
                <HoloCorners />
                <div className="scanlines" />
                <div className="text-center py-6">
                    <div className="text-[#00ff41] text-xs terminal-text mb-4 tracking-widest">
                        ▓▓▓ AUTHENTICATION REQUIRED ▓▓▓
                    </div>
                    <GlitchText text="CONNECT WALLET TO ACCESS" className="text-lg font-bold text-white mb-4" />
                    <button
                        onClick={() => { playClick(); setVisible(true); }}
                        className="holo-btn"
                    >
                        ◈ AUTHORIZE ACCESS ◈
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================================
    // LOADING STATE
    // ========================================================================

    if (loading && !dashboard) {
        return (
            <div className="holo-terminal p-6 relative">
                <HoloCorners />
                <div className="scanlines" />
                <div className="flex items-center justify-center gap-3 py-8">
                    <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
                    <TypingText text="INITIALIZING FIELD TERMINAL..." className="text-[#00ff41] terminal-text text-sm" />
                </div>
            </div>
        );
    }

    // ========================================================================
    // NEW USER STATE
    // ========================================================================

    if (dashboard?.is_new_user) {
        return (
            <div className="holo-terminal p-6 relative">
                <HoloCorners />
                <div className="scanlines" />
                <div className="text-center py-6">
                    <div className="text-[#00ff41] text-xs terminal-text mb-2 tracking-widest">
                        ◈ NEW OPERATOR DETECTED ◈
                    </div>
                    <GlitchText text="WELCOME TO MISSION CONTROL" className="text-lg font-bold text-white mb-3" />
                    <div className="text-gray-400 text-sm mb-4">Select a tier below to begin operations</div>
                    <div className="text-[#00ff41]/50 terminal-text text-xs">
                        ID: {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // MAIN HOLOGRAPHIC DASHBOARD
    // ========================================================================

    return (
        <div className="holo-terminal relative">
            <HoloCorners />
            <div className="scanlines" />

            {/* ══════════════════════════════════════════════════════════════
                HEADER - Terminal Style
            ══════════════════════════════════════════════════════════════ */}
            <div className="p-4 border-b border-[#00ff41]/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="status-dot active" />
                            <span className="terminal-text text-[#00ff41] text-xs tracking-wider">FIELD TERMINAL v2.4</span>
                        </div>
                        <TierBadge tier={dashboard?.current_tier || null} />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="terminal-text text-[#00ff41]/40 text-xs hidden sm:block">
                            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                        </span>
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="text-[#00ff41]/50 hover:text-[#00ff41] transition-colors text-xs terminal-text"
                        >
                            {loading ? '◌ SYNCING...' : '↻ REFRESH'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                ASSET STATUS - Bar Style Display
            ══════════════════════════════════════════════════════════════ */}
            <div className="p-4 border-b border-[#00ff41]/20">
                <div className="text-[#00ff41]/50 text-[10px] terminal-text tracking-widest mb-3">
                    ┌─ ASSET STATUS ─────────────────────────────────────────┐
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatBar
                        label="LOCKED"
                        value={dashboard?.total_locked_formatted || '0'}
                        percentage={75}
                    />
                    <StatBar
                        label="ACTIVE"
                        value={String(dashboard?.active_locks?.length || 0)}
                        percentage={(dashboard?.active_locks?.length || 0) * 33}
                    />
                    <StatBar
                        label="TIER"
                        value={tierDisplayName(dashboard?.highest_active_tier || null)}
                        percentage={dashboard?.highest_active_tier === 'elite' ? 100 : dashboard?.highest_active_tier === 'operator' ? 66 : 33}
                        color={getTierColor(dashboard?.highest_active_tier || null)}
                    />
                    <StatBar
                        label="MISSIONS"
                        value={String(dashboard?.missions_completed || 0)}
                        percentage={(dashboard?.missions_completed || 0) * 10}
                    />
                </div>
                <div className="text-[#00ff41]/50 text-[10px] terminal-text tracking-widest mt-3">
                    └────────────────────────────────────────────────────────┘
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                COUNTDOWN DISPLAY
            ══════════════════════════════════════════════════════════════ */}
            {nextUnlock && (
                <div className="p-4 border-b border-[#00ff41]/20 holo-panel mx-4 my-3">
                    <div className="text-center">
                        <div className="text-[#00ff41]/50 text-[10px] terminal-text tracking-widest mb-2">
                            ◈ NEXT UNLOCK SEQUENCE ◈
                        </div>
                        <CountdownDisplay unlockTimestamp={nextUnlock.unix_timestamp} />
                        <div className="text-[#00ff41]/40 text-xs terminal-text mt-2">
                            {formatTokenAmount(BigInt(nextUnlock.amount))} TOKENS • {tierDisplayName(nextUnlock.tier).toUpperCase()}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                NAVIGATION TABS
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex border-b border-[#00ff41]/20">
                {(['overview', 'active', 'history'] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`holo-tab ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab === 'active' ? `▸ ACTIVE [${dashboard?.active_locks?.length || 0}]` : `▸ ${tab.toUpperCase()}`}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                TAB CONTENT
            ══════════════════════════════════════════════════════════════ */}
            <div className="p-4">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-1">
                        {canUnlockAny && (
                            <div className="holo-panel p-3 mb-3 flex items-center justify-between border-[#00ff41]/50">
                                <div className="flex items-center gap-2">
                                    <div className="status-dot active" />
                                    <span className="text-[#00ff41] text-sm terminal-text">
                                        ● {unlockableLocks.length} LOCK(S) READY FOR EXTRACTION
                                    </span>
                                </div>
                                <button onClick={() => handleTabChange('active')} className="holo-btn text-xs">
                                    EXTRACT
                                </button>
                            </div>
                        )}
                        <InfoLine label="OPERATOR SINCE" value={
                            dashboard?.member_since
                                ? new Date(dashboard.member_since).toLocaleDateString()
                                : 'N/A'
                        } />
                        <InfoLine label="TOTAL OPERATIONS" value={String(dashboard?.lock_history?.length || 0)} />
                        <InfoLine
                            label="CLEARANCE STATUS"
                            value={hasActiveLocks ? '● ACTIVE' : '○ INACTIVE'}
                            valueClass={hasActiveLocks ? 'text-[#00ff41]' : 'text-gray-500'}
                        />
                    </div>
                )}

                {/* ACTIVE TAB */}
                {activeTab === 'active' && (
                    <div>
                        {!hasActiveLocks ? (
                            <div className="text-center py-8 text-gray-500 terminal-text text-sm">
                                ░░░ NO ACTIVE LOCKS ░░░
                            </div>
                        ) : (
                            dashboard?.active_locks?.map((lock) => (
                                <div key={lock.id} className="holo-list-item py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`status-dot ${lock.can_unlock ? 'active' : ''}`}
                                            style={{ background: lock.can_unlock ? '#00ff41' : '#555' }} />
                                        <div>
                                            <div className={`text-sm font-medium terminal-text ${getTierColor(lock.tier)}`}>
                                                {tierDisplayName(lock.tier).toUpperCase()}
                                            </div>
                                            <div className="text-xs text-gray-500 terminal-text">
                                                {lock.amount_formatted} TOKENS
                                            </div>
                                        </div>
                                    </div>
                                    {lock.can_unlock ? (
                                        <button
                                            onClick={() => handleUnlock(lock.id)}
                                            disabled={unlockLoading || unlockingId === lock.id}
                                            className="holo-btn text-xs"
                                        >
                                            {unlockingId === lock.id ? '◌◌◌' : '◈ UNLOCK'}
                                        </button>
                                    ) : (
                                        <div className="text-[#00ff41] terminal-text text-sm">
                                            {lock.remaining_formatted}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div>
                        {!dashboard?.lock_history?.length ? (
                            <div className="text-center py-8 text-gray-500 terminal-text text-sm">
                                ░░░ NO TRANSACTION HISTORY ░░░
                            </div>
                        ) : (
                            dashboard.lock_history.slice(0, 10).map((tx) => (
                                <div key={tx.id} className="holo-list-item py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs ${tx.status === 'locked' ? 'text-blue-400' : 'text-green-400'}`}>
                                            {tx.status === 'locked' ? '▼' : '▲'}
                                        </span>
                                        <div>
                                            <div className="text-sm text-white terminal-text">{tx.amount_formatted}</div>
                                            <div className="text-xs text-gray-500 terminal-text">{tierDisplayName(tx.tier).toUpperCase()}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 terminal-text">
                                            {new Date(tx.lock_timestamp).toLocaleDateString()}
                                        </div>
                                        <a
                                            href={tx.solscan_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-[#00ff41]/50 hover:text-[#00ff41] terminal-text"
                                        >
                                            VIEW TX ↗
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Footer Scan Line */}
            <div className="p-2 border-t border-[#00ff41]/20">
                <div className="text-[#00ff41]/30 text-[10px] terminal-text tracking-widest text-center">
                    ░░░░░░░░░░░░░░░░░░ SYSTEM NOMINAL ░░░░░░░░░░░░░░░░░░
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="absolute bottom-16 left-4 right-4 bg-red-500/10 border border-red-500/30 rounded p-3 text-center">
                    <p className="text-red-400 text-sm terminal-text">{error}</p>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const HoloCorners: React.FC = () => (
    <>
        <div className="holo-corner top-left" />
        <div className="holo-corner top-right" />
        <div className="holo-corner bottom-left" />
        <div className="holo-corner bottom-right" />
    </>
);

interface TierBadgeProps {
    tier: string | null;
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier }) => {
    const colors = {
        elite: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
        operator: 'border-green-500 text-green-400 bg-green-500/10',
        spectator: 'border-blue-500 text-blue-400 bg-blue-500/10',
        default: 'border-gray-500 text-gray-400 bg-gray-500/10'
    };

    const colorClass = colors[tier as keyof typeof colors] || colors.default;
    const displayName = tier ? tier.toUpperCase() : 'CIVILIAN';

    return (
        <span className={`text-[10px] px-2 py-0.5 border rounded terminal-text tracking-wider ${colorClass}`}>
            {displayName}
        </span>
    );
};

interface StatBarProps {
    label: string;
    value: string;
    percentage: number;
    color?: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, percentage, color }) => {
    const displayCount = useCountUp(parseInt(value) || 0, 800);
    const displayValue = isNaN(parseInt(value)) ? value : String(displayCount);

    return (
        <div className="holo-panel p-2">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#00ff41]/50 terminal-text tracking-wider">{label}</span>
                <span className={`text-sm font-bold terminal-text ${color || 'text-[#00ff41]'}`}>
                    {displayValue}
                </span>
            </div>
            <div className="stat-bar">
                <div
                    className="stat-bar-fill"
                    style={{ width: `${Math.min(100, percentage)}%` }}
                />
            </div>
        </div>
    );
};

interface InfoLineProps {
    label: string;
    value: string;
    valueClass?: string;
}

const InfoLine: React.FC<InfoLineProps> = ({ label, value, valueClass = 'text-white' }) => (
    <div className="flex items-center justify-between py-2 border-b border-[#00ff41]/10">
        <span className="text-xs text-[#00ff41]/50 terminal-text tracking-wider">{label}</span>
        <span className={`text-sm terminal-text ${valueClass}`}>{value}</span>
    </div>
);

// Typing Text Component
interface TypingTextProps {
    text: string;
    className?: string;
}

const TypingText: React.FC<TypingTextProps> = ({ text, className }) => {
    const { displayText, isTyping } = useTypingAnimation({ text, speed: 40 });

    return (
        <span className={`${className} ${isTyping ? 'typing-cursor' : ''}`}>
            {displayText}
        </span>
    );
};

// Glitch Text Component
interface GlitchTextProps {
    text: string;
    className?: string;
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className }) => {
    const glitchedText = useGlitchText(text, 'low');

    return (
        <span className={`glitch-text rgb-split ${className}`}>
            {glitchedText}
        </span>
    );
};

// Countdown Display
const CountdownDisplay: React.FC<{ unlockTimestamp: number }> = ({ unlockTimestamp }) => {
    const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    useEffect(() => {
        const update = () => {
            const now = Math.floor(Date.now() / 1000);
            const diff = Math.max(0, unlockTimestamp - now);

            setTime({
                days: Math.floor(diff / 86400),
                hours: Math.floor((diff % 86400) / 3600),
                mins: Math.floor((diff % 3600) / 60),
                secs: diff % 60
            });
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [unlockTimestamp]);

    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <div className="flex items-center justify-center gap-1 text-[#00ff41] terminal-text">
            <TimeBlock value={pad(time.days)} label="DAYS" />
            <span className="text-[#00ff41]/50 text-xl">:</span>
            <TimeBlock value={pad(time.hours)} label="HRS" />
            <span className="text-[#00ff41]/50 text-xl">:</span>
            <TimeBlock value={pad(time.mins)} label="MIN" />
            <span className="text-[#00ff41]/50 text-xl">:</span>
            <TimeBlock value={pad(time.secs)} label="SEC" />
        </div>
    );
};

const TimeBlock: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold tracking-wider">{value}</div>
        <div className="text-[8px] text-[#00ff41]/40 tracking-widest">{label}</div>
    </div>
);

export default UserDashboard;
