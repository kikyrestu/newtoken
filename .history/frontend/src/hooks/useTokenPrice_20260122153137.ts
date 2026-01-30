import { useCallback, useEffect, useState } from 'react';

// Backend API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TierPricing {
    usd: number;
    tokens: number; // in smallest unit (lamports)
    tokens_formatted: string;
    token_price: number;
    error?: string;
}

export interface PricingData {
    spectator: TierPricing;
    operator: TierPricing;
    elite: TierPricing;
}

export type TierType = keyof PricingData;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useTokenPrice() {
    const [pricing, setPricing] = useState<PricingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    /**
     * Fetch pricing from backend
     */
    const fetchPricing = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/pricing`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch pricing`);
            }

            const data = await response.json();

            if (!data.success && data.error) {
                throw new Error(data.error);
            }

            setPricing({
                spectator: data.prices.spectator,
                operator: data.prices.operator,
                elite: data.prices.elite
            });
            setLastUpdated(new Date());

        } catch (err: any) {
            console.error('Failed to fetch pricing:', err);
            setError(err.message || 'Failed to fetch pricing');

            // Set fallback pricing (tokens will be 0)
            setPricing({
                spectator: { usd: 20, tokens: 0, tokens_formatted: 'N/A', token_price: 0, error: 'Price unavailable' },
                operator: { usd: 150, tokens: 0, tokens_formatted: 'N/A', token_price: 0, error: 'Price unavailable' },
                elite: { usd: 250, tokens: 0, tokens_formatted: 'N/A', token_price: 0, error: 'Price unavailable' }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Auto-refresh pricing every 30 seconds
     */
    useEffect(() => {
        // Initial fetch
        fetchPricing();

        // Set up interval for auto-refresh
        const interval = setInterval(fetchPricing, 30000);

        return () => clearInterval(interval);
    }, [fetchPricing]);

    /**
     * Get pricing for a specific tier
     */
    const getTierPrice = useCallback((tier: TierType): TierPricing | null => {
        return pricing?.[tier] || null;
    }, [pricing]);

    /**
     * Check if pricing is available (not in error state)
     */
    const isPriceAvailable = useCallback((tier: TierType): boolean => {
        const price = pricing?.[tier];
        return !!price && price.tokens > 0 && !price.error;
    }, [pricing]);

    /**
     * Format token amount for display (9 decimals)
     */
    const formatTokens = useCallback((amount: number): string => {
        if (amount === 0) return '0';
        return (amount / 1_000_000_000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        });
    }, []);

    /**
     * Format USD amount
     */
    const formatUSD = useCallback((amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }, []);

    /**
     * Get current token price in USD
     */
    const getTokenPrice = useCallback((): number | null => {
        // Return the token price from any tier (they should all be the same)
        return pricing?.spectator?.token_price || null;
    }, [pricing]);

    /**
     * Calculate tokens needed for a custom USD amount
     */
    const calculateTokensForUSD = useCallback((usdAmount: number): number | null => {
        const tokenPrice = getTokenPrice();
        if (!tokenPrice || tokenPrice <= 0) return null;

        const tokenAmount = usdAmount / tokenPrice;
        return Math.ceil(tokenAmount * 1_000_000_000); // Convert to smallest unit
    }, [getTokenPrice]);

    /**
     * Calculate USD value for a token amount
     */
    const calculateUSDForTokens = useCallback((tokenAmount: number): number | null => {
        const tokenPrice = getTokenPrice();
        if (!tokenPrice) return null;

        return (tokenAmount / 1_000_000_000) * tokenPrice;
    }, [getTokenPrice]);

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        // Data
        pricing,
        loading,
        error,
        lastUpdated,

        // Actions
        refreshPricing: fetchPricing,
        getTierPrice,

        // Utilities
        formatTokens,
        formatUSD,
        isPriceAvailable,
        getTokenPrice,
        calculateTokensForUSD,
        calculateUSDForTokens
    };
}

export default useTokenPrice;
