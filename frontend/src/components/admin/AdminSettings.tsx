import { useEffect, useState } from 'react';
import { useAdminApi } from '../../hooks/useAdminApi';
import { RefreshCw, Image, Type, Timer } from 'lucide-react';

export default function AdminSettings() {
    const { getAllSettings, loading } = useAdminApi();
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [refreshing, setRefreshing] = useState(false);

    const fetchSettings = async () => {
        setRefreshing(true);
        const data = await getAllSettings();
        if (data) setSettings(data);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const formatKey = (key: string) => {
        return key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getSettingIcon = (key: string) => {
        if (key.includes('image')) return <Image className="w-4 h-4" />;
        if (key.includes('text') || key.includes('title') || key.includes('description')) return <Type className="w-4 h-4" />;
        if (key.includes('timer') || key.includes('position')) return <Timer className="w-4 h-4" />;
        return null;
    };

    const formatValue = (value: any): string => {
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-300">Site Settings</h2>
                    <p className="text-sm text-gray-500">View and manage all saved site settings</p>
                </div>
                <button
                    onClick={fetchSettings}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-[#00ff41]/10 text-[#00ff41] rounded-lg hover:bg-[#00ff41]/20 disabled:opacity-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
                <strong>Note:</strong> Visual editor settings (timer position, editable texts, images) are managed directly on the main page.
                This panel shows all saved settings for monitoring purposes.
            </div>

            {/* Settings List */}
            <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl overflow-hidden">
                {loading || refreshing ? (
                    <div className="p-8 text-center text-gray-500">Loading settings...</div>
                ) : Object.keys(settings).length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No settings saved yet</div>
                ) : (
                    <div className="divide-y divide-[#00ff41]/10">
                        {Object.entries(settings).map(([key, value]) => (
                            <div key={key} className="p-4 hover:bg-[#00ff41]/5 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-[#00ff41]/10 rounded text-[#00ff41]">
                                        {getSettingIcon(key) || <div className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-white">{formatKey(key)}</h4>
                                            <code className="text-xs text-gray-500 bg-black/40 px-1.5 py-0.5 rounded">{key}</code>
                                        </div>
                                        <pre className="text-sm text-gray-400 overflow-x-auto max-h-32 bg-black/30 rounded p-2 font-mono">
                                            {formatValue(value)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-black/30 border border-[#00ff41]/20 rounded-lg hover:border-[#00ff41]/50 transition-colors"
                    >
                        <Timer className="w-6 h-6 text-[#00ff41]" />
                        <div>
                            <p className="font-medium text-white">Edit Timer Position</p>
                            <p className="text-xs text-gray-500">Click gear icon on main page</p>
                        </div>
                    </a>
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-black/30 border border-[#00ff41]/20 rounded-lg hover:border-[#00ff41]/50 transition-colors"
                    >
                        <Type className="w-6 h-6 text-[#00ff41]" />
                        <div>
                            <p className="font-medium text-white">Edit Text Content</p>
                            <p className="text-xs text-gray-500">Double-click text on main page</p>
                        </div>
                    </a>
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-black/30 border border-[#00ff41]/20 rounded-lg hover:border-[#00ff41]/50 transition-colors"
                    >
                        <Image className="w-6 h-6 text-[#00ff41]" />
                        <div>
                            <p className="font-medium text-white">Edit Images</p>
                            <p className="text-xs text-gray-500">Click edit icon on images</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
