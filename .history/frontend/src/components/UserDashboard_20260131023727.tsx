import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useLockProgram } from '../hooks/useLockProgram';
import { useTerminalSound } from '../hooks/useTerminalSound';
import { Lock, Unlock, RefreshCw, ExternalLink, Clock, Activity } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TabType = 'overview' | 'missions' | 'history';

// ============================================================================
// USER DASHBOARD - Consistent with MissionTierCard styling
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
    const { playClick, playBeep } = useTerminalSound();

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [unlockingId, setUnlockingId] = useState<number | null>(null);

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
            if (signature) refetch();
        } finally {
            setUnlockingId(null);
        }
    };

    const handleRefresh = () => {
        playClick();
        refetch();
    };

    // ========================================================================
    // SHARED CARD STYLES (matching MissionTierCard)
    // ========================================================================

    const cardBase = `
        bg-[#0a0c10]/90 border border-[#333] rounded-lg 
        backdrop-blur-md relative overflow-hidden
        transition-all duration-300
    `;

    const cardWithAccent = `${cardBase} hover:border-[#00ff41]`;

    // ========================================================================
    // NOT CONNECTED STATE
    // ========================================================================

    if (!connected) {
        return (
            <div className={`${cardBase} p-6 text-center`}>
                {/* Top Accent Line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-[#00ff41] shadow-[0_0_15px_#00ff41] rounded-full" />

                <Lock className="w-10 h-10 text-[#00ff41] mx-auto mb-4" />
                <h2 className="text-lg font-bold text-white mb-2">Control Center</h2>
                <p className="text-gray-400 text-sm mb-4">Connect wallet to access your missions</p>
                <button
                    onClick={() => { playClick(); setVisible(true); }}
                    className="px-6 py-2.5 bg-transparent border border-[#00ff41] text-[#00ff41] font-bold text-sm rounded-md hover:bg-[#00ff41] hover:text-black transition-all"
                >
                    Connect Wallet
                </button>

                {/* Corner Decoration */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#00ff41]/20" />
            </div>
        );
    }

    // ========================================================================
    // LOADING STATE
    // ========================================================================

    if (loading && !dashboard) {
        return (
            <div className={`${cardBase} p-6`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-[#00ff41] shadow-[0_0_15px_#00ff41] rounded-full" />
                <div className="flex items-center justify-center gap-3 py-6">
                    <RefreshCw className="w-5 h-5 text-[#00ff41] animate-spin" />
                    <span className="text-gray-400 text-sm">Loading dashboard...</span>
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#00ff41]/20" />
            </div>
        );
    }

    // ========================================================================
    // NEW USER STATE
    // ========================================================================

    if (dashboard?.is_new_user) {
        return (
            <div className={`${cardBase} p-6 text-center`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-[#00ff41] shadow-[0_0_15px_#00ff41] rounded-full" />

                <Activity className="w-10 h-10 text-[#00ff41] mx-auto mb-4" />
                <h2 className="text-lg font-bold text-white mb-2">Your Control Center</h2>
                <p className="text-gray-400 text-sm mb-3">No active missions yet. Select a tier below to begin.</p>
                <div className="text-[#00ff41]/50 text-xs font-mono">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </div>

                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#00ff41]/20" />
            </div>
        );
    }

    // ========================================================================
    // MAIN DASHBOARD
    // ========================================================================

    return (
        <div className="space-y-4">
            {/* ══════════════════════════════════════════════════════════════
                HEADER CARD
            ══════════════════════════════════════════════════════════════ */}
            <div className={`${cardBase} p-4`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-[#00ff41] shadow-[0_0_15px_#00ff41] rounded-full" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-white font-bold text-base">Control Center</h2>
                        <TierBadge tier={dashboard?.current_tier || null} />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-500 text-xs font-mono hidden sm:block">
                            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                        </span>
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-xs text-[#00ff41]/70 hover:text-[#00ff41] transition-colors"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#00ff41]/20" />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                STATS GRID
            ══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-4 gap-3">
                <StatCard label="Locked" value={dashboard?.total_locked_formatted || '0'} />
                <StatCard label="Active" value={String(dashboard?.active_locks?.length || 0)} />
                <StatCard
                    label="Tier"
                    value={tierDisplayName(dashboard?.highest_active_tier || null)}
                    valueColor={getTierColor(dashboard?.highest_active_tier || null)}
                />
                <StatCard label="Missions" value={String(dashboard?.missions_completed || 0)} />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                NEXT UNLOCK TIMER
            ══════════════════════════════════════════════════════════════ */}
            {nextUnlock && (
                <div className={`${cardBase} p-4 border-[#00ff41]/30`}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[2px] bg-[#00ff41] rounded-full" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#00ff41]" />
                            <span className="text-gray-400 text-sm">Next Unlock</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CountdownTimer unlockTimestamp={nextUnlock.unix_timestamp} />
                            <span className="text-gray-500 text-xs hidden sm:block">
                                {formatTokenAmount(BigInt(nextUnlock.amount))} • {tierDisplayName(nextUnlock.tier)}
                            </span>
                        </div>
                    </div>

                    <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#00ff41]/20" />
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TABS
            ══════════════════════════════════════════════════════════════ */}
            <div className={`${cardBase}`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-[#00ff41] shadow-[0_0_15px_#00ff41] rounded-full" />

                {/* Tab Headers */}
                <div className="flex border-b border-[#333]">
                    {(['overview', 'active', 'history'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`
                                px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors
                                ${activeTab === tab
                                    ? 'text-[#00ff41] border-b-2 border-[#00ff41]'
                                    : 'text-gray-500 hover:text-white'}
                            `}
                        >
                            {tab === 'active' ? `Active (${dashboard?.active_locks?.length || 0})` : tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-2">
                            {canUnlockAny && (
                                <div className="flex items-center justify-between p-3 bg-[#00ff41]/5 border border-[#00ff41]/30 rounded-lg mb-3">
                                    <div className="flex items-center gap-2">
                                        <Unlock className="w-4 h-4 text-[#00ff41]" />
                                        <span className="text-[#00ff41] text-sm">
                                            {unlockableLocks.length} lock(s) ready to claim!
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleTabChange('active')}
                                        className="text-xs bg-[#00ff41] text-black px-3 py-1.5 rounded font-bold hover:bg-[#00cc33]"
                                    >
                                        View
                                    </button>
                                </div>
                            )}
                            <InfoRow label="Member Since" value={
                                dashboard?.member_since
                                    ? new Date(dashboard.member_since).toLocaleDateString()
                                    : 'N/A'
                            } />
                            <InfoRow label="Total Transactions" value={String(dashboard?.lock_history?.length || 0)} />
                            <InfoRow
                                label="Status"
                                value={hasActiveLocks ? 'Active Operator' : 'Inactive'}
                                valueColor={hasActiveLocks ? 'text-[#00ff41]' : 'text-gray-500'}
                            />
                        </div>
                    )}

                    {/* ACTIVE TAB */}
                    {activeTab === 'active' && (
                        <div className="space-y-2">
                            {!hasActiveLocks ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No active locks
                                </div>
                            ) : (
                                dashboard?.active_locks?.map((lock) => (
                                    <div
                                        key={lock.id}
                                        className="flex items-center justify-between p-3 border border-[#333] rounded-lg hover:border-[#00ff41]/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${lock.can_unlock ? 'bg-[#00ff41]' : 'bg-gray-500'}`} />
                                            <div>
                                                <div className={`text-sm font-medium ${getTierColor(lock.tier)}`}>
                                                    {tierDisplayName(lock.tier)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {lock.amount_formatted} Tokens
                                                </div>
                                            </div>
                                        </div>
                                        {lock.can_unlock ? (
                                            <button
                                                onClick={() => handleUnlock(lock.id)}
                                                disabled={unlockLoading || unlockingId === lock.id}
                                                className="px-4 py-1.5 bg-[#00ff41] text-black text-xs font-bold rounded hover:bg-[#00cc33] disabled:opacity-50"
                                            >
                                                {unlockingId === lock.id ? '...' : 'Unlock'}
                                            </button>
                                        ) : (
                                            <span className="text-[#00ff41] text-sm font-mono">
                                                {lock.remaining_formatted}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="space-y-2">
                            {!dashboard?.lock_history?.length ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No transaction history
                                </div>
                            ) : (
                                dashboard.lock_history.slice(0, 10).map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-3 border border-[#333] rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center ${tx.status === 'locked' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                {tx.status === 'locked' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                            </div>
                                            <div>
                                                <div className="text-sm text-white">{tx.amount_formatted}</div>
                                                <div className="text-xs text-gray-500">{tierDisplayName(tx.tier)}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400">
                                                {new Date(tx.lock_timestamp).toLocaleDateString()}
                                            </div>
                                            <a
                                                href={tx.solscan_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[#00ff41]/50 hover:text-[#00ff41] inline-flex items-center gap-1"
                                            >
                                                View <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#00ff41]/20" />
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                    <p className="text-red-400 text-sm">{error}</p>
                    <button onClick={refetch} className="text-xs text-red-400 hover:text-red-300 mt-1">
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface TierBadgeProps {
    tier: string | null;
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier }) => {
    const styles: Record<string, string> = {
        elite: 'bg-yellow-500/20 text-yellow-400',
        operator: 'bg-green-500/20 text-green-400',
        spectator: 'bg-blue-500/20 text-blue-400',
    };

    return (
        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider ${styles[tier || ''] || 'bg-gray-500/20 text-gray-400'}`}>
            {tier || 'None'}
        </span>
    );
};

interface StatCardProps {
    label: string;
    value: string;
    valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, valueColor = 'text-white' }) => (
    <div className="bg-[#0a0c10]/90 border border-[#333] rounded-lg p-3 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-[#00ff41]/50 rounded-full" />
        <div className="text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-sm font-bold truncate ${valueColor}`}>{value}</div>
        </div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-[#00ff41]/20" />
    </div>
);

interface InfoRowProps {
    label: string;
    value: string;
    valueColor?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, valueColor = 'text-white' }) => (
    <div className="flex items-center justify-between py-2 border-b border-[#333] last:border-0">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`text-sm ${valueColor}`}>{value}</span>
    </div>
);

// Countdown Timer Component
const CountdownTimer: React.FC<{ unlockTimestamp: number }> = ({ unlockTimestamp }) => {
    const [time, setTime] = React.useState({ d: 0, h: 0, m: 0, s: 0 });

    React.useEffect(() => {
        const update = () => {
            const now = Math.floor(Date.now() / 1000);
            const diff = Math.max(0, unlockTimestamp - now);
            setTime({
                d: Math.floor(diff / 86400),
                h: Math.floor((diff % 86400) / 3600),
                m: Math.floor((diff % 3600) / 60),
                s: diff % 60
            });
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [unlockTimestamp]);

    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <span className="text-[#00ff41] font-mono font-bold">
            {pad(time.d)}:{pad(time.h)}:{pad(time.m)}:{pad(time.s)}
        </span>
    );
};

export default UserDashboard;
