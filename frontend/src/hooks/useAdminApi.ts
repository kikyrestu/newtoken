import { useCallback, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Overview {
    revenue_usd: number;
    total_users: number;
    active_locks: number;
    recent_activity: number;
    total_tokens_locked: number;
    tier_breakdown: {
        spectator: { count: number; total_amount: number };
        operator: { count: number; total_amount: number };
        elite: { count: number; total_amount: number };
    };
}

interface User {
    id: number;
    wallet_address: string;
    created_at: string;
    lock_transactions_count: number;
    total_locked: number | null;
}

interface Transaction {
    id: number;
    user_wallet_id: number;
    tier: string;
    amount: number;
    usd_value_at_lock: number;
    status: string;
    lock_timestamp: string;
    unlock_timestamp: string;
    tx_signature: string;
    created_at: string;
    user_wallet?: {
        wallet_address: string;
    };
}

interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface TierConfig {
    [key: string]: {
        name: string;
        price_usd: number;
        reward_percent: number;
        token_amount: number;
        active: boolean;
    };
}

interface DailyStats {
    date: string;
    count: number;
    revenue?: number;
}

export function useAdminApi() {
    const { adminToken, isAdminAuthenticated } = useAdminAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const headers = useCallback(() => ({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Admin-Token': adminToken || ''
    }), [adminToken]);

    /**
     * Get overview statistics
     */
    const getOverview = useCallback(async (): Promise<Overview | null> => {
        if (!isAdminAuthenticated) return null;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/overview`, {
                headers: headers()
            });

            if (!response.ok) throw new Error('Failed to fetch overview');

            const data = await response.json();
            return data.overview;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [isAdminAuthenticated, headers]);

    /**
     * Get detailed stats for charts
     */
    const getDetailedStats = useCallback(async (): Promise<{ daily_locks: DailyStats[]; daily_users: DailyStats[] } | null> => {
        if (!isAdminAuthenticated) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/stats/detailed`, {
                headers: headers()
            });

            if (!response.ok) throw new Error('Failed to fetch detailed stats');

            const data = await response.json();
            return { daily_locks: data.daily_locks, daily_users: data.daily_users };
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    }, [isAdminAuthenticated, headers]);

    /**
     * Get users with pagination
     */
    const getUsers = useCallback(async (page = 1, search = '', perPage = 20): Promise<PaginatedResponse<User> | null> => {
        if (!isAdminAuthenticated) return null;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
            if (search) params.append('search', search);

            const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
                headers: headers()
            });

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            return data.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [isAdminAuthenticated, headers]);

    /**
     * Get transactions with filters
     */
    const getTransactions = useCallback(async (
        page = 1,
        filters: { status?: string; tier?: string; search?: string } = {},
        perPage = 20
    ): Promise<PaginatedResponse<Transaction> | null> => {
        if (!isAdminAuthenticated) return null;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
            if (filters.status) params.append('status', filters.status);
            if (filters.tier) params.append('tier', filters.tier);
            if (filters.search) params.append('search', filters.search);

            const response = await fetch(`${API_BASE_URL}/admin/transactions?${params}`, {
                headers: headers()
            });

            if (!response.ok) throw new Error('Failed to fetch transactions');

            const data = await response.json();
            return data.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [isAdminAuthenticated, headers]);

    /**
     * Force unlock a transaction
     */
    const forceUnlock = useCallback(async (transactionId: number): Promise<boolean> => {
        if (!isAdminAuthenticated) return false;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/transactions/${transactionId}/force-unlock`, {
                method: 'POST',
                headers: headers()
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to unlock');
            }

            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [isAdminAuthenticated, headers]);

    /**
     * Get tier configuration
     */
    const getTierConfig = useCallback(async (): Promise<TierConfig | null> => {
        if (!isAdminAuthenticated) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/tier-config`, {
                headers: headers()
            });

            if (!response.ok) throw new Error('Failed to fetch tier config');

            const data = await response.json();
            return data.tier_config;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    }, [isAdminAuthenticated, headers]);

    /**
     * Update tier configuration
     */
    const updateTierConfig = useCallback(async (config: TierConfig): Promise<boolean> => {
        if (!isAdminAuthenticated) return false;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/tier-config`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({ tier_config: config })
            });

            if (!response.ok) throw new Error('Failed to update tier config');

            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [isAdminAuthenticated, headers]);

    /**
     * Get all site settings
     */
    const getAllSettings = useCallback(async (): Promise<Record<string, any> | null> => {
        if (!isAdminAuthenticated) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/all-settings`, {
                headers: headers()
            });

            if (!response.ok) throw new Error('Failed to fetch settings');

            const data = await response.json();
            return data.settings;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    }, [isAdminAuthenticated, headers]);

    return {
        loading,
        error,
        getOverview,
        getDetailedStats,
        getUsers,
        getTransactions,
        forceUnlock,
        getTierConfig,
        updateTierConfig,
        getAllSettings
    };
}

export default useAdminApi;
