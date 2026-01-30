import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useLockProgram } from '../hooks/useLockProgram';
import { CountdownTimer } from './CountdownTimer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TabType = 'overview' | 'active' | 'history';

// ============================================================================
// COMPONENT
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
                console.log('Unlock successful:', signature);
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
            <div className="user-dashboard-container">
                <div className="bg-[#0a0c10]/90 border border-[#333] rounded-2xl p-8 text-center backdrop-blur-md">
                    <h2 className="text-2xl font-bold text-white mb-4">Mission Dashboard</h2>
                    <p className="text-gray-400 mb-6">Connect your wallet to view your mission status</p>
                    <button
                        onClick={() => setVisible(true)}
                        className="px-8 py-3 bg-transparent border-2 border-[#4fffa0] text-[#4fffa0] 
                                   font-bold rounded-full hover:bg-[#4fffa0] hover:text-black 
                                   transition-all duration-300 shadow-[0_0_20px_rgba(79,255,160,0.2)]"
                    >
                        Connect Wallet
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
            <div className="user-dashboard-container">
                <div className="bg-[#0a0c10]/90 border border-[#333] rounded-2xl p-8 backdrop-blur-md">
                    <div className="flex items-center justify-center py-8">
                        <svg className="animate-spin h-8 w-8 text-[#4fffa0]" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="ml-3 text-gray-400">Loading dashboard...</span>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // NEW USER STATE
    // ========================================================================

    if (dashboard?.is_new_user) {
        return (
            <div className="user-dashboard-container">
                <div className="bg-[#0a0c10]/90 border border-[#333] rounded-2xl p-8 backdrop-blur-md text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4fffa0]/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#4fffa0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome, Operator!</h2>
                    <p className="text-gray-400 mb-4">
                        You haven't joined any missions yet. Choose a tier below to begin.
                    </p>
                    <div className="text-xs text-gray-500">
                        Wallet: {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // MAIN DASHBOARD
    // ========================================================================

    return (
        <div className="user-dashboard-container space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] pb-8">
            {/* Header with Wallet Info */}
            <div className="bg-[#0a0c10]/90 border border-[#333] rounded-2xl p-6 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold text-white">Mission Dashboard</h2>
                            <span className={`
                                text-xs px-3 py-1 rounded-full font-bold uppercase
                                ${dashboard?.current_tier === 'elite' ? 'bg-yellow-500/20 text-yellow-400' :
                                    dashboard?.current_tier === 'operator' ? 'bg-green-500/20 text-green-400' :
                                        dashboard?.current_tier === 'spectator' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-gray-500/20 text-gray-400'}
                            `}>
                                {tierDisplayName(dashboard?.current_tier || null)}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={refetch}
                            disabled={loading}
                            className="text-xs text-[#4fffa0]/50 hover:text-[#4fffa0] transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Refreshing...' : 'Refresh ↻'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Total Locked"
                    value={dashboard?.total_locked_formatted || '0'}
                    suffix="Tokens"
                />
                <StatCard
                    label="Active Locks"
                    value={String(dashboard?.active_locks?.length || 0)}
                />
                <StatCard
                    label="Current Tier"
                    value={tierDisplayName(dashboard?.highest_active_tier || null)}
                    valueClass={getTierColor(dashboard?.highest_active_tier || null)}
                />
                <StatCard
                    label="Missions"
                    value={String(dashboard?.missions_completed || 0)}
                    suffix="Completed"
                />
            </div>

            {/* Next Unlock Countdown */}
            {nextUnlock && (
                <div className="bg-[#0a0c10]/90 border border-[#4fffa0]/30 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex flex-col items-center">
                        <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wider">Next Unlock</h3>
                        <CountdownTimer
                            unlockTimestamp={nextUnlock.unix_timestamp}
                            size="md"
                            onComplete={refetch}
                        />
                        <div className="mt-4 text-xs text-gray-500">
                            {formatTokenAmount(BigInt(nextUnlock.amount))} Tokens • {tierDisplayName(nextUnlock.tier)}
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-[#333]">
                {(['overview', 'active', 'history'] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            px-6 py-3 text-sm font-medium transition-colors capitalize
                            ${activeTab === tab
                                ? 'text-[#4fffa0] border-b-2 border-[#4fffa0]'
                                : 'text-gray-400 hover:text-white'}
                        `}
                    >
                        {tab === 'active' ? `Active (${dashboard?.active_locks?.length || 0})` : tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    {/* Unlockable Alert */}
                    {canUnlockAny && (
                        <div className="bg-[#4fffa0]/10 border border-[#4fffa0]/30 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-[#4fffa0] font-bold">Tokens Ready to Unlock!</h4>
                                    <p className="text-xs text-gray-400 mt-1">
                                        You have {unlockableLocks.length} lock(s) ready to be claimed.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className="px-4 py-2 bg-[#4fffa0] text-black font-bold rounded-lg 
                                               hover:bg-[#3dd988] transition-colors text-sm"
                                >
                                    View & Unlock
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="bg-[#0a0c10]/90 border border-[#333] rounded-xl p-6 backdrop-blur-md">
                        <h3 className="text-white font-bold mb-4">Mission Status</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Member Since</span>
                                <span className="text-white">
                                    {dashboard?.member_since
                                        ? new Date(dashboard.member_since).toLocaleDateString()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total Transactions</span>
                                <span className="text-white">{dashboard?.lock_history?.length || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Current Status</span>
                                <span className={hasActiveLocks ? 'text-[#4fffa0]' : 'text-gray-400'}>
                                    {hasActiveLocks ? 'Active Operator' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'active' && (
                <div className="space-y-4 pb-4">
                    {!hasActiveLocks ? (
                        <div className="bg-[#0a0c10]/90 border border-[#333] rounded-xl p-8 text-center">
                            <p className="text-gray-400">No active locks</p>
                        </div>
                    ) : (
                        dashboard?.active_locks?.map((lock) => (
                            <div
                                key={lock.id}
                                className={`
                                    bg-[#0a0c10]/90 border rounded-xl p-6 backdrop-blur-md
                                    ${lock.can_unlock ? 'border-[#4fffa0]' : 'border-[#333]'}
                                `}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`font-bold ${getTierColor(lock.tier)}`}>
                                                {tierDisplayName(lock.tier)}
                                            </span>
                                            {lock.can_unlock && (
                                                <span className="text-xs bg-[#4fffa0]/20 text-[#4fffa0] px-2 py-0.5 rounded">
                                                    Ready
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {lock.amount_formatted} Tokens
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {lock.can_unlock ? (
                                            <button
                                                onClick={() => handleUnlock(lock.id)}
                                                disabled={unlockLoading || unlockingId === lock.id}
                                                className="px-6 py-2 bg-[#4fffa0] text-black font-bold rounded-lg 
                                                           hover:bg-[#3dd988] transition-colors disabled:opacity-50"
                                            >
                                                {unlockingId === lock.id ? 'Unlocking...' : 'Unlock Now'}
                                            </button>
                                        ) : (
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 mb-1">Unlocks in</div>
                                                <div className="text-[#4fffa0] font-mono">
                                                    {lock.remaining_formatted}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-2">
                    {!dashboard?.lock_history?.length ? (
                        <div className="bg-[#0a0c10]/90 border border-[#333] rounded-xl p-8 text-center">
                            <p className="text-gray-400">No transaction history</p>
                        </div>
                    ) : (
                        dashboard.lock_history.map((tx) => (
                            <div
                                key={tx.id}
                                className="bg-[#0a0c10]/90 border border-[#333] rounded-lg p-4 backdrop-blur-md"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                            ${tx.status === 'locked' ? 'bg-blue-500/20 text-blue-400' :
                                                tx.status === 'unlocked' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-gray-500/20 text-gray-400'}
                                        `}>
                                            {tx.status === 'locked' ? '🔒' : tx.status === 'unlocked' ? '✓' : '○'}
                                        </div>
                                        <div>
                                            <div className="text-sm text-white">{tx.amount_formatted} Tokens</div>
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
                                            className="text-xs text-[#4fffa0]/50 hover:text-[#4fffa0] transition-colors"
                                        >
                                            View TX ↗
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                    <p className="text-red-400 text-sm">{error}</p>
                    <button
                        onClick={refetch}
                        className="text-xs text-red-400 hover:text-red-300 mt-2"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
    label: string;
    value: string;
    suffix?: string;
    valueClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, suffix, valueClass = 'text-white' }) => (
    <div className="bg-[#0a0c10]/90 border border-[#333] rounded-xl p-4 backdrop-blur-md">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
        <div className={`text-xl font-bold ${valueClass}`}>{value}</div>
        {suffix && <div className="text-xs text-gray-500 mt-0.5">{suffix}</div>}
    </div>
);

export default UserDashboard;
