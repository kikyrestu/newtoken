import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useLockProgram } from '../hooks/useLockProgram';
import { RefreshCw, Lock, Unlock, Clock, Award, Activity, ExternalLink } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TabType = 'overview' | 'active' | 'history';

// ============================================================================
// COMPACT USER DASHBOARD
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

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [unlockingId, setUnlockingId] = useState<number | null>(null);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleUnlock = async (lockId: number) => {
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

    // ========================================================================
    // NOT CONNECTED STATE
    // ========================================================================

    if (!connected) {
        return (
            <div className="bg-black/60 backdrop-blur border border-[#333] rounded-lg p-6 text-center">
                <Lock className="w-10 h-10 text-[#4fffa0] mx-auto mb-3" />
                <h2 className="text-lg font-bold text-white mb-2">Mission Dashboard</h2>
                <p className="text-gray-400 text-sm mb-4">Connect wallet to view status</p>
                <button
                    onClick={() => setVisible(true)}
                    className="px-6 py-2 bg-[#4fffa0] text-black font-bold text-sm rounded-lg hover:bg-[#3dd988] transition-colors"
                >
                    Connect Wallet
                </button>
            </div>
        );
    }

    // ========================================================================
    // LOADING STATE
    // ========================================================================

    if (loading && !dashboard) {
        return (
            <div className="bg-black/60 backdrop-blur border border-[#333] rounded-lg p-6">
                <div className="flex items-center justify-center gap-3">
                    <RefreshCw className="w-5 h-5 text-[#4fffa0] animate-spin" />
                    <span className="text-gray-400 text-sm">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    // ========================================================================
    // NEW USER STATE
    // ========================================================================

    if (dashboard?.is_new_user) {
        return (
            <div className="bg-black/60 backdrop-blur border border-[#333] rounded-lg p-6 text-center">
                <Activity className="w-10 h-10 text-[#4fffa0] mx-auto mb-3" />
                <h2 className="text-lg font-bold text-white mb-2">Welcome, Operator!</h2>
                <p className="text-gray-400 text-sm mb-2">No active missions. Choose a tier below to begin.</p>
                <div className="text-xs text-gray-500 font-mono">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </div>
            </div>
        );
    }

    // ========================================================================
    // MAIN DASHBOARD - COMPACT LAYOUT
    // ========================================================================

    return (
        <div className="space-y-3">
            {/* ══════════════════════════════════════════════════════════════
                HEADER - Single Line Compact
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-black/60 backdrop-blur border border-[#333] rounded-lg px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <h2 className="text-base font-bold text-white whitespace-nowrap">Mission Dashboard</h2>
                        <span className={`
                            text-xs px-2 py-0.5 rounded font-bold uppercase shrink-0
                            ${dashboard?.current_tier === 'elite' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                dashboard?.current_tier === 'operator' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    dashboard?.current_tier === 'spectator' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'}
                        `}>
                            {tierDisplayName(dashboard?.current_tier || null)}
                        </span>
                        <span className="text-xs text-gray-500 font-mono truncate hidden sm:block">
                            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                        </span>
                    </div>
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-xs text-[#4fffa0]/70 hover:text-[#4fffa0] transition-colors disabled:opacity-50 shrink-0"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                STATS ROW - Compact Grid
            ══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-4 gap-2">
                <StatCard
                    icon={<Lock className="w-4 h-4" />}
                    label="Locked"
                    value={dashboard?.total_locked_formatted || '0'}
                />
                <StatCard
                    icon={<Activity className="w-4 h-4" />}
                    label="Active"
                    value={String(dashboard?.active_locks?.length || 0)}
                />
                <StatCard
                    icon={<Award className="w-4 h-4" />}
                    label="Tier"
                    value={tierDisplayName(dashboard?.highest_active_tier || null)}
                    valueClass={getTierColor(dashboard?.highest_active_tier || null)}
                />
                <StatCard
                    icon={<Activity className="w-4 h-4" />}
                    label="Missions"
                    value={String(dashboard?.missions_completed || 0)}
                />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                NEXT UNLOCK - Inline Timer
            ══════════════════════════════════════════════════════════════ */}
            {nextUnlock && (
                <div className="bg-black/60 backdrop-blur border border-[#4fffa0]/30 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-[#4fffa0]" />
                            <span className="text-sm text-gray-400">Next Unlock</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-mono text-[#4fffa0] font-bold tracking-wider">
                                <CountdownDisplay unlockTimestamp={nextUnlock.unix_timestamp} />
                            </span>
                            <span className="text-xs text-gray-500 hidden sm:block">
                                {formatTokenAmount(BigInt(nextUnlock.amount))} • {tierDisplayName(nextUnlock.tier)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TABS - Compact
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex border-b border-[#333]">
                {(['overview', 'active', 'history'] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            px-4 py-2 text-xs font-medium transition-colors capitalize
                            ${activeTab === tab
                                ? 'text-[#4fffa0] border-b-2 border-[#4fffa0]'
                                : 'text-gray-400 hover:text-white'}
                        `}
                    >
                        {tab === 'active' ? `Active (${dashboard?.active_locks?.length || 0})` : tab}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                TAB CONTENT
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-black/60 backdrop-blur border border-[#333] rounded-lg">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="divide-y divide-[#333]">
                        {canUnlockAny && (
                            <div className="px-4 py-3 bg-[#4fffa0]/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Unlock className="w-4 h-4 text-[#4fffa0]" />
                                    <span className="text-sm text-[#4fffa0]">
                                        {unlockableLocks.length} lock(s) ready to claim!
                                    </span>
                                </div>
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className="text-xs bg-[#4fffa0] text-black px-3 py-1 rounded font-bold hover:bg-[#3dd988]"
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
                            valueClass={hasActiveLocks ? 'text-[#4fffa0]' : 'text-gray-400'}
                        />
                    </div>
                )}

                {/* ACTIVE TAB */}
                {activeTab === 'active' && (
                    <div className="divide-y divide-[#333]">
                        {!hasActiveLocks ? (
                            <div className="px-4 py-6 text-center text-gray-400 text-sm">
                                No active locks
                            </div>
                        ) : (
                            dashboard?.active_locks?.map((lock) => (
                                <div key={lock.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${lock.can_unlock ? 'bg-[#4fffa0]' : 'bg-gray-500'}`} />
                                        <div className="min-w-0">
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
                                            className="px-3 py-1.5 bg-[#4fffa0] text-black text-xs font-bold rounded hover:bg-[#3dd988] disabled:opacity-50 shrink-0"
                                        >
                                            {unlockingId === lock.id ? '...' : 'Unlock'}
                                        </button>
                                    ) : (
                                        <div className="text-right shrink-0">
                                            <div className="text-xs text-[#4fffa0] font-mono">
                                                {lock.remaining_formatted}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="divide-y divide-[#333]">
                        {!dashboard?.lock_history?.length ? (
                            <div className="px-4 py-6 text-center text-gray-400 text-sm">
                                No transaction history
                            </div>
                        ) : (
                            dashboard.lock_history.slice(0, 10).map((tx) => (
                                <div key={tx.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`
                                            w-6 h-6 rounded flex items-center justify-center text-xs shrink-0
                                            ${tx.status === 'locked' ? 'bg-blue-500/20 text-blue-400' :
                                                tx.status === 'unlocked' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-gray-500/20 text-gray-400'}
                                        `}>
                                            {tx.status === 'locked' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm text-white">{tx.amount_formatted}</div>
                                            <div className="text-xs text-gray-500">{tierDisplayName(tx.tier)}</div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs text-gray-400">
                                            {new Date(tx.lock_timestamp).toLocaleDateString()}
                                        </div>
                                        <a
                                            href={tx.solscan_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-[#4fffa0]/50 hover:text-[#4fffa0] inline-flex items-center gap-1"
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

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-center">
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

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, valueClass = 'text-white' }) => (
    <div className="bg-black/60 backdrop-blur border border-[#333] rounded-lg px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
            {icon}
            <span className="text-[10px] uppercase tracking-wider">{label}</span>
        </div>
        <div className={`text-sm font-bold truncate ${valueClass}`}>{value}</div>
    </div>
);

interface InfoRowProps {
    label: string;
    value: string;
    valueClass?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, valueClass = 'text-white' }) => (
    <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
);

// Simple countdown display (inline, no animation)
const CountdownDisplay: React.FC<{ unlockTimestamp: number }> = ({ unlockTimestamp }) => {
    const [remaining, setRemaining] = React.useState('');

    React.useEffect(() => {
        const update = () => {
            const now = Math.floor(Date.now() / 1000);
            const diff = Math.max(0, unlockTimestamp - now);

            if (diff <= 0) {
                setRemaining('Ready!');
                return;
            }

            const days = Math.floor(diff / 86400);
            const hours = Math.floor((diff % 86400) / 3600);
            const mins = Math.floor((diff % 3600) / 60);
            const secs = diff % 60;

            setRemaining(`${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [unlockTimestamp]);

    return <>{remaining}</>;
};

export default UserDashboard;
