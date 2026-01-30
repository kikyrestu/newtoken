import { useEffect, useState } from 'react';
import { useAdminApi } from '../../hooks/useAdminApi';
import {
    DollarSign,
    Users,
    Lock,
    TrendingUp,
    RefreshCw
} from 'lucide-react';

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

export default function AdminOverview() {
    const { getOverview, loading } = useAdminApi();
    const [overview, setOverview] = useState<Overview | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        setRefreshing(true);
        const data = await getOverview();
        if (data) setOverview(data);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const statCards = [
        {
            label: 'Total Revenue',
            value: overview ? `$${overview.revenue_usd.toLocaleString()}` : '$0',
            icon: <DollarSign className="w-6 h-6" />,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10'
        },
        {
            label: 'Total Users',
            value: overview ? formatNumber(overview.total_users) : '0',
            icon: <Users className="w-6 h-6" />,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10'
        },
        {
            label: 'Active Locks',
            value: overview ? formatNumber(overview.active_locks) : '0',
            icon: <Lock className="w-6 h-6" />,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10'
        },
        {
            label: '7-Day Activity',
            value: overview ? `+${overview.recent_activity}` : '+0',
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'text-[#00ff41]',
            bgColor: 'bg-[#00ff41]/10'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header with Refresh */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-300">Dashboard Overview</h2>
                <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#00ff41]/10 text-[#00ff41] rounded hover:bg-[#00ff41]/20 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5 hover:border-[#00ff41]/30 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-white">
                                    {loading ? '...' : stat.value}
                                </h3>
                            </div>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <div className={stat.color}>{stat.icon}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tier Breakdown */}
            <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tier Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { name: 'Spectator', tier: 'spectator', color: 'bg-blue-500' },
                        { name: 'Operator', tier: 'operator', color: 'bg-purple-500' },
                        { name: 'Elite', tier: 'elite', color: 'bg-[#00ff41]' }
                    ].map((t) => {
                        const data = overview?.tier_breakdown?.[t.tier as keyof typeof overview.tier_breakdown];
                        return (
                            <div key={t.tier} className="bg-black/30 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${t.color}`} />
                                    <span className="text-gray-300 font-medium">{t.name}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-gray-500">Locks</p>
                                        <p className="text-white font-bold">{data?.count || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Tokens</p>
                                        <p className="text-white font-bold">{formatNumber(data?.total_amount || 0)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Token Stats */}
            <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Total Tokens Locked</h3>
                <p className="text-4xl font-bold text-[#00ff41]">
                    {loading ? '...' : formatNumber(overview?.total_tokens_locked || 0)} $TOKE
                </p>
            </div>
        </div>
    );
}
