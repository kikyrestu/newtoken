import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

type StatsData = {
    total_locked_formatted: string;
    active_locks: number;
    total_participants: number;
    tier_breakdown: {
        spectators: number;
        operators: number;
        elite: number;
    };
    updated_at: string;
};

export const StatsPanel: React.FC = () => {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${API_BASE_URL}/stats`, {
                    headers: { Accept: 'application/json' }
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.error || 'Failed to fetch stats');
                }
                if (mounted) {
                    setStats(data.data);
                }
            } catch (err: any) {
                if (mounted) {
                    setError(err.message || 'Failed to fetch stats');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    // Individual tier counts are displayed separately below

    // Show error state if there's an error
    if (error) {
        return (
            <div className="absolute top-5 left-6 z-20 text-left pointer-events-none select-none">
                <div className="text-sm font-bold text-red-500 mb-2 tracking-widest uppercase">
                    :: ERROR: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute top-5 left-6 z-20 text-left pointer-events-none select-none">
            {/* Title */}
            <div className="text-sm font-bold text-[#00ff41] mb-2 tracking-widest uppercase">
                :: MISSION OVERVIEW
            </div>

            {/* Content Box - Removed borders/shadows as requested ("put the long green Line away") */}
            <div className="space-y-4 text-xs font-mono">

                {/* Live Feed Status */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
                    <span className="text-[#00ff41]">LIVE FEED</span>
                </div>

                {/* Stats Group 1 */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 uppercase">CUMULATIVE BURN:</span>
                        <span className="text-white">{loading ? '...' : '0'}</span> {/* Backend doesn't have burn yet, placeholder */}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 uppercase">ACTIVE LOCKS:</span>
                        <span className="text-white">{loading ? '...' : `${stats?.active_locks ?? 0}`}</span>
                    </div>
                </div>

                {/* Participants Group */}
                <div className="space-y-1 pt-2">
                    <div className="text-gray-400 uppercase mb-1">Participants</div>

                    <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500">Observer</span>
                        <span className="text-[#00ff41]">{loading ? '...' : `${stats?.tier_breakdown.spectators ?? 0}`}/1000</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500">RECON:</span>
                        <span className="text-[#00ff41]">{loading ? '...' : `${stats?.tier_breakdown.operators ?? 0}`}/700</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500">Elite:</span>
                        <span className="text-[#00ff41]">{loading ? '...' : `${stats?.tier_breakdown.elite ?? 0}`}/300</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
