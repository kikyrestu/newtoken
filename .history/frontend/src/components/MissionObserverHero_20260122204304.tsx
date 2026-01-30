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
        <div className="relative min-h-screen w-full bg-[#0a0c10] text-[#4fffa0] font-sans selection:bg-emerald-500/30 overflow-x-hidden overflow-y-auto">

            {/* VIDEO BACKGROUND - Fixed */}
            <video
                autoPlay
                loop
                muted
                playsInline
                poster="/bg-drone.png"
                className="fixed inset-0 w-full h-full object-cover opacity-90 z-0"
            >
                <source src="/bg-drone-bagus.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Scanline Overlay - Fixed */}
            <div
                className="fixed inset-0 pointer-events-none z-[1]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                    backgroundSize: '100% 2px, 3px 100%'
                }}
            />

            {/* Gradient Overlay - Fixed */}
            <div className="fixed inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-[2]" />

            {/* --- MAIN CONTENT WRAPPER --- */}
            <div className="relative z-10 min-h-screen flex flex-col">

                {/* --- TOP NAV BAR --- */}
                <header className="sticky top-0 z-20 p-4 md:p-6 flex justify-between items-start backdrop-blur-sm bg-black/20">
                    {/* Top Left Stats */}
                    <div className="flex flex-col gap-1 text-xs md:text-sm font-bold tracking-wide drop-shadow-md">
                        <div className="text-[#4fffa0]">
                            Spectators: {pricing?.spectator?.tokens ? '●' : '○'} Active
                        </div>
                        <div className="text-[#4fffa0]">
                            on Mission: {hasActiveLocks ? '● Active' : '○ None'}
                        </div>
                        <div className="text-[#4fffa0]">
                            Token Price: {priceLoading ? '...' : `$${pricing?.spectator?.token_price?.toFixed(6) || 'N/A'}`}
                        </div>

                        {/* Floating Number */}
                        <div className="mt-4 text-3xl md:text-5xl text-white/30 font-serif">5</div>
                    </div>

                    {/* Top Right Controls */}
                    <div className="flex items-center gap-2 md:gap-4">
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
                    <main className="flex-1 flex items-start justify-center py-4 md:py-8 px-4 overflow-auto">
                        <div className="w-full max-w-4xl">
                            <UserDashboard />
                        </div>
                    </main>
                ) : (
                    /* Timer & Mission Cards View */
                    <main className="flex-1 flex flex-col">
                        {/* CENTER: TIMER */}
                        <div className="flex-shrink-0 flex items-center justify-center py-4 md:py-8 px-4">
                            <div className="relative w-full max-w-2xl md:max-w-4xl flex justify-center items-center">
                                {/* Timer Frame Image */}
                                <img
                                    src="/time-countdown.png"
                                    alt="Timer Frame"
                                    className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                                />

                                {/* Digital Screen Area */}
                                <div className="absolute inset-0 flex items-center justify-center pt-2">
                                    <div className="w-[62%] h-[40%] bg-[#081008] rounded-md shadow-[inset_0_0_20px_rgba(0,0,0,1)] border border-[#4fffa0]/20 relative overflow-hidden flex items-center justify-center">
                                        {/* Screen Scanlines */}
                                        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,0,0.05)_3px)] pointer-events-none z-0" />

                                        {/* Countdown Timer Component */}
                                        <div className="relative z-10">
                                            <CountdownTimer
                                                unlockTimestamp={unlockTimestamp}
                                                size="lg"
                                                showLabels={false}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- BOTTOM: MISSION CARDS --- */}
                        <div className="flex-shrink-0 w-full px-4 md:px-8 pb-6 md:pb-10">
                            <div className="max-w-7xl mx-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    <MissionTierCard
                                        tier="spectator"
                                        title="Watch the mission"
                                        description="Watch the mission unfold live and choose from all active drones in real time"
                                        cardNumber="2"
                                        onSuccess={(sig) => console.log('Spectator locked:', sig)}
                                    />
                                    <MissionTierCard
                                        tier="operator"
                                        title="Mission"
                                        description="Take control of your drone live and fly it remotely in real time."
                                        cardNumber="3"
                                        onSuccess={(sig) => console.log('Operator locked:', sig)}
                                    />
                                    <MissionTierCard
                                        tier="elite"
                                        title="Mission 1+2"
                                        description="Control your drone and secure your spot for the next mission."
                                        cardNumber="4"
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
