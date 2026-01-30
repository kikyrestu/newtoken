import React, { useEffect, useMemo, useState } from 'react';

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

    const tierSummary = useMemo(() => {
        if (!stats) return 'N/A';
        return `${stats.tier_breakdown.spectators} / ${stats.tier_breakdown.operators} / ${stats.tier_breakdown.elite}`;
    }, [stats]);

    return (
        <div className="absolute top-5 left-6 z-20 text-left">
            <div className="text-sm font-bold text-white/80 mb-1 tracking-wide uppercase">Mission Observer</div>
            <div className="bg-[#0a0c10]/70 border border-[#4fffa0]/20 rounded-xl px-4 py-3 backdrop-blur-md shadow-[0_0_20px_rgba(79,255,160,0.08)] min-w-[220px]">
                {error && (
                    <div className="text-xs text-red-400">{error}</div>
                )}
                {!error && (
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Total Locked</span>
                            <span className="text-[#4fffa0] font-bold">
                                {loading ? '...' : `${stats?.total_locked_formatted || '0'}`}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Active Locks</span>
                            <span className="text-[#4fffa0] font-bold">
                                {loading ? '...' : `${stats?.active_locks ?? 0}`}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Participants</span>
                            <span className="text-[#4fffa0] font-bold">
                                {loading ? '...' : `${stats?.total_participants ?? 0}`}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Tiers S/M/E</span>
                            <span className="text-[#4fffa0] font-bold">{loading ? '...' : tierSummary}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
