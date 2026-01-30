import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { MissionTierCard } from './MissionTierCard';
import { CountdownTimer } from './CountdownTimer';
import { UserDashboard } from './UserDashboard';
import { JupiterSwapModal } from './JupiterSwap';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useTokenPrice } from '../hooks/useTokenPrice';

// Token mint address - update with your actual token
const TOKEN_MINT = import.meta.env.VITE_TOKEN_MINT || '11111111111111111111111111111111';

const MissionObserverHero = () => {
    const { connected } = useWallet();
    const { nextUnlock, hasActiveLocks } = useUserDashboard();
    const { pricing, loading: priceLoading } = useTokenPrice();

    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);

    // Use unlock timestamp if user has active locks, otherwise show fake timer
    const unlockTimestamp = nextUnlock?.unix_timestamp || undefined;

    return (
        <div className="relative h-screen w-full overflow-hidden bg-[#0a0c10] text-[#4fffa0] font-sans selection:bg-emerald-500/30">

            {/* VIDEO BACKGROUND - Fixed */}
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

            {/* Scanline Overlay - Fixed */}
            <div
                className="absolute inset-0 pointer-events-none z-[1]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                    backgroundSize: '100% 2px, 3px 100%'
                }}
            />

            {/* Gradient Overlay - Fixed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-[2]" />

            {/* --- MAIN CONTENT LAYER --- */}
            <div className="relative z-20 w-full h-full max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col justify-between">

                {/* --- TOP: HEADER & STATS --- */}
                <header className="flex-shrink-0 flex justify-between items-start">
                    {/* Top Left Stats - Cyber Tablet Style */}
                    <div className="relative group">
                        {/* Tablet Container */}
                        <div className="bg-[#0a0c10]/90 backdrop-blur-md border border-[#4fffa0]/30 rounded-lg p-3 md:p-4 shadow-[0_0_20px_rgba(79,255,160,0.1)] relative overflow-hidden min-w-[200px] md:min-w-[280px]">
                            {/* Decorative Tech Corners */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#4fffa0]" />
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#4fffa0]" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#4fffa0]" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#4fffa0]" />

                            {/* Scanline Effect */}
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(79,255,160,0.03)_3px)] pointer-events-none" />

                            <div className="relative z-10 flex flex-col gap-2">
                                {/* Header / Title */}
                                <div className="text-[10px] uppercase tracking-widest text-[#4fffa0]/50 border-b border-[#4fffa0]/10 pb-1 mb-1">
                                    System Status
                                </div>

                                {/* Stats Grid */}
                                <div className="space-y-1.5 md:space-y-2 font-mono text-xs md:text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Spectators</span>
                                        <span className="text-[#4fffa0] flex items-center gap-2">
                                            {pricing?.spectator?.tokens ? (
                                                <span className="w-1.5 h-1.5 bg-[#4fffa0] rounded-full animate-pulse shadow-[0_0_5px_#4fffa0]" />
                                            ) : (
                                                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                                            )}
                                            {pricing?.spectator?.tokens ? 'Active' : 'Offline'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Mission</span>
                                        <span className={hasActiveLocks ? "text-[#4fffa0]" : "text-gray-500"}>
                                            {hasActiveLocks ? '● Engaged' : '○ Standby'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-[#4fffa0]/10 pt-1 mt-1">
                                        <span className="text-gray-400">Token Price</span>
                                        <span className="text-[#4fffa0] font-bold tracking-wide">
                                            {priceLoading ? (
                                                <span className="animate-pulse">...</span>
                                            ) : (
                                                `$${pricing?.spectator?.token_price?.toFixed(6) || '0.000000'}`
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Right: Nav & Wallet */}
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-6 text-sm font-bold tracking-wider">
                            <a href="#" className="text-white hover:text-[#4fffa0] transition-colors relative group">
                                Swap
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4fffa0] transition-all group-hover:w-full" />
                            </a>
                            <a href="#" className="text-white hover:text-[#4fffa0] transition-colors relative group">
                                About
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4fffa0] transition-all group-hover:w-full" />
                            </a>
                        </nav>
                        <div className="relative z-50">
                            <WalletMultiButton className="!bg-[#051505] !border !border-[#4fffa0] !text-[#4fffa0] !font-bold !rounded-full !px-6 hover:!bg-[#4fffa0] hover:!text-black transition-all duration-300 shadow-[0_0_15px_rgba(79,255,160,0.3)]" />
                        </div>
                    </div>
                </header>

                {/* --- CENTER: TIMER (Flex Grow to Center) --- */}
                <div className="flex-grow flex items-center justify-center relative py-4">
                    <div className="relative w-full max-w-lg md:max-w-xl lg:max-w-3xl flex justify-center items-center">
                        {/* Night Vision Background - Behind Frame */}
                        <div className="absolute inset-0 flex items-center justify-center pt-2 z-0">
                            <div className="w-[54%] h-[24%] bg-[#051505]/60 border border-[#4fffa0]/10 rounded-md shadow-[inset_0_0_15px_rgba(79,255,160,0.1)]">
                                {/* Screen Scanlines inside background */}
                                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(79,255,160,0.05)_3px)] pointer-events-none rounded" />
                            </div>
                        </div>
                        ) : (
                        /* --- MAIN CONTENT LAYER --- */
                        <div className="relative z-20 w-full h-full max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col justify-between">

                            {/* --- TOP: HEADER & STATS --- */}
                            <header className="flex-shrink-0 flex justify-between items-start">
                                {/* Top Left Stats - Cyber Tablet Style */}
                                <div className="relative group">
                                    {/* Tablet Container */}
                                    <div className="bg-[#0a0c10]/90 backdrop-blur-md border border-[#4fffa0]/30 rounded-lg p-3 md:p-4 shadow-[0_0_20px_rgba(79,255,160,0.1)] relative overflow-hidden min-w-[200px] md:min-w-[280px]">
                                        {/* Decorative Tech Corners */}
                                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#4fffa0]" />
                                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#4fffa0]" />
                                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#4fffa0]" />
                                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#4fffa0]" />

                                        {/* Scanline Effect */}
                                        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(79,255,160,0.03)_3px)] pointer-events-none" />

                                        <div className="relative z-10 flex flex-col gap-2">
                                            {/* Header / Title */}
                                            <div className="text-[10px] uppercase tracking-widest text-[#4fffa0]/50 border-b border-[#4fffa0]/10 pb-1 mb-1">
                                                System Status
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="space-y-1.5 md:space-y-2 font-mono text-xs md:text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Spectators</span>
                                                    <span className="text-[#4fffa0] flex items-center gap-2">
                                                        {pricing?.spectator?.tokens ? (
                                                            <span className="w-1.5 h-1.5 bg-[#4fffa0] rounded-full animate-pulse shadow-[0_0_5px_#4fffa0]" />
                                                        ) : (
                                                            <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                                                        )}
                                                        {pricing?.spectator?.tokens ? 'Active' : 'Offline'}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Mission</span>
                                                    <span className={hasActiveLocks ? "text-[#4fffa0]" : "text-gray-500"}>
                                                        {hasActiveLocks ? '● Engaged' : '○ Standby'}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center border-t border-[#4fffa0]/10 pt-1 mt-1">
                                                    <span className="text-gray-400">Token Price</span>
                                                    <span className="text-[#4fffa0] font-bold tracking-wide">
                                                        {priceLoading ? (
                                                            <span className="animate-pulse">...</span>
                                                        ) : (
                                                            `$${pricing?.spectator?.token_price?.toFixed(6) || '0.000000'}`
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Right: Nav & Wallet */}
                                <div className="flex items-center gap-6">
                                    <nav className="hidden md:flex items-center gap-6 text-sm font-bold tracking-wider">
                                        <a href="#" className="text-white hover:text-[#4fffa0] transition-colors relative group">
                                            Swap
                                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4fffa0] transition-all group-hover:w-full" />
                                        </a>
                                        <a href="#" className="text-white hover:text-[#4fffa0] transition-colors relative group">
                                            About
                                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4fffa0] transition-all group-hover:w-full" />
                                        </a>
                                    </nav>
                                    <div className="relative z-50">
                                        <WalletMultiButton className="!bg-[#051505] !border !border-[#4fffa0] !text-[#4fffa0] !font-bold !rounded-full !px-6 hover:!bg-[#4fffa0] hover:!text-black transition-all duration-300 shadow-[0_0_15px_rgba(79,255,160,0.3)]" />
                                    </div>
                                </div>
                            </header>

                            {/* --- CENTER: TIMER (Flex Grow to Center) --- */}
                            <div className="flex-grow flex items-center justify-center relative py-4">
                                <div className="relative w-full max-w-lg md:max-w-xl lg:max-w-3xl flex justify-center items-center">
                                    {/* Night Vision Background - Behind Frame */}
                                    <div className="absolute inset-0 flex items-center justify-center pt-2 z-0">
                                        <div className="w-[54%] h-[24%] bg-[#051505]/60 border border-[#4fffa0]/10 rounded-md shadow-[inset_0_0_15px_rgba(79,255,160,0.1)]">
                                            {/* Screen Scanlines inside background */}
                                            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(79,255,160,0.05)_3px)] pointer-events-none rounded" />
                                        </div>
                                    </div>

                                    {/* Timer Frame Image - Middle Layer */}
                                    <img
                                        src="/time-countdown.png"
                                        alt="Timer Frame"
                                        className="relative z-10 w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                                    />

                                    {/* Digital Numbers - Top Layer */}
                                    <div className="absolute inset-0 flex items-center justify-center pt-2 z-20">
                                        <div className="w-[54%] h-[24%] relative flex items-center justify-center">
                                            <div className="w-full flex justify-center mt-4">
                                                <CountdownTimer
                                                    unlockTimestamp={unlockTimestamp}
                                                    size="md"
                                                    showLabels={false}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- BOTTOM: MISSION CARDS (Fixed Height) --- */}
                            <div className="flex-shrink-0 w-full grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
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
                    </div>
                    );
};

                    export default MissionObserverHero;
