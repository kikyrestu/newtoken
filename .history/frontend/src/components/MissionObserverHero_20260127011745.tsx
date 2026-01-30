import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { MissionTierCard } from './MissionTierCard';
import { UserDashboard } from './UserDashboard';
import { JupiterSwapModal } from './JupiterSwap';
import { HUDOverlay } from './HUDOverlay';
import { TelemetryWidget } from './TelemetryWidget';
import { DebugRuler } from './DebugRuler';
import TimerDevice from './TimerDevice';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { Shield, ChevronRight, X } from 'lucide-react';
import { VisualEditorProvider, VisualEditorControls, useVisualEditor } from './VisualEditorControls';
import { EditableText } from './EditableText';

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

// Inner component that uses the visual editor context
const MissionObserverHeroInner = () => {
    const { connected } = useWallet();
    const { nextUnlock } = useUserDashboard();
    const { showRuler } = useVisualEditor();

    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);

    // Use unlock timestamp if user has active locks, otherwise show fake timer
    const unlockTimestamp = nextUnlock?.unix_timestamp || undefined;

    return (
        <div className="relative h-screen w-full overflow-hidden bg-[#0a0c10] text-[#00ff41] font-sans selection:bg-emerald-500/30">
            <HUDOverlay />
            <DebugRuler show={showRuler} />
            <VisualEditorControls />

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

                        {/* Wallet Button - Tactical Military Style */}
                        <WalletMultiButton className="tactical-wallet-btn !px-4 md:!px-8 !py-2 md:!py-3 !bg-gradient-to-r !from-[#0a1f0a] !to-[#051505] !border-2 !border-[#00ff41] !text-[#00ff41] !font-bold !text-xs md:!text-sm !tracking-widest !uppercase hover:!bg-[#00ff41] hover:!text-black !transition-all !duration-300 !shadow-[0_0_20px_rgba(0,255,65,0.4),inset_0_0_10px_rgba(0,255,65,0.1)]" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }} />
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
                    <main className="flex-1 flex flex-col justify-start min-h-0 pointer-events-auto">

                        {/* CENTER DISPLAY AREA - Timer with Visual Editor */}
                        <div className="absolute inset-0 flex items-center justify-center px-4 pointer-events-none z-[5]">
                            {!showSafetyModal ? (
                                <TimerDevice
                                    unlockTimestamp={unlockTimestamp}
                                    className="pointer-events-auto"
                                />
                            ) : (
                                <div className="warfare-modal holo-bezel holo-3d w-full max-w-xl transition-all duration-500 pointer-events-auto relative">
                                    {/* Outer Frame - Cyberpunk Holographic Tablet */}
                                    <div className="cyberpunk-modal cyber-frame cyber-corner-tl cyber-corner-tr holo-edge-top holo-edge-bottom holo-markers relative overflow-hidden"
                                        style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>

                                        {/* Scan Line Effect */}
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
                                            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ff41]/50 to-transparent"
                                                style={{ animation: 'scan-line 3s linear infinite' }} />
                                        </div>

                                        {/* Header Bar */}
                                        <div className="bg-gradient-to-r from-[#00ff41]/20 via-[#00ff41]/10 to-transparent px-6 py-3 border-b border-[#00ff41]/30 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-[#00ff41] status-indicator shadow-[0_0_10px_#00ff41]" />
                                                <span className="text-[10px] font-mono text-[#00ff41]/70 uppercase tracking-widest">SYSTEM ACTIVE</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] font-mono text-[#00ff41]/50">ID:SAFETY-001</div>
                                                <button
                                                    onClick={() => setShowSafetyModal(false)}
                                                    className="warfare-btn !p-2 !text-xs hover:!bg-red-500/20 hover:!border-red-500 hover:!text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <div className="p-6 md:p-8 max-h-[300px] md:max-h-[350px] overflow-y-auto">
                                            {/* Title with Glitch */}
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="p-3 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-lg">
                                                    <Shield className="w-8 h-8 text-[#00ff41]" />
                                                </div>
                                                <div>
                                                    <h2 className="glitch-text text-xl md:text-2xl font-bold text-[#00ff41] uppercase tracking-wider font-orbitron" data-text="SAFETY PROTOCOLS">
                                                        SAFETY PROTOCOLS
                                                    </h2>
                                                    <p className="text-[10px] text-[#00ff41]/50 font-mono uppercase tracking-widest mt-1">
                                                        :: Control Systems Diagnostic ::
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Protocol List */}
                                            <ul className="space-y-3">
                                                {[
                                                    { title: "ALT-ENFORCE", desc: "Auto altitude climb. Safe limits only.", status: "ONLINE" },
                                                    { title: "GEO-FENCE", desc: "Flight area locked. Zone breach = blocked.", status: "ACTIVE" },
                                                    { title: "ANTI-COLLISION", desc: "Swarm separation + crash prevention.", status: "ONLINE" },
                                                    { title: "SIGNAL-LOSS", desc: "Auto-hover → RTB (Return to Base).", status: "STANDBY" },
                                                    { title: "MONITORING", desc: "Live telemetry + mission logging.", status: "ONLINE" }
                                                ].map((item, index) => (
                                                    <li key={index} className="group flex items-center gap-4 p-3 bg-black/40 border border-[#00ff41]/20 hover:border-[#00ff41]/50 transition-all rounded"
                                                        style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                                                        <div className="flex-shrink-0">
                                                            <ChevronRight className="w-4 h-4 text-[#00ff41] group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-white uppercase tracking-wide font-orbitron">{item.title}</span>
                                                                <span className={`text-[8px] px-2 py-0.5 rounded font-mono uppercase ${item.status === 'ONLINE' ? 'bg-[#00ff41]/20 text-[#00ff41]' :
                                                                    item.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400' :
                                                                        'bg-yellow-500/20 text-yellow-400'
                                                                    }`}>{item.status}</span>
                                                            </div>
                                                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">{item.desc}</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Footer Bar */}
                                        <div className="bg-black/50 px-6 py-3 border-t border-[#00ff41]/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
                                                <span className="text-[10px] font-mono text-zinc-500">ALL SYSTEMS NOMINAL</span>
                                            </div>
                                            <button
                                                onClick={() => setShowSafetyModal(false)}
                                                className="warfare-btn !py-2 !px-4 !text-[10px]"
                                            >
                                                CLOSE
                                            </button>
                                        </div>

                                        {/* Corner Decorations */}
                                        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-[#00ff41]/50" />
                                        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[#00ff41]/50" />
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[#00ff41]/50" />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#00ff41]/50" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- BOTTOM: MISSION CARDS - Fixed at bottom --- */}
                        <div className="flex-shrink-0 w-full px-2 md:px-6 pb-2 pt-2 mt-auto">
                            <div className="max-w-6xl mx-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                                    <MissionTierCard
                                        tier="spectator"
                                        title={<EditableText storageKey="spectator_title">Observer</EditableText>}
                                        description={<EditableText storageKey="spectator_desc">Watch the mission • Access live drone camera • Token locked after purchase • +3% reward payout • Early Access: First 200 get -20% discount</EditableText>}
                                        cardNumber=""
                                        onSuccess={(sig) => console.log('Spectator locked:', sig)}
                                    />
                                    <MissionTierCard
                                        tier="operator"
                                        title={<EditableText storageKey="operator_title">Mission</EditableText>}
                                        description={<EditableText storageKey="operator_desc">Take control of your drone live and fly it remotely in real time.</EditableText>}
                                        cardNumber=""
                                        onSuccess={(sig) => console.log('Operator locked:', sig)}
                                    />
                                    <MissionTierCard
                                        tier="elite"
                                        title={<EditableText storageKey="elite_title">Mission 1+2</EditableText>}
                                        description={<EditableText storageKey="elite_desc">Control your drone and secure your spot for the next mission.</EditableText>}
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
        </div >
    );
};

// Main component wrapped with VisualEditorProvider
const MissionObserverHero = () => {
    return (
        <VisualEditorProvider>
            <MissionObserverHeroInner />
        </VisualEditorProvider>
    );
};

export default MissionObserverHero;
