import { useState, useEffect, useRef } from 'react';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { Clock, Save, RotateCcw, Plus, CheckCircle, AlertCircle } from 'lucide-react';

interface CountdownConfig {
    timestamp: number;
    label?: string;
}

const DEFAULT_CONFIG: CountdownConfig = {
    timestamp: 0,
    label: 'Mission Launch In'
};

export default function AdminCountdown() {
    const { value: config, setValue: saveConfig, loading, error } = useSiteSettings<CountdownConfig>({
        key: 'countdown_target',
        defaultValue: DEFAULT_CONFIG,
        poll: false
    });

    const [targetDate, setTargetDate] = useState('');
    const [targetTime, setTargetTime] = useState('23:59');
    const [label, setLabel] = useState('Mission Launch In');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [liveCountdown, setLiveCountdown] = useState('');
    const hasInitialized = useRef(false);

    // Sync form with loaded config - ONLY on initial load
    useEffect(() => {
        if (hasInitialized.current) return;
        if (config && config.timestamp > 0) {
            const d = new Date(config.timestamp * 1000);
            setTargetDate(d.toISOString().split('T')[0]);
            setTargetTime(d.toISOString().split('T')[1].substring(0, 5));
            setLabel(config.label || 'Mission Launch In');
            hasInitialized.current = true;
        }
    }, [config]);

    // Live countdown preview
    useEffect(() => {
        if (!config || config.timestamp <= 0) {
            setLiveCountdown('Countdown stopped');
            return;
        }

        const update = () => {
            const now = Math.floor(Date.now() / 1000);
            const diff = config.timestamp - now;
            if (diff <= 0) {
                setLiveCountdown('EXPIRED');
                return;
            }
            const days = Math.floor(diff / 86400);
            const hours = Math.floor((diff % 86400) / 3600);
            const mins = Math.floor((diff % 3600) / 60);
            const secs = diff % 60;
            setLiveCountdown(
                `${String(days).padStart(2, '0')}.${String(hours).padStart(2, '0')}.${String(mins).padStart(2, '0')}.${String(secs).padStart(2, '0')}`
            );
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [config]);

    const handleSave = async () => {
        if (!targetDate) {
            setSaveMessage({ type: 'error', text: 'Please select a date' });
            return;
        }

        setSaving(true);
        setSaveMessage(null);

        const ts = Math.floor(new Date(`${targetDate}T${targetTime}:00Z`).getTime() / 1000);
        const success = await saveConfig({ timestamp: ts, label });

        setSaving(false);
        setSaveMessage(success
            ? { type: 'success', text: 'Countdown updated! Frontend will sync within 10 seconds.' }
            : { type: 'error', text: error || 'Failed to save' }
        );
    };

    const handlePreset = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setTargetDate(d.toISOString().split('T')[0]);
        setTargetTime('23:59');
    };

    const handleStop = async () => {
        setSaving(true);
        const success = await saveConfig({ timestamp: 0, label });
        setSaving(false);
        setSaveMessage(success
            ? { type: 'success', text: 'Countdown stopped.' }
            : { type: 'error', text: 'Failed to stop countdown' }
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin w-8 h-8 border-2 border-[#00ff41] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Current Status */}
            <div className="bg-black/50 border border-[#00ff41]/20 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-[#00ff41]" />
                    <h3 className="text-lg font-bold text-white">Current Countdown</h3>
                </div>
                <div className="text-center">
                    <div className="text-4xl font-mono font-bold text-[#00ff41] tracking-wider mb-2">
                        {liveCountdown}
                    </div>
                    {config && config.timestamp > 0 && (
                        <p className="text-sm text-gray-500">
                            Target: {new Date(config.timestamp * 1000).toLocaleString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZoneName: 'short'
                            })}
                        </p>
                    )}
                </div>
            </div>

            {/* Set Countdown */}
            <div className="bg-black/50 border border-[#00ff41]/20 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Set Countdown Target</h3>

                {/* Quick Presets */}
                <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">Quick Presets</label>
                    <div className="flex flex-wrap gap-2">
                        {[1, 3, 7, 14, 30, 60, 100].map(days => (
                            <button
                                key={days}
                                onClick={() => handlePreset(days)}
                                className="px-3 py-1.5 text-xs font-bold bg-white/5 text-gray-300 border border-white/10 rounded hover:bg-[#00ff41]/20 hover:text-[#00ff41] hover:border-[#00ff41]/40 transition-all"
                            >
                                <Plus size={12} className="inline mr-1" />
                                {days}d
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date & Time Inputs */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Date (UTC)</label>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="w-full px-3 py-2 bg-[#111] border border-white/20 rounded text-white text-sm focus:border-[#00ff41] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Time (UTC)</label>
                        <input
                            type="time"
                            value={targetTime}
                            onChange={(e) => setTargetTime(e.target.value)}
                            className="w-full px-3 py-2 bg-[#111] border border-white/20 rounded text-white text-sm focus:border-[#00ff41] focus:outline-none"
                        />
                    </div>
                </div>

                {/* Label */}
                <div className="mb-6">
                    <label className="text-sm text-gray-400 mb-1 block">Timer Label</label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Mission Launch In"
                        className="w-full px-3 py-2 bg-[#111] border border-white/20 rounded text-white text-sm focus:border-[#00ff41] focus:outline-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00ff41] text-black font-bold rounded hover:bg-[#00cc33] transition-colors disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Countdown'}
                    </button>
                    <button
                        onClick={handleStop}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 text-red-400 font-bold rounded border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                        <RotateCcw size={16} />
                        Stop
                    </button>
                </div>

                {/* Save Message */}
                {saveMessage && (
                    <div className={`mt-4 flex items-center gap-2 text-sm ${saveMessage.type === 'success' ? 'text-[#00ff41]' : 'text-red-400'}`}>
                        {saveMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {saveMessage.text}
                    </div>
                )}
            </div>
        </div>
    );
}
