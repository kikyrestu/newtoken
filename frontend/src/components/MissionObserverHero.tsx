import { useState, useRef, useEffect } from 'react';
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
import { MobileCardCarousel } from './MobileCardCarousel';
import { MobileHeader } from './MobileHeader';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { Shield, X } from 'lucide-react';
import { VisualEditorProvider, VisualEditorControls, useVisualEditor } from './VisualEditorControls';
import { EditableText } from './EditableText';
import { TierDetailModal } from './TierDetailModal';
import { AboutModal } from './AboutModal';
import { type TierType } from '../hooks/useLockProgram';
import { useBlockchainConfig } from '../hooks/useBlockchainConfig';

// Token mint now fetched from backend via useBlockchainConfig hook

// Animated loading skeleton for video background
const VideoLoadingSkeleton = () => (
    <div className="absolute inset-0 bg-[#0a0c10] z-0">
        {/* Animated gradient background */}
        <div
            className="absolute inset-0 animate-pulse"
            style={{
                background: 'linear-gradient(135deg, #0a0c10 0%, #0d1117 25%, #0a0c10 50%, #0d1117 75%, #0a0c10 100%)',
                backgroundSize: '400% 400%',
                animation: 'gradientMove 3s ease infinite'
            }}
        />

        {/* Matrix-style loading effect */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute text-[#00ff41] font-mono text-xs animate-pulse"
                    style={{
                        left: `${(i * 5) % 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.1}s`,
                        opacity: Math.random() * 0.5 + 0.2
                    }}
                >
                    {['01', '10', '11', '00'][Math.floor(Math.random() * 4)]}
                </div>
            ))}
        </div>

        {/* Center loading indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
                <div className="relative">
                    {/* Outer ring */}
                    <div className="w-16 h-16 border-2 border-[#00ff41]/20 rounded-full animate-ping" />
                    {/* Inner ring */}
                    <div className="absolute inset-0 w-16 h-16 border-2 border-t-[#00ff41] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                </div>
                <p className="mt-4 text-[#00ff41]/60 text-sm font-mono animate-pulse">
                    INITIALIZING VIDEO FEED...
                </p>
            </div>
        </div>

        {/* Scanlines effect while loading */}
        <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
                backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%)',
                backgroundSize: '100% 4px'
            }}
        />
    </div>
);

// Inner component that uses the visual editor context
const MissionObserverHeroInner = () => {
    const { connected } = useWallet();
    const { nextUnlock, dashboard } = useUserDashboard();
    const { showRuler } = useVisualEditor();
    const { config: blockchainConfig } = useBlockchainConfig();

    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [activeTierModal, setActiveTierModal] = useState<TierType | null>(null); // New state for Tier Detail Modal
    const [isClosingModal, setIsClosingModal] = useState(false);

    // Video loading state
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Demo mode state (fallback if backend data missing)
    const [demoUnlockTimestamp, setDemoUnlockTimestamp] = useState<number | null>(null);

    // Preload video more aggressively
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, []);

    // Handle modal close with TV off animation
    const handleCloseModal = (modalType: 'safety' | 'instructions' | 'about') => {
        setIsClosingModal(true);
        setTimeout(() => {
            if (modalType === 'safety') setShowSafetyModal(false);
            if (modalType === 'instructions') setShowInstructionsModal(false);
            if (modalType === 'about') setShowAboutModal(false);
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

            {/* VIDEO LOADING SKELETON - Show while video is loading */}
            {!videoLoaded && !videoError && <VideoLoadingSkeleton />}

            {/* STATIC FALLBACK - Show if video fails to load */}
            {videoError && (
                <div
                    className="absolute inset-0 bg-gradient-to-b from-[#0a0c10] to-[#0a0a0c] opacity-90"
                />
            )}

            {/* VIDEO BACKGROUND */}
            <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                poster=""
                onCanPlayThrough={() => setVideoLoaded(true)}
                onLoadedData={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-90' : 'opacity-0'
                    }`}
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
                <div className="md:hidden relative z-[500]">
                    <MobileHeader
                        onSafetyClick={() => setShowSafetyModal(true)}
                        onInstructionsClick={() => setShowInstructionsModal(true)}
                        onAboutClick={() => {
                            setShowAboutModal(true);
                            setShowSafetyModal(false);
                            setShowInstructionsModal(false);
                        }}
                        onSwapClick={() => setShowSwapModal(true)}
                        onDashboardClick={() => setShowDashboard(!showDashboard)}
                        showDashboard={showDashboard}
                    />
                </div>

                {/* --- DESKTOP HEADER --- */}
                <header className="hidden md:flex flex-shrink-0 justify-between items-start pointer-events-auto min-h-[80px] relative z-[500]">
                    {/* Top Left Stats - Telemetry Widget */}
                    <div className="scale-90 origin-top-left lg:scale-100">
                        <TelemetryWidget
                            onSafetyClick={() => setShowSafetyModal(true)}
                            onInstructionsClick={() => setShowInstructionsModal(true)}
                        />
                    </div>

                    {/* Center Logo & Branding - FLY [drone] UA Layout */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 mt-2">
                        {/* FLY text with green glow */}
                        <img
                            src="/assets/fly-text.png"
                            alt="FLY"
                            className="h-10 lg:h-14 object-contain"
                            style={{
                                filter: 'drop-shadow(0 0 8px rgba(0,255,65,0.7)) drop-shadow(0 0 15px rgba(0,255,65,0.5)) brightness(0) invert(1)',
                            }}
                        />
                        {/* Drone Logo (bigger - increased 35% per Vanja) */}
                        <img
                            src="/logo.png"
                            alt="Drone"
                            className="w-28 h-28 lg:w-40 lg:h-40 object-contain drop-shadow-[0_0_15px_rgba(0,255,65,0.6)]"
                        />
                        {/* UA text with green glow */}
                        <img
                            src="/assets/ua-text.png"
                            alt="UA"
                            className="h-10 lg:h-14 object-contain"
                            style={{
                                filter: 'drop-shadow(0 0 8px rgba(0,255,65,0.7)) drop-shadow(0 0 15px rgba(0,255,65,0.5)) brightness(0) invert(1)',
                            }}
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
                            onClick={() => {
                                setShowAboutModal(true);
                                setShowSafetyModal(false);
                                setShowInstructionsModal(false);
                            }}
                            className={`text-white font-bold text-base hover:text-[#00ff41] transition-colors px-2 py-1 ${showAboutModal ? 'text-[#00ff41]' : ''}`}
                        >
                            About
                        </button>
                        <button
                            onClick={() => setShowSwapModal(true)}
                            className="text-white font-bold text-base hover:text-[#00ff41] transition-colors px-2 py-1"
                        >
                            Swap
                        </button>
                        {/* Wallet Button - Tactical Theme */}
                        <TacticalWalletButton />
                    </div>
                </header>

                {/* --- CENTER CONTENT (Timer & Cards - always render when not in dashboard) --- */}
                {!showDashboard && (
                    /* Timer & Mission Cards View */
                    <main className="flex-1 flex flex-col justify-start min-h-0 pointer-events-auto">

                        {/* CENTER DISPLAY AREA - Timer with Visual Editor */}
                        <div className={`absolute inset-0 flex items-center justify-center px-4 z-[600] ${showSafetyModal || showInstructionsModal || showAboutModal ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                            {!showSafetyModal && !showInstructionsModal && !showAboutModal ? (
                                <div className="flex flex-col items-center gap-2 pointer-events-auto">
                                    {/* Hero Text */}
                                    <h1 className="text-white text-2xl md:text-4xl font-bold tracking-wider uppercase text-center"
                                        style={{ textShadow: '0 0 20px rgba(0,255,65,0.3)' }}>
                                        Fly Unmanned Aircraft
                                    </h1>
                                    <p className="text-gray-400 text-sm md:text-base tracking-widest uppercase text-center">
                                        Control Layer for Remote Drone Operations
                                    </p>
                                    <p className="text-[#00ff41] text-xs md:text-sm font-bold tracking-[0.3em] uppercase mt-4">
                                        Mission Launch In
                                    </p>

                                    {/* Timer */}
                                    <TimerDevice
                                        unlockTimestamp={unlockTimestamp}
                                        className=""
                                    />

                                    {/* Tagline below timer */}
                                    <p className="text-gray-400 text-xs md:text-sm text-center mt-2 max-w-md tracking-wide">
                                        Limited access. Reserve your slot now and secure your mission role.
                                    </p>
                                </div>
                            ) : showAboutModal ? (
                                <AboutModal
                                    isOpen={showAboutModal}
                                    onClose={() => handleCloseModal('about')}
                                    isClosing={isClosingModal}
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
                                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors z-50 pointer-events-auto cursor-pointer"
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
                        <div className="hidden md:block flex-shrink-0 w-full px-2 md:px-6 pb-8 pt-2 mt-auto z-[20]">
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

            {/* USER DASHBOARD - Rendered at root level, positioned BELOW header */}
            {showDashboard && (
                <div className="fixed top-20 md:top-24 left-0 right-0 bottom-0 flex items-stretch z-[450] p-4 pointer-events-auto">
                    <div className="w-full max-w-4xl mx-auto h-full">
                        <UserDashboard />
                    </div>
                </div>
            )}

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
                outputMint={blockchainConfig.token_mint || ''}
                fixedOutput={true}
                onSuccess={(txid) => {
                    console.log('Swap successful:', txid);
                    setShowSwapModal(false);
                }}
            />

            {/* Mobile Card Carousel - Only on mobile, hidden when modals open */}
            <MobileCardCarousel
                onSuccess={handleLockSuccess}
                onCardClick={(tier) => setActiveTierModal(tier)}
                hideCarousel={showSafetyModal || showInstructionsModal || showSwapModal || showAboutModal || !!activeTierModal}
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
