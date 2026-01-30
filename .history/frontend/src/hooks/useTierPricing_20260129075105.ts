import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface TierPricingInfo {
    current_price: number;
    original_price: number;
    discount_percent: number;
    remaining_slots_in_tier: number | null;
    next_price: number;
    locked_count: number;
}

export interface AllTierPricing {
    spectator: TierPricingInfo;
    operator: TierPricingInfo;
    elite: TierPricingInfo;
}

export function useTierPricing() {
    const [pricing, setPricing] = useState<AllTierPricing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPricing = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch(`${API_BASE_URL}/pricing/tiers`, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch pricing');
            }

            const data = await response.json();
            if (data.success && data.tiers) {
                setPricing(data.tiers);
            }
        } catch (err: any) {
            console.error('[useTierPricing] Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchPricing();
    }, [fetchPricing]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchPricing, 30000);
        return () => clearInterval(interval);
    }, [fetchPricing]);

    /**
     * Get pricing for a specific tier
     */
    const getTierPrice = useCallback((tier: 'spectator' | 'operator' | 'elite'): TierPricingInfo | null => {
        return pricing?.[tier] || null;
    }, [pricing]);

    /**
     * Check if a tier has an active discount
     */
    const hasDiscount = useCallback((tier: 'spectator' | 'operator' | 'elite'): boolean => {
        const tierPricing = pricing?.[tier];
        return (tierPricing?.discount_percent ?? 0) > 0;
    }, [pricing]);

    /**
     * Get formatted discount text for a tier
     */
    const getDiscountText = useCallback((tier: 'spectator' | 'operator' | 'elite'): string | null => {
        const tierPricing = pricing?.[tier];
        if (!tierPricing || tierPricing.discount_percent === 0) return null;

        const slotsLeft = tierPricing.remaining_slots_in_tier;
        if (slotsLeft && slotsLeft <= 50) {
            return `🔥 Only ${slotsLeft} spots left at -${tierPricing.discount_percent}%!`;
        }
        return `-${tierPricing.discount_percent}% Early Bird`;
    }, [pricing]);

    return {
        pricing,
        loading,
        error,
        refetch: fetchPricing,
        getTierPrice,
        hasDiscount,
        getDiscountText,
    };
}

export default useTierPricing;
