import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface Mission {
    id: number;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    difficulty_color: string;
    rewards: string;
    mission_points: string;
    participants: string;
    participants_count: number;
    participants_limit: number;
    start_in: string | null;
    start_date: string | null;
    description: string | null;
    objectives: string[];
    requirements: string | null;
    status: 'draft' | 'upcoming' | 'active' | 'completed';
}

export interface AdminMission extends Mission {
    current_participants: number;
    participants_limit: number;
    sort_order: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
}

export interface UseMissionsReturn {
    missions: Mission[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export interface UseAdminMissionsReturn extends UseMissionsReturn {
    missions: AdminMission[];
    createMission: (data: Partial<AdminMission>) => Promise<AdminMission | null>;
    updateMission: (id: number, data: Partial<AdminMission>) => Promise<AdminMission | null>;
    deleteMission: (id: number) => Promise<boolean>;
    reorderMissions: (order: { id: number; sort_order: number }[]) => Promise<boolean>;
}

/**
 * Hook for fetching public missions (for user dashboard)
 */
export function useMissions(): UseMissionsReturn {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMissions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_URL}/missions`);
            const data = await response.json();
            if (data.success) {
                setMissions(data.missions);
            } else {
                setError(data.error || 'Failed to fetch missions');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch missions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    return { missions, loading, error, refetch: fetchMissions };
}

/**
 * Hook for admin mission management (CRUD)
 */
export function useAdminMissions(): UseAdminMissionsReturn {
    const [missions, setMissions] = useState<AdminMission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'X-Admin-Token': localStorage.getItem('_nexus_admin_auth_token_v2') || '',
    });

    const fetchMissions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_URL}/admin/missions`, {
                headers: getHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setMissions(data.missions);
            } else {
                setError(data.error || 'Failed to fetch missions');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch missions');
        } finally {
            setLoading(false);
        }
    }, []);

    const createMission = async (missionData: Partial<AdminMission>): Promise<AdminMission | null> => {
        try {
            const response = await fetch(`${API_URL}/admin/missions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(missionData),
            });
            const data = await response.json();
            if (data.success) {
                await fetchMissions();
                return data.mission;
            }
            setError(data.error || 'Failed to create mission');
            return null;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create mission');
            return null;
        }
    };

    const updateMission = async (id: number, missionData: Partial<AdminMission>): Promise<AdminMission | null> => {
        try {
            const response = await fetch(`${API_URL}/admin/missions/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(missionData),
            });
            const data = await response.json();
            if (data.success) {
                await fetchMissions();
                return data.mission;
            }
            setError(data.error || 'Failed to update mission');
            return null;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update mission');
            return null;
        }
    };

    const deleteMission = async (id: number): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/admin/missions/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                await fetchMissions();
                return true;
            }
            setError(data.error || 'Failed to delete mission');
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete mission');
            return false;
        }
    };

    const reorderMissions = async (order: { id: number; sort_order: number }[]): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/admin/missions/reorder`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ order }),
            });
            const data = await response.json();
            if (data.success) {
                await fetchMissions();
                return true;
            }
            setError(data.error || 'Failed to reorder missions');
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reorder missions');
            return false;
        }
    };

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    return {
        missions,
        loading,
        error,
        refetch: fetchMissions,
        createMission,
        updateMission,
        deleteMission,
        reorderMissions,
    };
}

export default useMissions;
