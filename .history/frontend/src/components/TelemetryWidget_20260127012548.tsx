import React, { useEffect, useMemo, useState } from 'react';
import { Shield, BookOpen, Activity } from 'lucide-react';

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

interface TelemetryWidgetProps {
    onSafetyClick: () => void;
    onInstructionsClick?: () => void;
}

export const TelemetryWidget: React.FC<TelemetryWidgetProps> = ({
    onSafetyClick,
    onInstructionsClick
}) => {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch global stats
    useEffect(() => {
        let mounted = true;
        const fetchStats = async () => {
            try {
                // setLoading(true); // Don't show loading state on refresh to avoid jitter
                const response = await fetch(`${API_BASE_URL}/stats`, {
                    headers: { Accept: 'application/json' }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && mounted) {
                        setStats(data.data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch telemetry:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // 30s refresh
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const tierSummary = useMemo(() => {
        if (!stats) return '00 / 00 / 00';
        return `${stats.tier_breakdown.spectators.toString().padStart(2, '0')} / ${stats.tier_breakdown.operators.toString().padStart(2, '0')} / ${stats.tier_breakdown.elite.toString().padStart(2, '0')}`;
    }, [stats]);

    return (
        <div className="relative flex flex-col gap-4 w-[280px] animate-slide-in-left">
            {/* --- DATA CARD --- */}
            <div className="relative bg-black/10 backdrop-blur-sm border-l-4 border-[#00ff41] overflow-hidden">
                {/* Header */}
                <div className="flex flex-col border-b border-white/10 p-3 pb-2">
                    <h3 className="text-[#00ff41] font-bold text-xs tracking-[0.2em] uppercase leading-none mb-1">
                        :: Mission Observer ::
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">Live Feed</span>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 p-3 text-xs">
                    {/* Row 1 */}
                    <div className="text-gray-400 uppercase tracking-wide flex items-center">Total Locked</div>
                    <div className="font-mono font-bold text-[#00ff41] text-right">
                        {loading ? '---' : stats?.total_locked_formatted || '0'}
                    </div>

                    {/* Row 2 */}
                    <div className="text-gray-400 uppercase tracking-wide flex items-center">Active Locks</div>
                    <div className="font-mono font-bold text-[#00ff41] text-right">
                        {loading ? '--' : (stats?.active_locks || 0).toString().padStart(2, '0')}
                    </div>

                    {/* Row 3 */}
                    <div className="text-gray-400 uppercase tracking-wide flex items-center">Participants</div>
                    <div className="font-mono font-bold text-[#00ff41] text-right">
                        {loading ? '--' : (stats?.total_participants || 0).toString().padStart(2, '0')}
                    </div>

                    {/* Row 4 */}
                    <div className="text-gray-400 uppercase tracking-wide flex items-center">Tiers S/M/E</div>
                    <div className="font-mono font-bold text-[#00ff41] text-right">
                        {loading ? '-- / -- / --' : tierSummary}
                    </div>
                </div>

                {/* Decor: Corner Accent */}
                <div className="absolute top-0 right-0 p-1">
                    <Activity className="w-3 h-3 text-[#00ff41]/20" />
                </div>
            </div>

            {/* --- TACTICAL BUTTONS --- */}
            <div className="flex flex-col gap-2 pl-1">
                {/* Safety Button */}
                <button
                    onClick={onSafetyClick}
                    className="group relative flex items-center gap-3 px-4 py-2.5 bg-black/10 backdrop-blur-sm text-gray-300 hover:text-[#00ff41] transition-all duration-300 overflow-hidden"
                    style={{
                        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                    }}
                >
                    {/* Hover Background */}
                    <div className="absolute inset-0 bg-[#00ff41]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />

                    {/* Icon & Text */}
                    <Shield className="w-4 h-4 text-[#00ff41] relative z-10" />
                    <span className="text-xs font-bold tracking-widest uppercase relative z-10">Safety Protocols</span>

                    {/* Tech Decor */}
                    <div className="absolute right-2 bottom-2 w-1 h-1 bg-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Instructions Button */}
                <button
                    onClick={onInstructionsClick}
                    className="group relative flex items-center gap-3 px-4 py-2.5 bg-zinc-900/90 text-gray-300 hover:text-[#00ff41] transition-all duration-300 overflow-hidden"
                    style={{
                        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                    }}
                >
                    {/* Hover Background */}
                    <div className="absolute inset-0 bg-[#00ff41]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />

                    {/* Icon & Text */}
                    <BookOpen className="w-4 h-4 text-[#00ff41] relative z-10" />
                    <span className="text-xs font-bold tracking-widest uppercase relative z-10">Instructions</span>
                </button>
            </div>
        </div>
    );
};
