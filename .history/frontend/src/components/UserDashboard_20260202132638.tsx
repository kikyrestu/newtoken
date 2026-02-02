import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useMissions } from '../hooks/useMissions';
import { Camera } from 'lucide-react';

export const UserDashboard: React.FC = () => {
    const { connected } = useWallet();
    const { dashboard, loading: dashboardLoading } = useUserDashboard();
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
                        <div className="h-full">
                            {(() => {
                                // Get user's active lock (first one if multiple)
                                const activeLock = dashboard?.active_locks?.[0];

                                if (!activeLock) {
                                    // User has NOT bought a slot
                                    return (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <div className="text-center p-6 border border-dashed border-gray-600 rounded-lg max-w-md">
                                                <p className="text-gray-400 text-sm">
                                                    To participate in a mission, you must reserve a slot.
                                                </p>
                                                <button
                                                    onClick={() => setTopTab('overview')}
                                                    className="mt-4 px-4 py-2 bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] text-xs font-bold uppercase hover:bg-[#00ff41]/20 transition-all"
                                                >
                                                    View Available Missions
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                // User HAS bought a slot - show mission details
                                const tierNames: Record<string, string> = {
                                    spectator: 'Observer',
                                    operator: 'Recon Operator',
                                    elite: 'Elite Operator'
                                };

                                const tierTasks: Record<string, string> = {
                                    spectator: 'Select a drone camera and monitor the area. Objects of interest should be identified and marked.',
                                    operator: 'Fly a drone, observe the target zone and identify & mark objects of interest.',
                                    elite: 'Freely operate a drone within the target zone to conduct advanced observation. Navigate the drone directly to objects of interest for closer inspection.'
                                };

                                const tierPoints: Record<string, number> = {
                                    spectator: 10,
                                    operator: 60,
                                    elite: 100
                                };

                                const roleName = tierNames[activeLock.tier] || activeLock.tier;
                                const taskText = tierTasks[activeLock.tier] || 'Mission task details pending.';
                                const missionPoints = tierPoints[activeLock.tier] || 0;
                                const tokenLocked = activeLock.amount || 0;
                                const tokenReward = Math.floor(tokenLocked * 0.03); // 3% reward

                                return (
                                    <div className="space-y-4 text-sm">
                                        {/* Mission Header */}
                                        <div className="border-b border-gray-700 pb-3">
                                            <h3 className="text-lg font-bold text-[#00ff41]">Swarm Protocol: Initiation</h3>
                                            <p className="text-xs text-gray-500 mt-1">Active Mission</p>
                                        </div>

                                        {/* Mission Details Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <span className="text-gray-500 text-xs">Mission Role</span>
                                                <p className="text-[#00ff41] font-bold">{roleName}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-xs">Token Lock</span>
                                                <p className="text-white font-mono">{tokenLocked.toLocaleString()} Token</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-xs">Difficulty</span>
                                                <p className="text-green-400">Easy</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-xs">Mission Type</span>
                                                <p className="text-white">Paid Reservation</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-xs">Duration</span>
                                                <p className="text-white">~25 min</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-xs">Category</span>
                                                <p className="text-white">reconnaissance</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-xs">Area Type</span>
                                                <p className="text-white">rural</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-xs">Starts In</span>
                                                <p className="text-yellow-400">Coming Soon</p>
                                            </div>
                                        </div>

                                        {/* Task Description */}
                                        <div className="bg-black/30 border border-gray-700 rounded p-3 mt-3">
                                            <span className="text-gray-500 text-xs uppercase tracking-wider">Your Task</span>
                                            <p className="text-gray-300 mt-1">{taskText}</p>
                                        </div>

                                        {/* Rewards Section */}
                                        <div className="border-t border-gray-700 pt-3 mt-3">
                                            <h4 className="text-xs font-bold text-[#00ff41] uppercase tracking-wider mb-2">
                                                🎯 Rewards & Points
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <span className="text-gray-500 text-xs">Token Reward (3%)</span>
                                                    <p className="text-[#00ff41] font-bold">{tokenReward.toLocaleString()} Token</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 text-xs">Mission Points</span>
                                                    <p className="text-yellow-400 font-bold">{missionPoints}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
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
