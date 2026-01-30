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

                        {/* Wallet Button - Matching Theme */}
                        <WalletMultiButton className="!px-4 md:!px-6 !py-2 !bg-transparent !border !border-[#4fffa0] !text-[#4fffa0] !font-bold !text-xs md:!text-sm !uppercase hover:!bg-[#4fffa0] hover:!text-black !transition-all !duration-300 !rounded-md" />
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
                                <div className="w-full max-w-lg transition-all duration-300 pointer-events-auto relative">
                                    {/* Tablet Frame Container */}
                                    <div className="relative">
                                        {/* Tablet Frame Image */}
                                        <img
                                            src="/tablet.png"
                                            alt="Tablet Frame"
                                            className="w-full h-auto"
                                        />

                                        {/* Content Area - positioned inside the tablet screen */}
                                        <div className="absolute inset-0 flex flex-col" style={{ padding: '8% 10% 12% 10%' }}>
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="w-5 h-5 text-orange-400" />
                                                    <h2 className="text-base font-bold text-white uppercase tracking-wider">
                                                        SAFETY PROTOCOLS
                                                    </h2>
                                                </div>
                                                <button
                                                    onClick={() => setShowSafetyModal(false)}
                                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            {/* Content - Simple Text List */}
                                            <div className="flex-1 overflow-y-auto space-y-2">
                                                {[
                                                    { title: "ALT-ENFORCE", desc: "Auto altitude climb. Safe limits only." },
                                                    { title: "GEO-FENCE", desc: "Flight area locked. Zone breach = blocked." },
                                                    { title: "ANTI-COLLISION", desc: "Swarm separation + crash prevention." },
                                                    { title: "SIGNAL-LOSS", desc: "Auto-hover → RTB (Return to Base)." },
                                                    { title: "MONITORING", desc: "Live telemetry + mission logging." }
                                                ].map((item, index) => (
                                                    <div key={index} className="flex items-start gap-2">
                                                        <ChevronRight className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <span className="text-sm font-bold text-white">{item.title}</span>
                                                            <span className="text-xs text-gray-400 ml-2">— {item.desc}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
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
