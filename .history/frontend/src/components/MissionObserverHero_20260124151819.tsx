import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { MissionTierCard } from './MissionTierCard';
import { CountdownTimer } from './CountdownTimer';
import { UserDashboard } from './UserDashboard';
import { JupiterSwapModal } from './JupiterSwap';
import { HUDOverlay } from './HUDOverlay';
import { TelemetryWidget } from './TelemetryWidget';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { Shield, ChevronRight, X } from 'lucide-react';

// Token mint address - update with your actual token
const TOKEN_MINT = import.meta.env.VITE_TOKEN_MINT || '11111111111111111111111111111111';

// Reusable Rugged Terminal Component
const RuggedTerminal = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
    return (
        <div className={`relative rugged-border bg-[#09090b] ${className}`}>
            {/* Corner Bolts */}
            <div className="corner-bolt top-2 left-2" />
            <div className="corner-bolt top-2 right-2" />
            <div className="corner-bolt bottom-2 left-2" />
            <div className="corner-bolt bottom-2 right-2" />

            {/* Inner Content with Glassmorphism */}
            <div className="relative h-full w-full overflow-hidden rounded-md deep-glass p-1">
                {/* Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,65,0.03)_3px)] z-10" />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 to-transparent z-10" />

                {/* Content Wrapper */}
                <div className="relative z-20 h-full w-full">
                    {children}
                </div>
            </div>
        </div>
    );
};

const MissionObserverHero = () => {
    const { connected } = useWallet();
    const { nextUnlock } = useUserDashboard();

    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);

    // DEBUG: Timer position editor state
    const [debugMode, setDebugMode] = useState(true); // Set to false to hide debug panel
    const [timerPos, setTimerPos] = useState({
        top: 35,
        bottom: 38,
        left: 15,
        right: 15
    });

    // Use unlock timestamp if user has active locks, otherwise show fake timer
    const unlockTimestamp = nextUnlock?.unix_timestamp || undefined;

    return (
        <div className="relative h-screen w-full overflow-hidden bg-[#0a0c10] text-[#00ff41] font-sans selection:bg-emerald-500/30">
            <HUDOverlay />

            {/* VIDEO BACKGROUND */}
            <video
                autoPlay
                loop
                muted
                playsInline
                poster="/bg-drone.png"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
            >
                <source src="/bg-drone-bagus.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Scanline Overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-[1]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                    backgroundSize: '100% 2px, 3px 100%'
                }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-[2]" />

            {/* Content Overlay */}
            <div className="absolute inset-0 z-10 p-2 md:p-4 flex flex-col h-full pointer-events-none">

                {/* --- TOP NAV BAR --- */}
                <header className="flex-shrink-0 flex justify-between items-start pointer-events-auto min-h-[60px] md:min-h-[80px]">
                    {/* Top Left Stats - Telemetry Widget */}
                    <div className="scale-75 origin-top-left md:scale-90 lg:scale-100">
                        <TelemetryWidget
                            onSafetyClick={() => setShowSafetyModal(true)}
                            onInstructionsClick={() => console.log('Instructions clicked')}
                        />
                    </div>

                    {/* Top Right Buttons */}
                    <div className="flex items-center gap-4">
                        {/* Dashboard Toggle (only when connected) */}
                        {connected && (
                            <button
                                onClick={() => setShowDashboard(!showDashboard)}
                                className={`text-white font-bold text-xs md:text-base hover:text-[#00ff41] transition-colors px-2 py-1 ${showDashboard ? 'text-[#00ff41]' : ''}`}
                            >
                                {showDashboard ? '← Back' : 'Dashboard'}
                            </button>
                        )}
                        <button
                            onClick={() => setShowSwapModal(true)}
                            className="text-white font-bold text-xs md:text-base hover:text-[#00ff41] transition-colors px-2 py-1"
                        >
                            Swap
                        </button>
                        <button className="hidden md:block text-white font-bold text-base hover:text-[#00ff41] transition-colors px-2 py-1">
                            About
                        </button>

                        {/* Wallet Button */}
                        <WalletMultiButton className="!px-3 md:!px-6 !py-1.5 md:!py-2 !bg-[#050505]/80 !border-2 !border-[#00ff41] !rounded-full !text-[#00ff41] !font-bold !text-xs md:!text-sm !tracking-wide hover:!bg-[#00ff41] hover:!text-black !transition-all !shadow-[0_0_20px_rgba(0,255,65,0.3)]" />
                    </div>
                </header>

                {/* --- CENTER CONTENT --- */}
                {showDashboard ? (
                    /* User Dashboard View */
                    <main className="flex-1 flex items-center justify-center overflow-auto pointer-events-auto">
                        <div className="w-full max-w-4xl">
                            <UserDashboard />
                        </div>
                    </main>
                ) : (
                    /* Timer & Mission Cards View */
                    <main className="flex-1 flex flex-col justify-center items-center gap-1 md:gap-4 min-h-0 pointer-events-auto">

                        {/* CENTER DISPLAY AREA - STRICT CONDITIONAL (PNG Timer vs CSS Modal) */}
                        <div className="flex-shrink-0 flex items-center justify-center px-4 w-full mb-8 md:mb-12">
                            {!showSafetyModal ? (
                                <div className="w-full max-w-2xl h-[420px] md:h-[560px] lg:h-[620px] flex items-center justify-center">
                                    <div className="relative inline-block h-full w-auto max-w-full">
                                        <img
                                            src="/assets/timer-countdown.png"
                                            alt="Countdown Frame"
                                            className="h-full w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                                        />

                                        {/* Timer container with DYNAMIC positioning */}
                                        <div
                                            className="absolute flex items-center justify-center"
                                            style={{
                                                top: `${timerPos.top}%`,
                                                bottom: `${timerPos.bottom}%`,
                                                left: `${timerPos.left}%`,
                                                right: `${timerPos.right}%`
                                            }}
                                        >
                                            {/* DEBUG RULER - Only show when debugMode is on */}
                                            {debugMode && (
                                                <div className="absolute inset-0 pointer-events-none z-50">
                                                    {/* Horizontal center line */}
                                                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-500 opacity-80" />
                                                    {/* Vertical center line */}
                                                    <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-red-500 opacity-80" />
                                                    {/* Border to show container bounds */}
                                                    <div className="absolute inset-0 border-2 border-yellow-400 opacity-60" />
                                                    {/* Center dot */}
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full" />
                                                </div>
                                            )}

                                            <CountdownTimer
                                                unlockTimestamp={unlockTimestamp}
                                                size="md"
                                                showLabels={false}
                                                showStatus={false}
                                                variant="device"
                                                className="w-full h-full flex items-center justify-center"
                                            />
                                        </div>

                                        {/* DEBUG CONTROL PANEL */}
                                        {debugMode && (
                                            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 bg-black/95 border border-green-500 rounded-lg p-4 pointer-events-auto z-[100] min-w-[400px]">
                                                <div className="text-green-400 font-mono text-xs mb-3 text-center font-bold">🔧 TIMER POSITION EDITOR</div>

                                                {/* Control Grid */}
                                                <div className="grid grid-cols-4 gap-2 mb-3">
                                                    {/* TOP */}
                                                    <div className="col-span-4 flex items-center justify-center gap-2">
                                                        <span className="text-yellow-400 font-mono text-xs w-16">TOP:</span>
                                                        <button onClick={() => setTimerPos(p => ({ ...p, top: p.top - 1 }))} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs">▲ -1</button>
                                                        <span className="text-white font-mono text-sm w-12 text-center">{timerPos.top}%</span>
                                                        <button onClick={() => setTimerPos(p => ({ ...p, top: p.top + 1 }))} className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs">▼ +1</button>
                                                    </div>

                                                    {/* LEFT */}
                                                    <div className="col-span-2 flex items-center gap-2">
                                                        <span className="text-yellow-400 font-mono text-xs w-16">LEFT:</span>
                                                        <button onClick={() => setTimerPos(p => ({ ...p, left: p.left - 1 }))} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs">◀ -1</button>
                                                        <span className="text-white font-mono text-sm w-12 text-center">{timerPos.left}%</span>
                                                        <button onClick={() => setTimerPos(p => ({ ...p, left: p.left + 1 }))} className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs">▶ +1</button>
                                                    </div>

                                                    {/* RIGHT */}
                                                    <div className="col-span-2 flex items-center gap-2">
                                                        <span className="text-yellow-400 font-mono text-xs w-16">RIGHT:</span>
                                                        <button onClick={() => setTimerPos(p => ({ ...p, right: p.right - 1 }))} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs">◀ -1</button>
                                                        <span className="text-white font-mono text-sm w-12 text-center">{timerPos.right}%</span>
                                                        <button onClick={() => setTimerPos(p => ({ ...p, right: p.right + 1 }))} className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs">▶ +1</button>
                                                    </div>

                                                    {/* BOTTOM */}
                                                    <div className="col-span-4 flex items-center justify-center gap-2">
                                                        <span className="text-yellow-400 font-mono text-xs w-16">BOTTOM:</span>
                                                        <button onClick={() => setTimerPos(p => ({ ...p, bottom: p.bottom + 1 }))} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs">▲ +1</button>
                                                        <span className="text-white font-mono text-sm w-12 text-center">{timerPos.bottom}%</span>
                                                        <button onClick={() => setTimerPos(p => ({ ...p, bottom: p.bottom - 1 }))} className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs">▼ -1</button>
                                                    </div>
                                                </div>

                                                {/* CSS OUTPUT */}
                                                <div className="bg-gray-900 p-2 rounded border border-gray-700 font-mono text-xs">
                                                    <div className="text-gray-400 mb-1">📋 Copy this CSS:</div>
                                                    <code className="text-cyan-400 select-all">
                                                        top-[{timerPos.top}%] bottom-[{timerPos.bottom}%] left-[{timerPos.left}%] right-[{timerPos.right}%]
                                                    </code>
                                                </div>

                                                {/* Toggle Button */}
                                                <button
                                                    onClick={() => setDebugMode(false)}
                                                    className="mt-2 w-full bg-gray-700 hover:bg-gray-600 text-white py-1 rounded text-xs"
                                                >
                                                    ✓ Done - Hide Debug Panel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <RuggedTerminal className="w-full max-w-2xl h-[420px] md:h-[560px] lg:h-[620px] transition-all duration-500">
                                    <div className="h-full w-full flex flex-col p-6 md:p-8 animate-tv-on overflow-y-auto">
                                        <button
                                            onClick={() => setShowSafetyModal(false)}
                                            className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 transition-colors z-50 p-2 hover:bg-white/5 rounded-full"
                                        >
                                            <X size={24} />
                                        </button>

                                        <div className="flex items-center gap-3 border-b border-[#00ff41]/30 pb-4 mb-6">
                                            <Shield className="w-8 h-8 text-[#00ff41]" />
                                            <h2 className="text-xl md:text-2xl font-bold text-[#00ff41] uppercase tracking-wider">
                                                Safety & Control Systems
                                            </h2>
                                        </div>

                                        <ul className="space-y-4 text-sm md:text-base text-zinc-300 font-mono">
                                            {[
                                                { title: "Altitude Enforcement", desc: "Drone automatically climbs to its assigned altitude. Height adjustments allowed only within safe limits." },
                                                { title: "Geo-Fence Active", desc: "Flight area strictly defined — operation outside the zone is blocked." },
                                                { title: "Anti-Collision / Swarm Separation", desc: "Active system prevents contact with other drones or obstacles + crash prevention." },
                                                { title: "Signal Loss Response", desc: "Auto-hover, stabilization, RTB (Return to Base)." },
                                                { title: "Continuous Monitoring", desc: "Live telemetry + full mission logging for audit/replay. Certified Operator Oversight." }
                                            ].map((item, index) => (
                                                <li key={index} className="flex items-start gap-3 group">
                                                    <ChevronRight className="w-5 h-5 text-[#00ff41] mt-0.5 group-hover:translate-x-1 transition-transform" />
                                                    <div>
                                                        <strong className="text-white block mb-0.5 uppercase tracking-wide text-xs md:text-sm">{item.title}</strong>
                                                        <span className="text-zinc-400 text-xs md:text-sm leading-relaxed">{item.desc}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </RuggedTerminal>
                            )}
                        </div>

                        {/* --- BOTTOM: MISSION CARDS --- */}
                        <div className="flex-shrink-0 w-full px-4 md:px-8 pb-4">
                            <div className="max-w-7xl mx-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                    <MissionTierCard
                                        tier="spectator"
                                        title="Watch the mission"
                                        description="Watch the mission unfold live and choose from all active drones in real time"
                                        cardNumber=""
                                        onSuccess={(sig) => console.log('Spectator locked:', sig)}
                                    />
                                    <MissionTierCard
                                        tier="operator"
                                        title="Mission"
                                        description="Take control of your drone live and fly it remotely in real time."
                                        cardNumber=""
                                        onSuccess={(sig) => console.log('Operator locked:', sig)}
                                    />
                                    <MissionTierCard
                                        tier="elite"
                                        title="Mission 1+2"
                                        description="Control your drone and secure your spot for the next mission."
                                        cardNumber=""
                                        onSuccess={(sig) => console.log('Elite locked:', sig)}
                                    />
                                </div>
                            </div>
                        </div>
                    </main>
                )}

            </div>

            {/* Jupiter Swap Modal */}
            <JupiterSwapModal
                isOpen={showSwapModal}
                onClose={() => setShowSwapModal(false)}
                outputMint={TOKEN_MINT}
                fixedOutput={true}
                onSuccess={(txid) => {
                    console.log('Swap successful:', txid);
                    setShowSwapModal(false);
                }}
            />
        </div>
    );
};

export default MissionObserverHero;
