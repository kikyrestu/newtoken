import { useState } from 'react';
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
import { WelcomeGuide, useWelcomeGuide } from './WelcomeGuide';
import { MobileCardSlider } from './MobileCardSlider';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { Shield, X } from 'lucide-react';
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
    const { nextUnlock, dashboard } = useUserDashboard();
    const { showRuler } = useVisualEditor();

    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [isClosingModal, setIsClosingModal] = useState(false);
    // Demo mode: store local unlock timestamp when user completes a lock
    const [demoUnlockTimestamp, setDemoUnlockTimestamp] = useState<number | null>(null);

    // Welcome guide for non-wallet users
    const { showGuide, closeGuide } = useWelcomeGuide(connected);
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

                {/* --- TOP NAV BAR - Mobile Responsive --- */}
                <header className="flex-shrink-0 flex justify-between items-center pointer-events-auto min-h-[50px] md:min-h-[80px] px-1 md:px-0">
                    {/* Top Left Stats - Telemetry Widget */}
                    <div className="scale-[0.6] origin-top-left md:scale-90 lg:scale-100 -ml-2 md:ml-0">
                        <TelemetryWidget
                            onSafetyClick={() => setShowSafetyModal(true)}
                            onInstructionsClick={() => setShowInstructionsModal(true)}
                        />
                    </div>

                    {/* Top Right Buttons - Compact on Mobile */}
                    <div className="flex items-center gap-1 md:gap-4">
                        {/* Dashboard Toggle (only when connected) */}
                        {connected && (
                            <button
                                onClick={() => setShowDashboard(!showDashboard)}
                                className={`text-white font-bold text-[10px] md:text-base hover:text-[#00ff41] transition-colors px-1.5 py-1 ${showDashboard ? 'text-[#00ff41]' : ''}`}
                            >
                                {showDashboard ? '←' : 'Dash'}
                            </button>
                        )}
                        <button
                            onClick={() => setShowSwapModal(true)}
                            className="text-white font-bold text-[10px] md:text-base hover:text-[#00ff41] transition-colors px-1.5 py-1"
                        >
                            Swap
                        </button>
                        <button
                            onClick={() => setShowInstructionsModal(true)}
                            className="hidden md:block text-white font-bold text-base hover:text-[#00ff41] transition-colors px-2 py-1"
                        >
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
                                    {/* Styled Modal with TV Animation */}
                                    <div
                                        className={`relative bg-[#0a0c10]/95 border border-[#4fffa0]/60 p-6 rounded-lg 
                                            overflow-hidden backdrop-blur-md shadow-[0_0_40px_rgba(79,255,160,0.3)]
                                            ${isClosingModal ? 'animate-tv-off' : 'animate-tv-on'}`}
                                        style={{ transformOrigin: 'center center' }}
                                    >
                                        {/* ... modal content (unchanged) ... */}
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
                                        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-[#4fffa0]/50" />
                                        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[#4fffa0]/50" />
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[#4fffa0]/50" />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#4fffa0]/50" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- BOTTOM: MISSION CARDS - Fixed at bottom --- */}
                        <div className="flex-shrink-0 w-full px-2 md:px-6 pb-2 pt-2 mt-auto">
                            <div className="max-w-6xl mx-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                                    {(() => {
                                        const spectatorLock = dashboard?.active_locks?.find(l => l.tier === 'spectator');
                                        const operatorLock = dashboard?.active_locks?.find(l => l.tier === 'operator');
                                        const eliteLock = dashboard?.active_locks?.find(l => l.tier === 'elite');

                                        return (
                                            <>
                                                <MissionTierCard
                                                    tier="spectator"
                                                    title={<EditableText storageKey="spectator_title">Observer</EditableText>}
                                                    description={<EditableText storageKey="spectator_desc">Watch the mission • Access live drone camera • Token locked after purchase • +3% reward payout • Early Access: First 200 get -20% discount</EditableText>}
                                                    cardNumber=""
                                                    onSuccess={(sig) => handleLockSuccess('Spectator', sig)}
                                                    isLocked={!!spectatorLock}
                                                    lockedSignature={spectatorLock?.signature || spectatorLock?.solscan_url?.split('/').pop()}
                                                />
                                                <MissionTierCard
                                                    tier="operator"
                                                    title={<EditableText storageKey="operator_title">Mission</EditableText>}
                                                    description={<EditableText storageKey="operator_desc">Take control of your drone live and fly it remotely in real time.</EditableText>}
                                                    cardNumber=""
                                                    onSuccess={(sig) => handleLockSuccess('Operator', sig)}
                                                    isLocked={!!operatorLock}
                                                    lockedSignature={operatorLock?.signature || operatorLock?.solscan_url?.split('/').pop()}
                                                />
                                                <MissionTierCard
                                                    tier="elite"
                                                    title={<EditableText storageKey="elite_title">Mission 1+2</EditableText>}
                                                    description={<EditableText storageKey="elite_desc">Control your drone and secure your spot for the next mission.</EditableText>}
                                                    cardNumber=""
                                                    onSuccess={(sig) => handleLockSuccess('Elite', sig)}
                                                    isLocked={!!eliteLock}
                                                    lockedSignature={eliteLock?.signature || eliteLock?.solscan_url?.split('/').pop()}
                                                />
                                            </>
                                        );
                                    })()}
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
