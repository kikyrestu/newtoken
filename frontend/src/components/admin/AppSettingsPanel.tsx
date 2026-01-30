import React, { useState, useEffect } from 'react';
import {
    Settings,
    Network,
    Coins,
    ToggleLeft,
    ToggleRight,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface SettingItem {
    value: string | boolean | number;
    type: string;
    description: string;
}

interface GroupedSettings {
    [group: string]: {
        [key: string]: SettingItem;
    };
}

export const AppSettingsPanel: React.FC = () => {
    const [settings, setSettings] = useState<GroupedSettings>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/admin/app-settings`);
            const data = await response.json();
            if (data.success) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: string, value: any) => {
        setPendingChanges(prev => ({ ...prev, [key]: value }));
    };

    const saveSettings = async () => {
        if (Object.keys(pendingChanges).length === 0) return;

        setSaving(true);
        try {
            const response = await fetch(`${API_BASE}/admin/app-settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: pendingChanges }),
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: `Updated ${data.updated_count} settings` });
                setPendingChanges({});
                fetchSettings();
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error' });
        } finally {
            setSaving(false);
        }
    };

    const switchNetwork = async (network: 'devnet' | 'mainnet-beta') => {
        if (!confirm(`Switch to ${network}? This will update RPC and toggle Jupiter.`)) return;

        setSaving(true);
        try {
            const response = await fetch(`${API_BASE}/admin/app-settings/switch-network`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ network }),
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: `Switched to ${network}` });
                fetchSettings();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to switch network' });
        } finally {
            setSaving(false);
        }
    };

    const getValue = (group: string, key: string) => {
        if (key in pendingChanges) return pendingChanges[key];
        return settings[group]?.[key]?.value;
    };

    const renderToggle = (group: string, key: string, label: string) => {
        const value = getValue(group, key);
        const isOn = value === true || value === 'true';

        return (
            <div className="flex items-center justify-between py-2">
                <div>
                    <span className="text-white font-medium">{label}</span>
                    <p className="text-gray-500 text-xs">{settings[group]?.[key]?.description}</p>
                </div>
                <button
                    onClick={() => handleChange(key, !isOn)}
                    className={`p-1 rounded transition-colors ${isOn ? 'text-[#00ff41]' : 'text-gray-600'}`}
                >
                    {isOn ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
            </div>
        );
    };

    const renderInput = (group: string, key: string, label: string, type: 'text' | 'number' = 'text') => {
        const value = getValue(group, key) ?? '';

        return (
            <div className="py-2">
                <label className="block text-white font-medium mb-1">{label}</label>
                <p className="text-gray-500 text-xs mb-2">{settings[group]?.[key]?.description}</p>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => handleChange(key, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-white 
                        focus:border-[#00ff41] focus:outline-none font-mono text-sm"
                    placeholder={`Enter ${label.toLowerCase()}`}
                />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#00ff41] animate-spin" />
            </div>
        );
    }

    const currentNetwork = getValue('network', 'network_mode') || 'devnet';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-[#00ff41]" />
                    <h2 className="text-xl font-bold text-white">App Configuration</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchSettings}
                        className="px-3 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 
                            transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button
                        onClick={saveSettings}
                        disabled={Object.keys(pendingChanges).length === 0 || saving}
                        className="px-4 py-2 bg-[#00ff41] text-black font-bold rounded 
                            hover:bg-[#00ff41]/80 transition-colors flex items-center gap-2
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                        {Object.keys(pendingChanges).length > 0 && (
                            <span className="bg-black/30 px-2 py-0.5 rounded-full text-xs">
                                {Object.keys(pendingChanges).length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto">×</button>
                </div>
            )}

            {/* Network Section */}
            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Network className="w-5 h-5 text-[#00ff41]" />
                    <h3 className="text-lg font-bold text-white">Network Configuration</h3>
                </div>

                {/* Quick Switch */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => switchNetwork('devnet')}
                        className={`px-4 py-2 rounded font-bold transition-colors ${currentNetwork === 'devnet'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        🧪 Devnet
                    </button>
                    <button
                        onClick={() => switchNetwork('mainnet-beta')}
                        className={`px-4 py-2 rounded font-bold transition-colors ${currentNetwork === 'mainnet-beta'
                                ? 'bg-green-500 text-black'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        🚀 Mainnet
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput('network', 'rpc_url', 'RPC URL')}
                    {renderInput('network', 'rpc_url_mainnet', 'Mainnet RPC URL (for switch)')}
                </div>
            </div>

            {/* Token Section */}
            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Coins className="w-5 h-5 text-[#00ff41]" />
                    <h3 className="text-lg font-bold text-white">Token Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput('token', 'token_mint', 'Token Mint Address')}
                    {renderInput('token', 'token_symbol', 'Token Symbol')}
                    {renderInput('token', 'token_decimals', 'Token Decimals', 'number')}
                    {renderInput('token', 'token_logo_url', 'Token Logo URL')}
                </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[#00ff41] text-xl">💰</span>
                    <h3 className="text-lg font-bold text-white">Pricing Configuration</h3>
                </div>

                {renderToggle('pricing', 'jupiter_enabled', 'Jupiter Price Oracle')}
                {renderInput('pricing', 'fallback_price_usd', 'Fallback Price (USD)', 'number')}
                {renderInput('pricing', 'price_refresh_seconds', 'Price Refresh Interval (seconds)', 'number')}
            </div>

            {/* Features Section */}
            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[#00ff41] text-xl">⚡</span>
                    <h3 className="text-lg font-bold text-white">Feature Toggles</h3>
                </div>

                {renderToggle('features', 'swap_enabled', 'Jupiter Swap')}
                {renderToggle('features', 'demo_mode', 'Demo Mode (Simulated Transactions)')}
                {renderToggle('features', 'maintenance_mode', 'Maintenance Mode')}
            </div>

            {/* Program Section */}
            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[#00ff41] text-xl">🔐</span>
                    <h3 className="text-lg font-bold text-white">Program Configuration</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {renderInput('program', 'program_id', 'Anchor Program ID')}
                    {renderInput('program', 'lock_vault_address', 'Lock Vault Address')}
                </div>
            </div>
        </div>
    );
};

export default AppSettingsPanel;
