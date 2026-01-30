import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Backend API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LockInfo {
    id: number;
    amount: number;
    amount_formatted: string;
    tier: string;
    status: string;
    lock_timestamp: string;
    unlock_timestamp: string;
    remaining_seconds: number;
    remaining_formatted: string;
    can_unlock: boolean;
    escrow_pda: string;
    solscan_url: string;
}

export interface LockHistoryItem {
    id: number;
    signature: string;
    amount: number;
    amount_formatted: string;
    tier: string;
    status: string;
    usd_value: number;
    lock_timestamp: string;
    unlock_timestamp: string;
    solscan_url: string;
}

export interface UserDashboardData {
    wallet: string;
    current_tier: string | null;
    highest_active_tier: string | null;
    total_locked: number;
    total_locked_formatted: string;
    missions_completed: number;
    member_since: string | null;
    active_locks: LockInfo[];
    lock_history: LockHistoryItem[];
    is_new_user: boolean;
}

export interface NextUnlockData {
    unlock_timestamp: string;
    unix_timestamp: number;
    remaining_seconds: number;
    tier: string;
    amount: number;
    escrow_pda: string;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useUserDashboard() {
    const { publicKey, connected } = useWallet();
    const [dashboard, setDashboard] = useState<UserDashboardData | null>(null);
    const [nextUnlock, setNextUnlock] = useState<NextUnlockData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const walletAddress = publicKey?.toBase58();

    /**
     * Fetch user dashboard data
     */
    const fetchDashboard = useCallback(async () => {
        if (!walletAddress) {
            setDashboard(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/user/${walletAddress}/dashboard`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch dashboard`);
            }

            const data = await response.json();

            console.log('📊 Dashboard Data Received:', data); // DEBUG

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch dashboard');
            }

            setDashboard(data.data);
            console.log('✅ Dashboard State Updated:', data.data); // DEBUG
        } catch (err: any) {
            console.error('Failed to fetch dashboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [walletAddress]);

    /**
     * Fetch next unlock timestamp
     */
    const fetchNextUnlock = useCallback(async () => {
        if (!walletAddress) {
            setNextUnlock(null);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/user/${walletAddress}/next-unlock`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            setNextUnlock(data.data);
        } catch (err) {
            console.error('Failed to fetch next unlock:', err);
        }
    }, [walletAddress]);

    /**
     * Refetch all data
     */
    const refetch = useCallback(() => {
        fetchDashboard();
        fetchNextUnlock();
    }, [fetchDashboard, fetchNextUnlock]);

    /**
     * Auto-fetch when wallet changes
     */
    useEffect(() => {
        if (connected && walletAddress) {
            refetch();
        } else {
            setDashboard(null);
            setNextUnlock(null);
        }
    }, [connected, walletAddress, refetch]);

    /**
     * Auto-refresh every 60 seconds when connected
     */
    useEffect(() => {
        if (!connected || !walletAddress) return;

        const interval = setInterval(refetch, 60000);
        return () => clearInterval(interval);
    }, [connected, walletAddress, refetch]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    /**
     * Check if user has any active locks
     */
    const hasActiveLocks = dashboard?.active_locks && dashboard.active_locks.length > 0;

    /**
     * Get the current tier display name
     */
    const tierDisplayName = useCallback((tier: string | null): string => {
        if (!tier) return 'None';

        const names: Record<string, string> = {
            spectator: 'Spectator',
            operator: 'Mission Operator',
            elite: 'Elite Operator'
        };

        return names[tier] || tier;
    }, []);

    /**
     * Get tier color class
     */
    const getTierColor = useCallback((tier: string | null): string => {
        if (!tier) return 'text-gray-400';

        const colors: Record<string, string> = {
            spectator: 'text-blue-400',
            operator: 'text-green-400',
            elite: 'text-yellow-400'
        };

        return colors[tier] || 'text-white';
    }, []);

    /**
     * Check if user can unlock any tokens
     */
    const canUnlockAny = dashboard?.active_locks?.some(lock => lock.can_unlock) ?? false;

    /**
     * Get unlockable locks
     */
    const unlockableLocks = dashboard?.active_locks?.filter(lock => lock.can_unlock) ?? [];

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        // Data
        dashboard,
        nextUnlock,
        loading,
        error,

        // Computed
        hasActiveLocks,
        canUnlockAny,
        unlockableLocks,

        // Actions
        refetch,

        // Utilities
        tierDisplayName,
        getTierColor,

        // Connection info
        connected,
        walletAddress
    };
}

export default useUserDashboard;
