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

            {/* Content Overlay */}
            <div className="absolute inset-0 z-10 p-2 md:p-4 flex flex-col h-full pointer-events-none">

                {/* --- TOP NAV BAR --- */}
                <header className="flex-shrink-0 flex justify-between items-start pointer-events-auto min-h-[60px] md:min-h-[80px]">
                    {/* Top Left Stats - TABLET STYLE */}
                    <div className="relative group scale-75 origin-top-left md:scale-90 lg:scale-100">
                        {/* Tablet Frame */}
                        <div className="absolute inset-0 bg-[#051505]/90 border border-[#4fffa0]/30 rounded-lg shadow-[0_0_20px_rgba(79,255,160,0.1)] backdrop-blur-sm clip-path-tablet" />

                        {/* Tablet Content */}
                        <div className="relative px-5 py-3 flex flex-col gap-2 min-w-[200px]">
                            {/* Decorative Header Line */}
                            <div className="flex items-center gap-2 mb-1 border-b border-[#4fffa0]/20 pb-1">
                                <div className="w-2 h-2 rounded-full bg-[#4fffa0] animate-pulse" />
                                <span className="text-[10px] uppercase font-bold text-[#4fffa0]/70 tracking-widest">SYSTEM STATUS</span>
                            </div>

                            <div className="flex flex-col gap-1.5 text-xs font-mono">
                                <div className="flex justify-between items-center text-[#4fffa0]">
                                    <span className="opacity-70">Spectators:</span>
                                    <span className="font-bold flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${pricing?.spectator?.tokens ? 'bg-[#4fffa0]' : 'bg-gray-500'}`} />
                                        {pricing?.spectator?.tokens ? 'Active' : 'Offline'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[#4fffa0]">
                                    <span className="opacity-70">Mission:</span>
                                    <span className="font-bold flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${hasActiveLocks ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                                        {hasActiveLocks ? 'Active' : 'None'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[#4fffa0]">
                                    <span className="opacity-70">Token Price:</span>
                                    <span className="font-bold">
                                        {priceLoading ? '...' : `$${pricing?.spectator?.token_price?.toFixed(6) || '0.00'}`}
                                    </span>
                                </div>
                            </div>

                            {/* Decorative Corner */}
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#4fffa0]/50 rounded-tr" />
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#4fffa0]/50 rounded-bl" />
                        </div>
                    </div>

                    {/* Top Right Buttons */}
                    <div className="flex items-center gap-4">
                        {/* Dashboard Toggle (only when connected) */}
                        {connected && (
                            <button
                                onClick={() => setShowDashboard(!showDashboard)}
                                className={`text-white font-bold text-xs md:text-base hover:text-[#4fffa0] transition-colors px-2 py-1 ${showDashboard ? 'text-[#4fffa0]' : ''}`}
                            >
                                {showDashboard ? '← Back' : 'Dashboard'}
                            </button>
                        )}
                        <button
                            onClick={() => setShowSwapModal(true)}
                            className="text-white font-bold text-xs md:text-base hover:text-[#4fffa0] transition-colors px-2 py-1"
                        >
                            Swap
                        </button>
                        <button className="hidden md:block text-white font-bold text-base hover:text-[#4fffa0] transition-colors px-2 py-1">
                            About
                        </button>

                        {/* Wallet Button */}
                        <WalletMultiButton className="!px-3 md:!px-6 !py-1.5 md:!py-2 !bg-[#050505]/80 !border-2 !border-[#4fffa0] !rounded-full !text-[#4fffa0] !font-bold !text-xs md:!text-sm !tracking-wide hover:!bg-[#4fffa0] hover:!text-black !transition-all !shadow-[0_0_20px_rgba(79,255,160,0.3)]" />
                    </div>
                </header>

                {/* --- CENTER CONTENT --- */}
                {showDashboard ? (
                    /* User Dashboard View */
                    <main className="flex-1 flex items-center justify-center overflow-auto">
                        <div className="w-full max-w-4xl">
                            <UserDashboard />
                        </div>
                    </main>
                ) : (
                    /* Timer & Mission Cards View */
                    <main className="flex-1 flex flex-col justify-center gap-2 md:gap-4">
                        {/* CENTER: TIMER */}
                        <div className="flex-shrink-0 flex items-center justify-center px-4">
                            <div className="relative w-full max-w-lg md:max-w-2xl lg:max-w-3xl flex justify-center items-center">
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
