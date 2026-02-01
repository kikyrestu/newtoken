import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TacticalWalletButton } from './TacticalWalletButton';
import { MissionTierCard } from './MissionTierCard';
import { UserDashboard } from './UserDashboard';
import { JupiterSwapModal } from './JupiterSwap';
import { HUDOverlay } from './HUDOverlay';
import { TelemetryWidget } from './TelemetryWidget';
import { DebugRuler } from './DebugRuler';
import TimerDevice from './TimerDevice';
import { InstructionsModal } from './InstructionsModal';
import { WelcomeGuide } from './WelcomeGuide';
import { MobileCardCarousel } from './MobileCardCarousel';
import { MobileHeader } from './MobileHeader';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { Shield, X } from 'lucide-react';
import { VisualEditorProvider, VisualEditorControls, useVisualEditor } from './VisualEditorControls';
import { EditableText } from './EditableText';
import { TierDetailModal } from './TierDetailModal';
import { useLockProgram, type TierType } from '../hooks/useLockProgram';

// Token mint address - update with your actual token
const TOKEN_MINT = import.meta.env.VITE_TOKEN_MINT || '11111111111111111111111111111111';

// Inner component that uses the visual editor context
const MissionObserverHeroInner = () => {
    const { connected } = useWallet();
    const { nextUnlock, dashboard } = useUserDashboard();
    const { showRuler } = useVisualEditor();

    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [activeTierModal, setActiveTierModal] = useState<TierType | null>(null); // New state for Tier Detail Modal
    const [isClosingModal, setIsClosingModal] = useState(false);

    // Handle modal close with TV off animation
    const handleCloseModal = (modalType: 'safety' | 'instructions') => {
        setIsClosingModal(true);
        setTimeout(() => {
            if (modalType === 'safety') setShowSafetyModal(false);
            if (modalType === 'instructions') setShowInstructionsModal(false);
            setIsClosingModal(false);
        }, 400); // Match animation duration
    };

    // Handle lock success - update local timer for demo mode
    const handleLockSuccess = (tier: string, signature: string) => {
        console.log(`🔐 ${tier} locked:`, signature);
        // Set demo unlock timestamp to 30 days from now (in seconds)
        const unlockTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        setDemoUnlockTimestamp(unlockTime);
        console.log('⏰ Timer set to:', new Date(unlockTime * 1000).toISOString());
    };

    // Use unlock timestamp: prefer backend data, fallback to demo mode local state
    const unlockTimestamp = nextUnlock?.unix_timestamp || demoUnlockTimestamp || undefined;

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

                {/* --- MOBILE HEADER (Split 2-row design) --- */}
                <div className="md:hidden">
                    <MobileHeader
                        onSafetyClick={() => setShowSafetyModal(true)}
                        onInstructionsClick={() => setShowInstructionsModal(true)}
                        onSwapClick={() => setShowSwapModal(true)}
                        onDashboardClick={() => setShowDashboard(!showDashboard)}
                        showDashboard={showDashboard}
                    />
                </div>

                {/* --- DESKTOP HEADER --- */}
                <header className="hidden md:flex flex-shrink-0 justify-between items-start pointer-events-auto min-h-[80px]">
                    {/* Top Left Stats - Telemetry Widget */}
                    <div className="scale-90 origin-top-left lg:scale-100">
                        <TelemetryWidget
                            onSafetyClick={() => setShowSafetyModal(true)}
                            onInstructionsClick={() => setShowInstructionsModal(true)}
                        />
                    </div>

                    {/* Top Right Buttons */}
                    <div className="flex items-center gap-4">
                        {/* Dashboard Toggle (only when connected) */}
                        {connected && (
                            <button
                                onClick={() => setShowDashboard(!showDashboard)}
                                className={`text-white font-bold text-base hover:text-[#00ff41] transition-colors px-2 py-1 ${showDashboard ? 'text-[#00ff41]' : ''}`}
                            >
                                {showDashboard ? '← Back' : 'Dashboard'}
                            </button>
                        )}
                        <button
                            onClick={() => setShowSwapModal(true)}
                            className="text-white font-bold text-base hover:text-[#00ff41] transition-colors px-2 py-1"
                        >
                            Swap
                        </button>
                        <button className="text-white font-bold text-base hover:text-[#00ff41] transition-colors px-2 py-1">
                            About
                        </button>

                        {/* Wallet Button - Tactical Theme */}
                        <TacticalWalletButton />
                    </div>
                </header>

                {/* --- CENTER CONTENT --- */}
                {showDashboard ? (
                    /* User Dashboard View - starts from top, scrollable */
                    <main className="flex-1 overflow-y-auto pointer-events-auto pt-2 pb-8">
                        <div className="w-full max-w-4xl mx-auto px-4">
                            <UserDashboard />
                        </div>
                    </main>
                ) : (
                    /* Timer & Mission Cards View */
                    <main className="flex-1 flex flex-col justify-start min-h-0 pointer-events-auto">

                        {/* CENTER DISPLAY AREA - Timer with Visual Editor */}
                        <div className="absolute inset-0 flex items-center justify-center px-4 pointer-events-none z-[5]">
                            {!showSafetyModal && !showInstructionsModal ? (
                                <TimerDevice
                                    unlockTimestamp={unlockTimestamp}
                                    className="pointer-events-auto"
                                />
                            ) : showInstructionsModal ? (
                                <InstructionsModal
                                    isOpen={showInstructionsModal}
                                    onClose={() => handleCloseModal('instructions')}
                                    isClosing={isClosingModal}
                                />
                            ) : (
                                <div className="w-full max-w-xl pointer-events-auto">
                                    {/* Styled Safety Modal */}
                                    <div
                                        className={`relative bg-[#0a0c10]/95 border border-[#4fffa0]/60 p-6 rounded-lg 
                                            overflow-hidden backdrop-blur-md shadow-[0_0_40px_rgba(79,255,160,0.3)]
                                            ${isClosingModal ? 'animate-tv-off' : 'animate-tv-on'}`}
                                        style={{ transformOrigin: 'center center' }}
                                    >
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[3px] bg-[#4fffa0] shadow-[0_0_15px_#4fffa0] rounded-full" />
                                        <button
                                            onClick={() => handleCloseModal('safety')}
                                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors z-10"
                                        >
                                            <X size={20} />
                                        </button>
                                        <div className="flex items-center gap-3 mb-6">
                                            <Shield className="w-6 h-6 text-[#4fffa0]" />
                                            <h2 className="text-lg font-bold text-white">
                                                Safety <span className="text-[#4fffa0]">and Control Systems</span>
                                            </h2>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { title: "Altitude Enforcement", desc: "Drone automatically climbs to its assigned altitude. Height adjustments allowed only within safe limits." },
                                                { title: "Geo-Fence Active", desc: "Flight area strictly defined — operation outside the zone is blocked." },
                                                { title: "Anti-Collision / Swarm Separation", desc: "Active system prevents contact with other drones or obstacles + crash prevention.", badge: "Active" },
                                                { title: "Signal Loss Response", desc: "Auto-hover, stabilization, RTB (Return to Base)." },
                                                { title: "Continuous Monitoring", desc: "Live telemetry + full mission logging for audit/replay." },
                                                { title: "Certified Operator Oversight", desc: "All missions supervised by trained operators." }
                                            ].map((item, index) => (
                                                <div key={index} className="flex items-start gap-3">
                                                    <span className="inline-block w-2 h-2 bg-[#4fffa0] rounded-full mt-2 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-white">{item.title}</span>
                                                            {item.badge && <span className="text-[10px] px-2 py-0.5 rounded bg-[#4fffa0]/20 text-[#4fffa0] font-medium">{item.badge}</span>}
                                                        </div>
                                                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- BOTTOM: MISSION CARDS --- */}
                        <div className="hidden md:block flex-shrink-0 w-full px-2 md:px-6 pb-2 pt-2 mt-auto z-[20]">
                            <div className="max-w-6xl mx-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 items-start">
                                    {(() => {
                                        const spectatorLock = dashboard?.active_locks?.find(l => l.tier === 'spectator');
                                        const operatorLock = dashboard?.active_locks?.find(l => l.tier === 'operator');
                                        const eliteLock = dashboard?.active_locks?.find(l => l.tier === 'elite');

                                        return (
                                            <>
                                                {/* Card 1: Spectator */}
                                                <div className="flex flex-col gap-2">
                                                    <MissionTierCard
                                                        tier="spectator"
                                                        title={<EditableText storageKey="spectator_title">Observer $25</EditableText>}
                                                        isLocked={!!spectatorLock}
                                                        lockedSignature={spectatorLock?.signature}
                                                        onClick={() => setActiveTierModal('spectator')}
                                                    />
                                                    <div className="text-center space-y-1">
                                                        <p className="text-xs text-gray-400">See the Mission Unfold</p>
                                                        <p className="text-[10px] text-[#00ff41]">() Early participants get up to 20% discount</p>
                                                    </div>
                                                </div>

                                                {/* Card 2: Operator */}
                                                <div className="flex flex-col gap-2">
                                                    <MissionTierCard
                                                        tier="operator"
                                                        title={<EditableText storageKey="operator_title">Recon Drone Operator $150</EditableText>}
                                                        isLocked={!!operatorLock}
                                                        lockedSignature={operatorLock?.signature}
                                                        onClick={() => setActiveTierModal('operator')}
                                                    />
                                                    <div className="text-center space-y-1">
                                                        <p className="text-xs text-gray-400">Seek. Identify. Mark.</p>
                                                        <p className="text-[10px] text-[#00ff41]">() Early participants get up to 20% discount</p>
                                                    </div>
                                                </div>

                                                {/* Card 3: Elite */}
                                                <div className="flex flex-col gap-2">
                                                    <MissionTierCard
                                                        tier="elite"
                                                        title={<EditableText storageKey="elite_title">Advanced Drone Operator $250</EditableText>}
                                                        isLocked={!!eliteLock}
                                                        lockedSignature={eliteLock?.signature}
                                                        onClick={() => setActiveTierModal('elite')}
                                                    />
                                                    <div className="text-center space-y-1">
                                                        <p className="text-xs text-gray-400">Seek. Identify. Execute.</p>
                                                        <p className="text-[10px] text-[#00ff41]">() Early participants get up to 20% discount</p>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </main>
                )}

            </div>

            {/* MODALS */}

            {/* Tier Detail Modal */}
            {activeTierModal && (
                <TierDetailModal
                    tier={activeTierModal}
                    isOpen={!!activeTierModal}
                    onClose={() => setActiveTierModal(null)}
                    onSuccess={(sig) => {
                        handleLockSuccess(activeTierModal, sig);
                        // Optionally close modal after success? User didn't specify, but usually good ux to let them see success screen inside modal first
                    }}
                />
            )}

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

            {/* Mobile Card Carousel - Only on mobile */}
            <MobileCardCarousel onSuccess={handleLockSuccess} />
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
