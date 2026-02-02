import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useMissions } from '../hooks/useMissions';
import { Camera, Loader2 } from 'lucide-react';

export const UserDashboard: React.FC = () => {
    const { connected } = useWallet();
    const { loading: dashboardLoading } = useUserDashboard();
    const { missions, loading: missionsLoading } = useMissions();

    // States for Tabs
    const [topTab, setTopTab] = useState<'overview' | 'my_mission' | 'symbol'>('overview');
    const [sideTab, setSideTab] = useState<'missions' | 'history'>('missions');

    const loading = dashboardLoading || missionsLoading;

    if (!connected) {
        return (
            <div className="text-center p-8 border border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-400 mb-2">Connect wallet to access Mission Control</p>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-[#00ff41] animate-pulse">Loading Mission Data...</div>;
    }

    return (
        <div className="w-full h-[500px] flex flex-col bg-[#0a0c10]/95 border border-[#4fffa0]/20 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl pointer-events-auto">
            {/* TITLE */}
            <div className="text-center py-4">
                <h2 className="text-xl font-bold text-[#00ff41] tracking-widest uppercase">
                    MISSION CONTROL CENTER
                </h2>
            </div>

            {/* HORIZONTAL TABS */}
            <div className="flex justify-center gap-2 px-4 pb-2">
                <button
                    onClick={() => setTopTab('overview')}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all
                        ${topTab === 'overview'
                            ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/10'
                            : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setTopTab('my_mission')}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all
                        ${topTab === 'my_mission'
                            ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/10'
                            : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'}`}
                >
                    My Mission
                </button>
                <button
                    onClick={() => setTopTab('symbol')}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all
                        ${topTab === 'symbol'
                            ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/10'
                            : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'}`}
                >
                    Symbol
                </button>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-1 overflow-hidden mx-4 mb-4 border border-gray-700">

                {/* LEFT SIDEBAR - VERTICAL TABS */}
                <div className="w-24 bg-black/40 border-r border-gray-700 flex flex-col">
                    <button
                        onClick={() => setSideTab('missions')}
                        className={`py-3 text-xs font-bold uppercase tracking-wider border-l-2 transition-all text-left pl-3
                            ${sideTab === 'missions'
                                ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/10'
                                : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Missions
                    </button>
                    <button
                        onClick={() => setSideTab('history')}
                        className={`py-3 text-xs font-bold uppercase tracking-wider border-l-2 transition-all text-left pl-3
                            ${sideTab === 'history'
                                ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/10'
                                : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        History
                    </button>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 bg-black/20 p-4 overflow-y-auto">

                    {/* === OVERVIEW TAB === */}
                    {topTab === 'overview' && (
                        <>
                            {/* MISSIONS CONTENT */}
                            {sideTab === 'missions' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs font-mono">
                                        {/* Table Header */}
                                        <thead>
                                            <tr className="text-gray-400 text-left border-b border-gray-700">
                                                <th className="py-2 px-2 font-normal">Mission Title</th>
                                                <th className="py-2 px-2 font-normal">Difficulty</th>
                                                <th className="py-2 px-2 font-normal">Rewards</th>
                                                <th className="py-2 px-2 font-normal">Points</th>
                                                <th className="py-2 px-2 font-normal">Participants</th>
                                                <th className="py-2 px-2 font-normal">Start In</th>
                                            </tr>
                                        </thead>
                                        {/* Table Body */}
                                        <tbody>
                                            {missions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-4 text-center text-gray-500">
                                                        No missions available
                                                    </td>
                                                </tr>
                                            ) : (
                                                missions.map((mission) => (
                                                    <tr key={mission.id} className="text-white border-b border-gray-800/50 hover:bg-[#00ff41]/5">
                                                        <td className="py-2 px-2">{mission.title}</td>
                                                        <td className={`py-2 px-2 ${mission.difficulty === 'Easy' ? 'text-green-400' : 'text-yellow-400'}`}>
                                                            {mission.difficulty}
                                                        </td>
                                                        <td className="py-2 px-2 text-[#00ff41]">{mission.rewards}</td>
                                                        <td className="py-2 px-2">
                                                            {mission.mission_points.includes(' - ') ? (
                                                                <>
                                                                    <span className="text-blue-400">{mission.mission_points.split(' - ')[0]}</span>
                                                                    <span className="text-gray-500"> - </span>
                                                                    <span className="text-green-400">{mission.mission_points.split(' - ')[1]}</span>
                                                                    <span className="text-gray-500"> - </span>
                                                                    <span className="text-yellow-400">{mission.mission_points.split(' - ')[2]}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-green-400">{mission.mission_points}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-2 text-gray-300">{mission.participants}</td>
                                                        <td className="py-2 px-2 text-gray-300">{mission.start_in || '-'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* HISTORY CONTENT */}
                            {sideTab === 'history' && (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500 text-sm">No data available.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* === MY MISSION TAB === */}
                    {topTab === 'my_mission' && (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-sm">No active missions.</p>
                        </div>
                    )}

                    {/* === SYMBOL (LIVE) TAB === */}
                    {topTab === 'symbol' && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Camera className="w-12 h-12 text-[#00ff41]/50 mb-4" />
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">
                                LIVE Access in <span className="text-[#00ff41]">[20]</span> days
                            </h3>
                            <p className="text-xs text-gray-500 mb-6">Live drone camera feeds will be available after mission launch</p>
                            <button
                                disabled
                                className="px-6 py-2 bg-gray-800/50 border border-gray-600 text-gray-500 text-xs font-bold uppercase rounded cursor-not-allowed opacity-60"
                            >
                                Mission Access
                            </button>
                            <p className="text-[10px] text-gray-600 mt-2">Coming soon</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
