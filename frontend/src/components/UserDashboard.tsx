import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useLockProgram } from '../hooks/useLockProgram';
import { StakingPanel } from './StakingPanel';

import { Star, CircleDollarSign, Lock, Flame, Clock, CheckCircle, XCircle, AlertTriangle, Award, Circle } from 'lucide-react';

// ============================================================================
// TAB STRUCTURE DEFINITION
// ============================================================================

type TopTab = 'overview' | 'mymissions' | 'live' | 'earn';

const TOP_TABS: { key: TopTab; label: string }[] = [
    { key: 'overview', label: 'OVERVIEW' },
    { key: 'mymissions', label: 'My Missions' },
    { key: 'live', label: 'LIVE' },
    { key: 'earn', label: 'BENEFITS' },
];

const SIDEBAR_TABS: Record<TopTab, { key: string; label: string }[]> = {
    overview: [
        { key: 'summary', label: 'SUMMARY' },
        { key: 'missions', label: 'MISSIONS' },
        { key: 'history', label: 'HISTORY' },
    ],
    mymissions: [
        { key: 'details', label: 'DETAILS' },
        { key: 'commands', label: 'COMMANDS' },
        { key: 'controls', label: 'CONTROLS' },
    ],
    live: [
        { key: 'cam', label: 'ACCESS' },
    ],
    earn: [
        { key: 'staking', label: 'BENEFITS' },
    ],
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const UserDashboard: React.FC = () => {
    const { connected } = useWallet();
    const { dashboard, loading: dashboardLoading } = useUserDashboard();
    const { getTokenBalance, formatTokenAmount } = useLockProgram();

    // Two-level tab state
    const [activeTopTab, setActiveTopTab] = useState<TopTab>('overview');
    const [activeSidebarTab, setActiveSidebarTab] = useState<string>('summary');
    const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);

    const loading = dashboardLoading;

    // When top tab changes, reset sidebar to first sub-tab
    const handleTopTabChange = (tab: TopTab) => {
        setActiveTopTab(tab);
        setActiveSidebarTab(SIDEBAR_TABS[tab][0].key);
    };

    // Fetch token balance when connected
    useEffect(() => {
        const fetchBalance = async () => {
            if (connected) {
                try {
                    const balance = await getTokenBalance();
                    setTokenBalance(balance);
                } catch {
                    setTokenBalance(null);
                }
            }
        };
        fetchBalance();
    }, [connected, getTokenBalance]);

    // Calculate rank based on mission points
    const getRankInfo = (points: number) => {
        if (points >= 600) return { name: 'Elite', icon: <Award className="w-4 h-4 text-yellow-400" />, color: 'text-yellow-400', nextThreshold: null, pointsToNext: 0 };
        if (points >= 300) return { name: 'Veteran', icon: <Circle className="w-4 h-4 fill-purple-400 text-purple-400" />, color: 'text-purple-400', nextThreshold: 600, pointsToNext: 600 - points };
        if (points >= 100) return { name: 'Operator', icon: <Circle className="w-4 h-4 fill-blue-400 text-blue-400" />, color: 'text-blue-400', nextThreshold: 300, pointsToNext: 300 - points };
        return { name: 'Novice', icon: <Circle className="w-4 h-4 fill-green-400 text-green-400" />, color: 'text-green-400', nextThreshold: 100, pointsToNext: 100 - points };
    };

    const missionPoints = dashboard?.stats?.mission_points || 0;
    const rankInfo = getRankInfo(missionPoints);

    if (!connected) {
        return (
            <div className="text-center p-8 border border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-400 mb-2">Connect wallet to access Mission Control Center</p>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-[#00ff41] animate-pulse">Loading Mission Data...</div>;
    }

    return (
        <div className="w-full h-full flex flex-col bg-[#0a0c10]/95 border border-[#4fffa0]/20 rounded-xl shadow-2xl backdrop-blur-xl pointer-events-auto overflow-hidden">
            {/* TITLE */}
            <div className="text-center py-2 md:py-4 flex-shrink-0">
                <h2 className="text-base md:text-xl font-bold text-[#00ff41] tracking-widest uppercase">
                    MISSION CONTROL CENTER
                </h2>
            </div>

            {/* TOP HORIZONTAL TABS */}
            <div className="flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 pb-2 flex-shrink-0">
                {TOP_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTopTabChange(tab.key)}
                        className={`px-3 md:px-5 py-1.5 md:py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider border transition-all
                            ${activeTopTab === tab.key
                                ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/10'
                                : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500 bg-black/30'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* MAIN CONTENT: Vertical Sidebar + Content */}
            <div className="flex flex-1 overflow-hidden mx-2 md:mx-4 mb-2 md:mb-4 border border-gray-700">

                {/* LEFT VERTICAL SIDEBAR */}
                <div className="flex flex-col w-24 md:w-28 bg-black/40 border-r border-gray-700 flex-shrink-0">
                    {SIDEBAR_TABS[activeTopTab].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveSidebarTab(tab.key)}
                            className={`py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider border-l-2 transition-all text-left pl-3
                                ${activeSidebarTab === tab.key
                                    ? 'border-[#00ff41] text-[#00ff41] bg-[#00ff41]/10'
                                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 bg-black/20 p-2 md:p-4 overflow-y-auto">
                    {renderContent(activeTopTab, activeSidebarTab, {
                        dashboard,
                        rankInfo,
                        missionPoints,
                        tokenBalance,
                        formatTokenAmount,
                        onNavigate: (topTab: TopTab, sidebarTab: string) => {
                            setActiveTopTab(topTab);
                            setActiveSidebarTab(sidebarTab);
                        },
                    })}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// CONTENT RENDERER
// ============================================================================

interface ContentProps {
    dashboard: any;
    rankInfo: { name: string; icon: React.ReactNode; color: string; nextThreshold: number | null; pointsToNext: number };
    missionPoints: number;
    tokenBalance: bigint | null;
    formatTokenAmount: (amount: bigint | number) => string;
    onNavigate: (topTab: TopTab, sidebarTab: string) => void;
}

function renderContent(topTab: TopTab, sidebarTab: string, props: ContentProps): React.ReactNode {
    const key = `${topTab}:${sidebarTab}`;

    switch (key) {
        // ================================================================
        // OVERVIEW > SUMMARY
        // ================================================================
        case 'overview:summary':
            return <OverviewSummary {...props} />;

        // ================================================================
        // OVERVIEW > MISSIONS
        // ================================================================
        case 'overview:missions':
            return <OverviewMissions {...props} />;

        // ================================================================
        // OVERVIEW > HISTORY
        // ================================================================
        case 'overview:history':
            return (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Clock className="w-12 h-12 mb-4 text-gray-600" />
                    <p className="text-sm">No data available</p>
                </div>
            );

        // ================================================================
        // MY MISSIONS > DETAILS
        // ================================================================
        case 'mymissions:details':
            return <MyMissionDetails {...props} />;

        // ================================================================
        // MY MISSIONS > COMMANDS
        // ================================================================
        case 'mymissions:commands':
            return <MyMissionCommands />;

        // ================================================================
        // MY MISSIONS > CONTROLS
        // ================================================================
        case 'mymissions:controls':
            return <MyMissionControls />;

        // ================================================================
        // LIVE > (Cam)
        // ================================================================
        case 'live:cam':
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-gray-400 text-sm mb-6 text-center max-w-md leading-relaxed">
                        At countdown zero, a 15-minute confirmation window begins.
                        Click 'Mission Access' within this time to secure your slot.
                        The mission interface will launch in a new tab.
                    </p>
                    <button
                        disabled
                        className="px-6 py-2 bg-gray-800/50 border border-gray-600 text-gray-400 text-xs font-bold uppercase rounded cursor-not-allowed"
                    >
                        Mission Access
                    </button>
                </div>
            );

        // ================================================================
        // EARN > STAKING
        // ================================================================
        case 'earn:staking':
            return (
                <div className="space-y-4">
                    <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-500 text-sm font-bold uppercase tracking-widest">
                            Staking soon available
                        </p>
                    </div>
                    <StakingPanel />
                </div>
            );

        default:
            return <div className="text-gray-500 text-sm text-center p-8">Coming soon</div>;
    }
}

// ============================================================================
// OVERVIEW > SUMMARY CONTENT
// ============================================================================

const OverviewSummary: React.FC<ContentProps> = ({ dashboard, rankInfo, missionPoints, tokenBalance, formatTokenAmount }) => (
    <div className="space-y-2 md:space-y-4 text-xs md:text-sm">
        {/* Rank & Points Section */}
        <div className="border border-gray-700 rounded-lg p-2 md:p-4 bg-black/30">
            <div className="flex items-center justify-between mb-2 md:mb-3">
                <div>
                    <span className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wider">Your Rank</span>
                    <p className={`text-sm md:text-lg font-bold ${rankInfo.color} flex items-center gap-1 md:gap-2`}>{rankInfo.icon} {rankInfo.name}</p>
                </div>
                <div className="text-right">
                    <span className="text-gray-500 text-[10px] md:text-xs">Next rank</span>
                    <p className="text-white font-mono text-sm md:text-base">
                        <span className="line-through text-red-400 text-xs mr-1">400</span> 200
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-gray-500 text-[10px] md:text-xs">Token amount</span>
                    <p className="text-[#00ff41] font-mono text-sm md:text-lg font-bold">
                        {tokenBalance !== null ? formatTokenAmount(tokenBalance) : '—'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
                <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                <span className="text-gray-500 text-[10px] md:text-xs">Mission Points:</span>
                <span className="text-white font-bold">{missionPoints}</span>
            </div>
        </div>

        {/* Total Tokens Section */}
        <div className="border border-gray-700 rounded-lg p-2 md:p-4 bg-black/30">
            <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 md:mb-3">Tokens</h4>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div>
                    <div className="flex items-center gap-1 text-gray-500 text-[10px] md:text-xs mb-0.5 md:mb-1">
                        <CircleDollarSign className="w-2.5 h-2.5 md:w-3 md:h-3" /> Earned
                    </div>
                    <p className="text-white font-mono text-xs md:text-sm">{(dashboard?.stats?.total_earned || 0).toLocaleString()}</p>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-gray-500 text-[10px] md:text-xs mb-0.5 md:mb-1">
                        <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#00ff41]" /> <span className="text-[#00ff41]">Lock</span>
                    </div>
                    <p className="text-[#00ff41] font-mono font-bold text-xs md:text-sm">{(dashboard?.stats?.total_locked || 0).toLocaleString()}</p>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                        <Flame className="w-3 h-3 text-orange-400" /> Burned
                    </div>
                    <p className="text-orange-400 font-mono">{(dashboard?.stats?.total_burned || 0).toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* Missions Status Section */}
        <div className="border border-gray-700 rounded-lg p-4 bg-black/30">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Missions</h4>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#00ff41]" /> <span className="text-[#00ff41]">Reserved</span>
                    </span>
                    <span className="text-[#00ff41] font-bold">{dashboard?.active_locks?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-400" /> Completed
                    </span>
                    <span className="text-white">{dashboard?.stats?.missions_completed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-400" /> Canceled (Not Started)
                    </span>
                    <span className="text-gray-500">{dashboard?.stats?.missions_canceled || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" /> Failed (Technical Error)
                    </span>
                    <span className="text-gray-500">{dashboard?.stats?.missions_failed || 0}</span>
                </div>
            </div>
        </div>
    </div>
);

// ============================================================================
// OVERVIEW > MISSIONS CONTENT
// ============================================================================

const OverviewMissions: React.FC<ContentProps> = ({ onNavigate }) => (
    <div className="space-y-4 text-xs md:text-sm">
        {/* Missions Table */}
        <div className="border border-gray-700 rounded-lg p-2 md:p-4 bg-black/30">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Available Missions</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-[10px] md:text-xs">
                    <thead>
                        <tr className="text-gray-500 text-left border-b border-gray-700">
                            <th className="pb-2 pr-2">Mission Title</th>
                            <th className="pb-2 pr-2">Difficulty</th>
                            <th className="pb-2 pr-2">Type</th>
                            <th className="pb-2 pr-2">Rewards</th>
                            <th className="pb-2 pr-2">Points</th>
                            <th className="pb-2 pr-2">Participants</th>
                            <th className="pb-2">Start in</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const targetDate = new Date('2026-03-21T14:00:00Z');
                            const now = new Date();
                            const baseDays = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

                            const missions = [
                                { title: 'Swarm Protocol - Initiation', difficulty: 'Easy', type: 'Paid', rewards: '3%', points: '10-60-100', participants: '2000', daysOffset: 0 },
                                { title: 'Swarm Protocol - Flood', difficulty: 'Easy', type: 'Paid', rewards: '3%', points: '10-60-100', participants: '1000', daysOffset: 21 },
                                { title: 'Swarm Protocol - Operational', difficulty: 'Medium', type: 'Earn', rewards: '0%', points: '50', participants: '500', daysOffset: 29 },
                                { title: 'Operation Infrastructure', difficulty: 'Medium', type: 'Earn', rewards: '0%', points: '50', participants: '200', daysOffset: 43 },
                            ];

                            return missions.map((m, idx) => (
                                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                                    <td className="py-2 pr-2 text-white font-medium">{m.title}</td>
                                    <td className={`py-2 pr-2 ${m.difficulty === 'Easy' ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {m.difficulty}
                                    </td>
                                    <td className={`py-2 pr-2 ${m.type === 'Paid' ? 'text-[#00ff41]' : 'text-blue-400'}`}>
                                        {m.type}
                                    </td>
                                    <td className="py-2 pr-2 text-gray-300">{m.rewards}</td>
                                    <td className="py-2 pr-2 text-yellow-400">{m.points}</td>
                                    <td className="py-2 pr-2 text-gray-300">{m.participants}</td>
                                    <td className="py-2 text-[#00ff41] font-mono font-bold">
                                        {baseDays + m.daysOffset} days
                                    </td>
                                </tr>
                            ));
                        })()}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Quick Link to My Mission */}
        <div className="flex gap-2 mt-4">
            <button
                onClick={() => onNavigate('mymissions', 'details')}
                className="flex-1 py-2 bg-[#00ff41]/10 border border-[#00ff41]/50 text-[#00ff41] text-xs font-bold uppercase hover:bg-[#00ff41]/20 transition-all rounded"
            >
                View My Mission
            </button>
        </div>
    </div>
);

// ============================================================================
// MY MISSIONS > DETAILS CONTENT
// ============================================================================

const MyMissionDetails: React.FC<ContentProps> = ({ dashboard }) => {
    const activeLock = dashboard?.active_locks?.[0];

    if (!activeLock) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center p-6 border border-dashed border-gray-600 rounded-lg max-w-md">
                    <p className="text-gray-400 text-sm">
                        To participate in a mission, you must reserve a slot.
                    </p>
                </div>
            </div>
        );
    }

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
    const points = tierPoints[activeLock.tier] || 0;
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
                        <p className="text-yellow-400 font-bold">{points}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MY MISSIONS > COMMANDS CONTENT
// ============================================================================

const MyMissionCommands: React.FC = () => (
    <div className="space-y-6 text-sm overflow-y-auto max-h-[60vh] pr-2">
        {/* Target Zone Behavior */}
        <div>
            <h3 className="text-white font-bold text-base mb-2">Target Zone Behavior</h3>
            <ul className="text-gray-300 space-y-1 list-disc list-inside ml-1">
                <li>Automatic navigation to the target zone</li>
                <li>No manual control over speed or distance</li>
                <li>Free movement within the permitted zone boundaries</li>
                <li>Altitude adjustments limited to a predefined range</li>
                <li>Automatic Return-to-Home when required</li>
            </ul>
        </div>

        {/* Object Tagging */}
        <div>
            <h3 className="text-white font-bold text-base mb-2">Object Tagging</h3>
            <p className="text-gray-300 mb-2">
                If a user identifies or suspects an object (for example: vehicles, structures):
            </p>
            <ol className="text-gray-300 space-y-2 list-decimal list-inside ml-1">
                <li>
                    Right-click on the object inside the live camera view
                    <br />
                    <span className="text-gray-500 text-xs ml-5">(remote view from the drone camera)</span>
                </li>
                <li>
                    Select "<span className="text-[#00ff41] font-bold">TAG OBJECT</span>" from the context menu
                </li>
            </ol>
            <p className="text-gray-300 mt-2">
                This marks the object for further review or action.
            </p>
            <p className="text-gray-500 text-xs mt-2">
                A detailed list of taggable object types is communicated separately via Telegram.
            </p>
        </div>

        {/* Supervisor Commands */}
        <div>
            <h3 className="text-white font-bold text-base mb-2">Supervisor Commands</h3>
            <p className="text-gray-300 mb-2">Supervisors can issue the following commands:</p>
            <ul className="text-gray-300 space-y-1 list-disc list-inside ml-1">
                <li>Adjust altitude (e.g. +5 m)</li>
                <li>Hold position</li>
                <li>Adjust camera</li>
                <li className="text-yellow-400">Warning: Restricted Zone</li>
            </ul>
        </div>

        {/* Camera Status Indicators */}
        <div>
            <h3 className="text-white font-bold text-base mb-2">Camera Status Indicators</h3>
            <p className="text-gray-300 mb-2">The current camera connection status is always visible:</p>
            <ul className="space-y-1 ml-1">
                <li className="flex items-center gap-2">
                    <span className="text-[#00ff41] font-bold font-mono text-xs px-2 py-0.5 border border-[#00ff41]/30 rounded">LIVE</span>
                    <span className="text-gray-400 text-xs">Active video feed</span>
                </li>
                <li className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold font-mono text-xs px-2 py-0.5 border border-yellow-400/30 rounded">Signal LOW</span>
                    <span className="text-gray-400 text-xs">Reduced connection quality</span>
                </li>
                <li className="flex items-center gap-2">
                    <span className="text-red-400 font-bold font-mono text-xs px-2 py-0.5 border border-red-400/30 rounded">Signal LOST</span>
                    <span className="text-gray-400 text-xs">No connection to the drone camera</span>
                </li>
            </ul>
        </div>
    </div>
);

// ============================================================================
// MY MISSIONS > CONTROLS CONTENT
// ============================================================================

const MyMissionControls: React.FC = () => (
    <div className="space-y-6 text-sm overflow-y-auto max-h-[60vh] pr-2">
        {/* Recommended Setup */}
        <div>
            <h3 className="text-white font-bold text-base mb-2">Recommended Setup</h3>
            <p className="text-gray-300 mb-2">
                For the best experience, we recommend using a laptop or desktop PC.
            </p>
            <p className="text-gray-400 text-xs mb-1">Supported browsers:</p>
            <ul className="text-gray-300 space-y-1 list-disc list-inside ml-1">
                <li>Google Chrome</li>
                <li>Mozilla Firefox</li>
                <li>Opera</li>
            </ul>
        </div>

        {/* Movement Controls */}
        <div>
            <h3 className="text-white font-bold text-base mb-2">Movement Controls</h3>
            <p className="text-gray-300 mb-2">
                Drone movement can be controlled using the keyboard:
            </p>
            <div className="flex items-center gap-2 my-3 ml-1">
                <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-[#00ff41] font-mono text-xs">↑</kbd>
                <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-[#00ff41] font-mono text-xs">↓</kbd>
                <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-[#00ff41] font-mono text-xs">←</kbd>
                <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-[#00ff41] font-mono text-xs">→</kbd>
                <span className="text-gray-400 text-xs ml-1">Move within the target zone</span>
            </div>
            <p className="text-gray-400 text-xs">
                Alternatively, movement can also be controlled using a mouse.
            </p>
        </div>

        {/* Live Camera Controls */}
        <div>
            <h3 className="text-white font-bold text-base mb-2">Live Camera Controls</h3>
            <p className="text-gray-300 mb-2">
                Within the live camera view, the following controls are available:
            </p>
            <div className="space-y-3 ml-1">
                <div>
                    <span className="text-gray-400 text-xs">Altitude adjustment:</span>
                    <div className="flex items-center gap-2 mt-1">
                        <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-[#00ff41] font-mono text-xs">↑</kbd>
                        <span className="text-gray-500 text-xs">/</span>
                        <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-[#00ff41] font-mono text-xs">↓</kbd>
                        <span className="text-gray-400 text-xs">keys</span>
                    </div>
                </div>
                <div>
                    <span className="text-gray-400 text-xs">Camera zoom:</span>
                    <div className="flex items-center gap-2 mt-1">
                        <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-[#00ff41] font-mono text-xs">+</kbd>
                        <span className="text-gray-500 text-xs">/</span>
                        <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-[#00ff41] font-mono text-xs">−</kbd>
                        <span className="text-gray-400 text-xs">keys</span>
                    </div>
                </div>
            </div>
            <p className="text-gray-500 text-xs mt-4">
                All movements and adjustments operate within system-defined limits to ensure safety and compliance.
            </p>
        </div>
    </div>
);
