import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface BlockchainConfig {
    // Network
    network: 'devnet' | 'mainnet-beta';
    rpc_url: string;

    // Token
    token_mint: string;
    token_symbol: string;
    token_decimals: number;

    // Program
    program_id: string;

    // Wallets
    treasury_wallet: string;
    authority_wallet: string;

    // Price Oracle - harga otomatis dari market
    price_oracle: 'jupiter' | 'raydium';
}

const DEFAULT_CONFIG: BlockchainConfig = {
    network: 'devnet',
    rpc_url: 'https://api.devnet.solana.com',
    token_mint: '',
    token_symbol: 'TOKE',
    token_decimals: 6,
    program_id: '',
    treasury_wallet: '',
    authority_wallet: '',
    price_oracle: 'jupiter'
};

const SETTINGS_KEY = 'blockchain_config';

export function useBlockchainConfig() {
    const [config, setConfig] = useState<BlockchainConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { adminToken, isAdminAuthenticated } = useAdminAuth();

    /**
     * Fetch config from backend
     */
    const fetchConfig = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/settings/${SETTINGS_KEY}`, {
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.value) {
                    setConfig({ ...DEFAULT_CONFIG, ...data.value });
                }
            }
        } catch (err) {
            console.debug('[BlockchainConfig] Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Save config to backend (admin only)
     */
    const saveConfig = useCallback(async (newConfig: BlockchainConfig): Promise<boolean> => {
        if (!isAdminAuthenticated) {
            setError('Admin authentication required');
            return false;
        }

        try {
            setError(null);
            const response = await fetch(`${API_BASE_URL}/settings/${SETTINGS_KEY}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken || ''
                },
                body: JSON.stringify({ value: newConfig })
            });

            if (!response.ok) {
                throw new Error('Failed to save config');
            }

            setConfig(newConfig);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    }, [isAdminAuthenticated, adminToken]);

    /**
     * Reset to defaults
     */
    const resetConfig = useCallback(() => {
        setConfig(DEFAULT_CONFIG);
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    return {
        config,
        loading,
        error,
        saveConfig,
        resetConfig,
        refetch: fetchConfig,
        isConfigured: !!(config.token_mint && config.program_id)
    };
}

export default useBlockchainConfig;
