import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface UseSiteSettingsOptions<T> {
    key: string;
    defaultValue: T;
    /**
     * Whether to poll for updates (for non-admin users to get admin changes)
     * Default: true
     */
    poll?: boolean;
    /**
     * Poll interval in milliseconds
     * Default: 10000 (10 seconds)
     */
    pollInterval?: number;
}

interface UseSiteSettingsReturn<T> {
    value: T;
    loading: boolean;
    error: string | null;
    setValue: (newValue: T) => Promise<boolean>;
    reset: () => Promise<boolean>;
    refetch: () => Promise<void>;
}

/**
 * Hook for managing site settings that persist to the backend.
 * 
 * - All users can READ settings from the backend
 * - Only admins can WRITE settings to the backend
 * - Includes polling to sync changes from admin to all users
 */
export function useSiteSettings<T>({
    key,
    defaultValue,
    poll = true,
    pollInterval = 10000
}: UseSiteSettingsOptions<T>): UseSiteSettingsReturn<T> {
    const [value, setValueState] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { isAdminAuthenticated, adminToken } = useAdminAuth();

    /**
     * Fetch setting from backend
     */
    const fetchSetting = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/settings/${key}`, {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch setting');
            }

            const data = await response.json();

            if (data.success && data.value !== null) {
                setValueState(data.value as T);
            }
        } catch (err) {
            // Don't set error, just use default
        } finally {
            setLoading(false);
        }
    }, [key]);

    /**
     * Save setting to backend (admin only)
     */
    const setValue = useCallback(async (newValue: T): Promise<boolean> => {
        if (!isAdminAuthenticated) {
            return false;
        }

        try {
            setError(null);

            const response = await fetch(`${API_BASE_URL}/admin/settings/${key}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken || ''
                },
                body: JSON.stringify({ value: newValue })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save setting');
            }

            // Update local state
            setValueState(newValue);
            return true;
        } catch (err: any) {
            console.error(`[Settings] Failed to save ${key}:`, err);
            setError(err.message);
            return false;
        }
    }, [key, isAdminAuthenticated, adminToken]);

    /**
     * Reset setting to default (delete from backend)
     */
    const reset = useCallback(async (): Promise<boolean> => {
        if (!isAdminAuthenticated) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/settings/${key}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Admin-Token': adminToken || ''
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reset setting');
            }

            setValueState(defaultValue);
            return true;
        } catch (err: any) {
            console.error(`[Settings] Failed to reset ${key}:`, err);
            setError(err.message);
            return false;
        }
    }, [key, defaultValue, isAdminAuthenticated, adminToken]);

    // Initial fetch
    useEffect(() => {
        fetchSetting();
    }, [fetchSetting]);

    // Polling for non-admin users to get updates
    useEffect(() => {
        if (!poll) return;

        const interval = setInterval(fetchSetting, pollInterval);
        return () => clearInterval(interval);
    }, [poll, pollInterval, fetchSetting]);

    return {
        value,
        loading,
        error,
        setValue,
        reset,
        refetch: fetchSetting
    };
}

export default useSiteSettings;
