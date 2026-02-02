import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { Shield, History, Layout, Camera, Gamepad2, ChevronDown, ChevronUp, Info, Zap, Users, Clock, Trophy, Target } from 'lucide-react';

// Mission data from Vanja
const MISSIONS_DATA = [
    {
        id: 1,
        title: 'Swarm Protocol - Initiation',
        difficulty: 'Easy',
        difficultyColor: 'text-green-400',
        rewards: '3%',
        missionPoints: { observer: 10, operator: 60, elite: 100 },
        participants: 1000,
        startIn: '30 days',
        description: 'Entry-level swarm coordination mission. Learn the basics of drone network operations.',
        objectives: ['Complete basic drone calibration', 'Participate in swarm formation', 'Maintain uplink for 24 hours'],
        requirements: 'Minimum Observer tier required',
    },
    {
        id: 2,
        title: 'Swarm Protocol - Flood',
        difficulty: 'Easy',
        difficultyColor: 'text-green-400',
        rewards: '3%',
        missionPoints: { observer: 10, operator: 60, elite: 100 },
        participants: 1000,
        startIn: '51 days',
        description: 'Mass coordination event. Synchronize with thousands of drone operators.',
        objectives: ['Join the flood protocol', 'Maintain position in swarm', 'Execute synchronized maneuvers'],
        requirements: 'Minimum Observer tier required',
    },
    {
        id: 3,
        title: 'Swarm Protocol - Operational',
        difficulty: 'Medium',
        difficultyColor: 'text-yellow-400',
        rewards: '0%',
        missionPoints: { observer: 0, operator: 50, elite: 50 },
        participants: 500,
        startIn: '62 days',
        description: 'Advanced operational mission requiring tactical precision.',
        objectives: ['Complete tactical objectives', 'Coordinate with team', 'Execute advanced maneuvers'],
        requirements: 'Minimum Operator tier required',
    },
    {
        id: 4,
        title: 'Operation Infrastructure',
        difficulty: 'Medium',
        difficultyColor: 'text-yellow-400',
        rewards: '0%',
        missionPoints: { observer: 0, operator: 50, elite: 50 },
        participants: 200,
        startIn: '75 days',
        description: 'Strategic infrastructure mission for elite operators.',
        objectives: ['Secure critical infrastructure', 'Maintain defensive perimeter', 'Complete reconnaissance'],
        requirements: 'Minimum Operator tier required',
    },
];

// Tooltip component
const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-flex items-center">
            <div
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            >
                {children}
            </div>
            {show && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-[#00ff41]/30 rounded text-xs text-gray-300 shadow-xl">
                    {content}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-black border-r border-b border-[#00ff41]/30 rotate-45 -mt-1" />
                </div>
            )}
        </div>
    );
};

// Mission Points with tier colors
const MissionPointsDisplay: React.FC<{ points: { observer: number; operator: number; elite: number } }> = ({ points }) => {
    if (points.observer === 0 && points.operator > 0) {
        // Only operator+ can earn
        return (
            <span className="font-mono">
                <span className="text-gray-600">-</span>
                <span className="text-gray-500"> / </span>
                <span className="text-green-400">{points.operator}</span>
                <span className="text-gray-500"> / </span>
                <span className="text-green-400">{points.elite}</span>
            </span>
        );
    }
    return (
        <span className="font-mono">
            <span className="text-blue-400">{points.observer}</span>
            <span className="text-gray-500"> / </span>
            <span className="text-green-400">{points.operator}</span>
            <span className="text-gray-500"> / </span>
            <span className="text-yellow-400">{points.elite}</span>
        </span>
    );
};

// Expandable Mission Row
const MissionRow: React.FC<{ mission: typeof MISSIONS_DATA[0] }> = ({ mission }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-gray-800 rounded-lg overflow-hidden hover:border-[#00ff41]/30 transition-colors">
            {/* Main Row */}
            <div
                className="grid grid-cols-6 gap-4 p-4 cursor-pointer hover:bg-[#00ff41]/5 transition-colors items-center"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Title */}
                <div className="col-span-1">
                    <div className="font-bold text-white text-sm">{mission.title}</div>
                </div>

                {/* Difficulty */}
                <div className="col-span-1">
                    <span className={`text-xs font-bold uppercase ${mission.difficultyColor}`}>
                        {mission.difficulty}
                    </span>
                </div>

                {/* Rewards */}
                <div className="col-span-1">
                    <Tooltip content="Reward percentage upon mission completion">
                        <span className="text-[#00ff41] font-bold">{mission.rewards}</span>
                    </Tooltip>
                </div>

                {/* Mission Points */}
                <div className="col-span-1">
                    <Tooltip content="Points per tier: Observer / Operator / Elite">
                        <MissionPointsDisplay points={mission.missionPoints} />
                    </Tooltip>
                </div>

                {/* Participants */}
                <div className="col-span-1">
                    <Tooltip content="Maximum participants allowed">
                        <span className="text-gray-400 flex items-center gap-1">
                            <Users size={12} />
                            {mission.participants.toLocaleString()}
                        </span>
                    </Tooltip>
                </div>

                {/* Start In + Expand */}
                <div className="col-span-1 flex items-center justify-between">
                    <Tooltip content="Time until mission begins">
                        <span className="text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {mission.startIn}
                        </span>
                    </Tooltip>
                    <button className="text-gray-500 hover:text-[#00ff41] transition-colors">
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="bg-black/40 border-t border-gray-800 p-4 space-y-4">
                    <p className="text-gray-400 text-sm">{mission.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h5 className="text-xs text-[#00ff41] uppercase font-bold mb-2 flex items-center gap-2">
                                <Target size={12} /> Objectives
                            </h5>
                            <ul className="space-y-1">
                                {mission.objectives.map((obj, i) => (
                                    <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                                        <div className="w-1 h-1 bg-[#00ff41] rounded-full" />
                                        {obj}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-xs text-yellow-400 uppercase font-bold mb-2 flex items-center gap-2">
                                <Zap size={12} /> Requirements
                            </h5>
                            <p className="text-xs text-gray-400">{mission.requirements}</p>
                        </div>
                    </div>

                    <button className="px-4 py-2 bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] text-xs font-bold uppercase rounded hover:bg-[#00ff41]/20 transition-colors">
                        View Details
                    </button>
                </div>
            )}
        </div>
    );
};

export const UserDashboard: React.FC = () => {
    const { connected } = useWallet();
    const { dashboard, loading } = useUserDashboard();

    // States for Tabs
    const [topTab, setTopTab] = useState<'overview' | 'my_mission' | 'live'>('overview');
    const [sideTab, setSideTab] = useState<'missions' | 'history'>('missions');

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
                        <span className="text-[#00ff41]">MISSION</span> CONTROL CENTER
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
                            onClick={() => setTopTab('my_mission')}
                            className={`px-6 h-full border-b-2 font-bold text-sm tracking-mid uppercase transition-colors flex items-center gap-2
                                ${topTab === 'my_mission' ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/5' : 'border-transparent text-gray-500 hover:text-white'}`}
                        >
                            <Trophy size={16} /> My Mission
                        </button>
                        <button
                            onClick={() => setTopTab('live')}
                            className={`px-6 h-full border-b-2 font-bold text-sm tracking-mid uppercase transition-colors flex items-center gap-2
                                ${topTab === 'live' ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/5' : 'border-transparent text-gray-500 hover:text-white'}`}
                        >
                            <Radio size={16} className={topTab === 'live' ? 'animate-pulse' : ''} />
                            <Camera size={14} />
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
                <div className="w-48 bg-black/20 border-r border-[#4fffa0]/10 flex flex-col py-6 space-y-1">
                    <button
                        onClick={() => setSideTab('missions')}
                        className={`w-full px-6 py-3 text-left font-bold text-sm uppercase transition-colors flex items-center gap-3 border-l-2
                            ${sideTab === 'missions' ? 'border-[#00ff41] text-white bg-[#00ff41]/10' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <Shield size={18} /> Missions
                    </button>
                    <button
                        onClick={() => setSideTab('history')}
                        className={`w-full px-6 py-3 text-left font-bold text-sm uppercase transition-colors flex items-center gap-3 border-l-2
                            ${sideTab === 'history' ? 'border-[#00ff41] text-white bg-[#00ff41]/10' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <History size={18} /> History
                    </button>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 overflow-y-auto bg-black/10 p-6 relative custom-scrollbar">

                    {/* === OVERVIEW TAB === */}
                    {topTab === 'overview' && (
                        <div className="space-y-6">
                            {/* --- MISSIONS TAB CONTENT --- */}
                            {sideTab === 'missions' && (
                                <div className="space-y-4">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-6 gap-4 px-4 py-2 text-xs text-gray-500 uppercase font-bold border-b border-gray-800">
                                        <div className="flex items-center gap-1">
                                            Mission Title
                                            <Tooltip content="Name of the mission">
                                                <Info size={10} className="text-gray-600" />
                                            </Tooltip>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            Difficulty
                                            <Tooltip content="Mission difficulty level">
                                                <Info size={10} className="text-gray-600" />
                                            </Tooltip>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            Rewards
                                            <Tooltip content="Token reward percentage">
                                                <Info size={10} className="text-gray-600" />
                                            </Tooltip>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            Points
                                            <Tooltip content="Mission points per tier (Observer / Operator / Elite)">
                                                <Info size={10} className="text-gray-600" />
                                            </Tooltip>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            Participants
                                            <Tooltip content="Maximum number of participants">
                                                <Info size={10} className="text-gray-600" />
                                            </Tooltip>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            Start In
                                            <Tooltip content="Time until mission start">
                                                <Info size={10} className="text-gray-600" />
                                            </Tooltip>
                                        </div>
                                    </div>

                                    {/* Mission Rows */}
                                    {MISSIONS_DATA.map((mission) => (
                                        <MissionRow key={mission.id} mission={mission} />
                                    ))}
                                </div>
                            )}

                            {/* --- HISTORY TAB CONTENT --- */}
                            {sideTab === 'history' && (
                                <div className="flex items-center justify-center h-64 border border-dashed border-gray-800 rounded-lg">
                                    <div className="text-center">
                                        <History className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No data available.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* === MY MISSION TAB === */}
                    {topTab === 'my_mission' && (
                        <div className="flex items-center justify-center h-64 border border-dashed border-gray-800 rounded-lg">
                            <div className="text-center">
                                <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No active missions.</p>
                                <p className="text-xs text-gray-600 mt-1">Select a tier to begin your mission.</p>
                            </div>
                        </div>
                    )}

                    {/* === LIVE TAB === */}
                    {topTab === 'live' && (
                        <div className="h-full flex flex-col">
                            {/* Main Live Feed Placeholder */}
                            <div className="flex-1 flex items-center justify-center border border-dashed border-[#00ff41]/30 rounded-lg bg-black/40">
                                <div className="text-center">
                                    <Camera className="w-16 h-16 text-[#00ff41]/50 mx-auto mb-6" />
                                    <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">
                                        LIVE Access in <span className="text-[#00ff41]">[20]</span> days
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-8">Live drone camera feeds will be available after mission launch</p>

                                    {/* Disabled Mission Access Button */}
                                    <button
                                        disabled
                                        className="px-8 py-3 bg-gray-800/50 border-2 border-gray-600 text-gray-500 font-bold text-sm uppercase tracking-wider rounded cursor-not-allowed opacity-60 flex items-center gap-2 mx-auto"
                                    >
                                        <Gamepad2 className="w-4 h-4" />
                                        Mission Access
                                    </button>
                                    <p className="text-xs text-gray-600 mt-2">Coming soon</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
