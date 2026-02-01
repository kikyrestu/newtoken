import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { Shield, Award, History, Activity, Radio, Layout } from 'lucide-react';

export const UserDashboard: React.FC = () => {
    const { connected } = useWallet();
    const { dashboard, loading } = useUserDashboard();

    // States for Tabs
    const [topTab, setTopTab] = useState<'overview' | 'live'>('overview');
    const [sideTab, setSideTab] = useState<'missions' | 'history' | 'rewards'>('missions');

    if (!connected) {
        return (
            <div className="text-center p-8 border border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-400 mb-2">Connect wallet to access Mission Control</p>
            </div>
        );
    }

    if (loading && !dashboard) {
        return <div className="p-8 text-center text-[#00ff41] animate-pulse">Loading Mission Data...</div>;
    }

    return (
        <div className="w-full h-[600px] flex flex-col bg-[#0a0c10]/95 border border-[#4fffa0]/20 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl pointer-events-auto">
            {/* --- TOP BAR (Horizontal Tabs) --- */}
            <div className="bg-black/40 border-b border-[#4fffa0]/20 px-6 flex items-center justify-between h-16 flex-shrink-0">
                <div className="flex items-center gap-6 h-full">
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase mr-4">
                        <span className="text-[#00ff41]">MISSION</span> CONTROL
                    </h2>

                    {/* Top Tabs */}
                    <div className="flex h-full">
                        <button
                            onClick={() => setTopTab('overview')}
                            className={`px-6 h-full border-b-2 font-bold text-sm tracking-mid uppercase transition-colors flex items-center gap-2
                                ${topTab === 'overview' ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/5' : 'border-transparent text-gray-500 hover:text-white'}`}
                        >
                            <Layout size={16} /> Overview
                        </button>
                        <button
                            onClick={() => setTopTab('live')}
                            className={`px-6 h-full border-b-2 font-bold text-sm tracking-mid uppercase transition-colors flex items-center gap-2
                                ${topTab === 'live' ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/5' : 'border-transparent text-gray-500 hover:text-white'}`}
                        >
                            <Radio size={16} className={topTab === 'live' ? 'animate-pulse' : ''} /> Live Feed
                        </button>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
                    SYSTEM ONLINE
                </div>
            </div>

            {/* --- MAIN LAYOUT (Sidebar + Content) --- */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT SIDEBAR (Vertical Tabs) */}
                <div className="w-64 bg-black/20 border-r border-[#4fffa0]/10 flex flex-col py-6 space-y-1">
                    <button
                        onClick={() => setSideTab('missions')}
                        className={`w-full px-6 py-3 text-left font-bold text-sm uppercase transition-colors flex items-center gap-3 border-l-2
                            ${sideTab === 'missions' ? 'border-[#00ff41] text-white bg-[#00ff41]/10' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <Shield size={18} /> Active Missions
                    </button>
                    <button
                        onClick={() => setSideTab('history')}
                        className={`w-full px-6 py-3 text-left font-bold text-sm uppercase transition-colors flex items-center gap-3 border-l-2
                            ${sideTab === 'history' ? 'border-[#00ff41] text-white bg-[#00ff41]/10' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <History size={18} /> Mission History
                    </button>
                    <button
                        onClick={() => setSideTab('rewards')}
                        className={`w-full px-6 py-3 text-left font-bold text-sm uppercase transition-colors flex items-center gap-3 border-l-2
                            ${sideTab === 'rewards' ? 'border-[#00ff41] text-white bg-[#00ff41]/10' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <Award size={18} /> Rewards
                    </button>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 overflow-y-auto bg-black/10 p-8 relative custom-scrollbar">
                    {/* Content Switcher */}
                    {topTab === 'overview' ? (
                        <div className="space-y-6">
                            {/* Header for Side Tab */}
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold text-white uppercase">{sideTab.replace('_', ' ')}</h3>
                                {sideTab === 'missions' && <span className="text-xs text-[#00ff41]">ACTIVE DEPLOYMENTS: {dashboard?.active_locks?.length || 0}</span>}
                            </div>

                            {/* --- TAB CONTENT: ACTIVE MISSIONS --- */}
                            {sideTab === 'missions' && (
                                <div className="grid gap-4">
                                    {dashboard?.active_locks && dashboard.active_locks.length > 0 ? (
                                        dashboard.active_locks.map((lock, i) => (
                                            <div key={i} className="bg-[#0a0c10] border border-gray-800 p-4 rounded hover:border-[#00ff41]/50 transition-colors group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded 
                                                            ${lock.tier === 'elite' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                                                            {lock.tier}
                                                        </span>
                                                        <div className="text-white font-bold mt-2">Mission #{lock.signature.slice(0, 8)}...</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[#00ff41] text-sm font-bold">{lock.amount_formatted} Tokens</div>
                                                        <div className="text-[10px] text-gray-500">LOCKED</div>
                                                    </div>
                                                </div>
                                                {/* Progress Bar Mockup */}
                                                <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                                    <div className="h-full bg-[#00ff41] w-[60%] animate-pulse" />
                                                </div>
                                                <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                                                    <span>STATUS: DEPLOYED</span>
                                                    <span>UNLOCK: {new Date(lock.unlock_time * 1000).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg">
                                            <Shield className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">No active missions deployed.</p>
                                            <p className="text-xs text-gray-600 mt-1">Select a mission tier to begin.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- TAB CONTENT: HISTORY --- */}
                            {sideTab === 'history' && (
                                <div className="space-y-4">
                                    <div className="bg-[#0a0c10] border border-gray-800 p-4 rounded opacity-50">
                                        <p className="text-gray-500 text-sm text-center">No mission history logs found.</p>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB CONTENT: REWARDS --- */}
                            {sideTab === 'rewards' && (
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-[#00ff41]/10 to-transparent border border-[#00ff41]/20 p-6 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#00ff41]/20 flex items-center justify-center text-[#00ff41]">
                                                <Award size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400 uppercase">Total Rewards Earned</div>
                                                <div className="text-2xl font-bold text-white">0.00 <span className="text-xs text-[#00ff41]">TOKENS</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#0a0c10] p-4 rounded border border-gray-800">
                                            <div className="text-xs text-gray-500 uppercase">Tier Multiplier</div>
                                            <div className="text-lg font-bold text-white">1x</div>
                                        </div>
                                        <div className="bg-[#0a0c10] p-4 rounded border border-gray-800">
                                            <div className="text-xs text-gray-500 uppercase">Mission Points</div>
                                            <div className="text-lg font-bold text-[#00ff41]">0</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        /* --- TOP TAB: LIVE FEED --- */
                        <div className="flex items-center justify-center h-full border border-dashed border-[#00ff41]/30 rounded-lg bg-black/40">
                            <div className="text-center">
                                <Activity className="w-12 h-12 text-[#00ff41] mx-auto mb-4 animate-pulse" />
                                <h3 className="text-white font-bold uppercase tracking-widest mb-1">Live Feed Offline</h3>
                                <p className="text-xs text-gray-500">Waiting for drone uplink...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
