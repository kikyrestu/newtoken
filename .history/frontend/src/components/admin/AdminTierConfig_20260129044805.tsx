import { useEffect, useState } from 'react';
import { useAdminApi } from '../../hooks/useAdminApi';
import { Save, RotateCcw, Check } from 'lucide-react';

interface TierConfig {
    [key: string]: {
        name: string;
        price_usd: number;
        reward_percent: number;
        token_amount: number;
        active: boolean;
    };
}

const defaultConfig: TierConfig = {
    spectator: { name: 'Observer', price_usd: 20, reward_percent: 3, token_amount: 2000000, active: true },
    operator: { name: 'Mission', price_usd: 120, reward_percent: 5, token_amount: 12000000, active: true },
    elite: { name: 'Mission 1+2', price_usd: 200, reward_percent: 8, token_amount: 20000000, active: true }
};

export default function AdminTierConfig() {
    const { getTierConfig, updateTierConfig } = useAdminApi();
    const [config, setConfig] = useState<TierConfig>(defaultConfig);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            const data = await getTierConfig();
            if (data) setConfig(data);
        };
        fetchConfig();
    }, []);

    const handleChange = (tier: string, field: string, value: string | number | boolean) => {
        setConfig(prev => ({
            ...prev,
            [tier]: {
                ...prev[tier],
                [field]: value
            }
        }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const success = await updateTierConfig(config);
        if (success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        setSaving(false);
    };

    const handleReset = () => {
        setConfig(defaultConfig);
        setSaved(false);
    };

    const tierColors: Record<string, string> = {
        spectator: 'border-l-blue-500',
        operator: 'border-l-purple-500',
        elite: 'border-l-[#00ff41]'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-300">Tier Configuration</h2>
                    <p className="text-sm text-gray-500">Configure pricing, rewards, and token amounts for each tier</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-[#00ff41] text-black font-medium rounded-lg hover:bg-[#00cc33] disabled:opacity-50 transition-colors"
                    >
                        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {Object.entries(config).map(([tierId, tier]) => (
                    <div
                        key={tierId}
                        className={`bg-black/40 border border-[#00ff41]/10 rounded-xl p-5 border-l-4 ${tierColors[tierId]}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white capitalize">{tierId}</h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs text-gray-500">Active</span>
                                <input
                                    type="checkbox"
                                    checked={tier.active}
                                    onChange={(e) => handleChange(tierId, 'active', e.target.checked)}
                                    className="w-4 h-4 rounded bg-black/50 border-[#00ff41]/30 text-[#00ff41] focus:ring-[#00ff41]/50"
                                />
                            </label>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={tier.name}
                                    onChange={(e) => handleChange(tierId, 'name', e.target.value)}
                                    className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#00ff41]/50"
                                />
                            </div>

                            {/* Price USD */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Price (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={tier.price_usd}
                                        onChange={(e) => handleChange(tierId, 'price_usd', parseFloat(e.target.value) || 0)}
                                        className="w-full pl-7 pr-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#00ff41]/50"
                                    />
                                </div>
                            </div>

                            {/* Reward Percent */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Reward (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={tier.reward_percent}
                                        onChange={(e) => handleChange(tierId, 'reward_percent', parseFloat(e.target.value) || 0)}
                                        className="w-full pr-7 pl-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#00ff41]/50"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                </div>
                            </div>

                            {/* Token Amount */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Token Amount</label>
                                <input
                                    type="number"
                                    value={tier.token_amount}
                                    onChange={(e) => handleChange(tierId, 'token_amount', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#00ff41]/50"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
