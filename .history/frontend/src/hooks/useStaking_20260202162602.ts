import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StakingTier {
    id: number;
    name: string;
    max_usd: number;
    lock_days: number;
    lock_weeks: number;
    apr_percent: number;
    description: string;
}

export interface StakeInfo {
    id: number;
    wallet_address: string;
    signature: string;
    tier: number;
    tier_name: string;
    amount: number;
    amount_formatted: string;
    usd_value: number | null;
    lock_days: number;
    apr_percent: number;
    reward_amount: number;
    reward_formatted: string;
    staked_at: string;
    unlocks_at: string;
    claimed_at: string | null;
    status: 'pending' | 'active' | 'claimable' | 'claimed' | 'canceled';
    is_claimable: boolean;
    remaining_seconds: number;
    remaining_formatted: string;
}

export interface StakingSummary {
    total_staked: number;
    total_pending_rewards: number;
    total_earned: number;
}

export interface RewardCalculation {
    tier: number;
    tier_name: string;
    amount: number;
    lock_days: number;
    apr_percent: number;
    reward: number;
    total_return: number;
}

// ============================================================================
// HOOK
// ============================================================================

export const useStaking = () => {
    const { publicKey } = useWallet();
    const wallet = publicKey?.toBase58();

    const [tiers, setTiers] = useState<StakingTier[]>([]);
    const [activeStakes, setActiveStakes] = useState<StakeInfo[]>([]);
    const [history, setHistory] = useState<StakeInfo[]>([]);
    const [summary, setSummary] = useState<StakingSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ========================================================================
    // FETCH TIERS
    // ========================================================================

    const fetchTiers = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/staking/tiers`);
            const data = await res.json();

            if (data.success) {
                setTiers(data.tiers);
            }
        } catch (err) {
            console.error('Failed to fetch staking tiers:', err);
        }
    }, []);

    // ========================================================================
    // FETCH MY STAKES
    // ========================================================================

    const fetchMyStakes = useCallback(async () => {
        if (!wallet) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/staking/my-stakes?wallet=${wallet}`);
            const data = await res.json();

            if (data.success) {
                setActiveStakes(data.active_stakes || []);
                setHistory(data.history || []);
                setSummary(data.summary || null);
            } else {
                setError(data.error || 'Failed to fetch stakes');
            }
        } catch (err) {
            setError('Network error fetching stakes');
            console.error('Failed to fetch stakes:', err);
        } finally {
            setLoading(false);
        }
    }, [wallet]);

    // ========================================================================
    // CALCULATE REWARD
    // ========================================================================

    const calculateReward = useCallback(async (tier: number, amount: number): Promise<RewardCalculation | null> => {
        try {
            const res = await fetch(`${API_BASE_URL}/staking/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier, amount }),
            });
            const data = await res.json();

            if (data.success) {
                return data as RewardCalculation;
            }
            return null;
        } catch (err) {
            console.error('Failed to calculate reward:', err);
            return null;
        }
    }, []);

    // ========================================================================
    // CREATE STAKE
    // ========================================================================

    const stake = useCallback(async (
        tier: number,
        amount: number,
        signature: string,
        usdValue?: number
    ): Promise<{ success: boolean; stake?: StakeInfo; error?: string }> => {
        if (!wallet) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            const res = await fetch(`${API_BASE_URL}/staking/stake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet,
                    tier,
                    amount,
                    signature,
                    usd_value: usdValue,
                }),
            });
            const data = await res.json();

            if (data.success) {
                // Refresh stakes
                await fetchMyStakes();
                return { success: true, stake: data.stake };
            }
            return { success: false, error: data.error || 'Failed to stake' };
        } catch (err) {
            console.error('Failed to stake:', err);
            return { success: false, error: 'Network error' };
        }
    }, [wallet, fetchMyStakes]);

    // ========================================================================
    // CLAIM STAKE
    // ========================================================================

    const claim = useCallback(async (stakeId: number): Promise<{ success: boolean; payout?: any; error?: string }> => {
        if (!wallet) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            const res = await fetch(`${API_BASE_URL}/staking/${stakeId}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet }),
            });
            const data = await res.json();

            if (data.success) {
                // Refresh stakes
                await fetchMyStakes();
                return { success: true, payout: data.payout };
            }
            return { success: false, error: data.error || 'Failed to claim' };
        } catch (err) {
            console.error('Failed to claim:', err);
            return { success: false, error: 'Network error' };
        }
    }, [wallet, fetchMyStakes]);

    // ========================================================================
    // AUTO-REFRESH
    // ========================================================================

    useEffect(() => {
        fetchTiers();
    }, [fetchTiers]);

    useEffect(() => {
        if (wallet) {
            fetchMyStakes();
        } else {
            setActiveStakes([]);
            setHistory([]);
            setSummary(null);
        }
    }, [wallet, fetchMyStakes]);

    return {
        // Data
        tiers,
        activeStakes,
        history,
        summary,
        loading,
        error,

        // Actions
        fetchTiers,
        fetchMyStakes,
        calculateReward,
        stake,
        claim,
    };
};
