import { useState, useEffect } from 'react';

const MissionObserverHero = () => {
    const [time, setTime] = useState("00:00:00:00");

    // Timer Clock (Fake Time to match image vibe)
    useEffect(() => {
        const interval = setInterval(() => {
            const ms = String(Math.floor(Math.random() * 99)).padStart(2, '0');
            setTime(`00:00:00:${ms}`);
        }, 40);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-[#0a0c10] text-[#4fffa0] font-sans selection:bg-emerald-500/30">

            {/* VIDEO BACKGROUND */}
            <video
                autoPlay
                loop
                muted
                playsInline
                poster="/bg-drone.png"
                className="w-full h-full object-cover opacity-90" // Slight opacity to blend with black
            >
                <source src="/bg-drone-bagus.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Scanline Overlay (Hides pixelation + Sci-Fi Vibe) */}
            <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                    backgroundSize: '100% 2px, 3px 100%'
                }}
            />

            {/* Subtle Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            {/* --- UI OVERLAY (REFERENCE REPLICA) --- */}
            <div className="absolute inset-0 z-10 pointer-events-none p-8 flex flex-col justify-between font-sans">

                {/* --- TOP ROW --- */}
                <div className="flex justify-between items-start pointer-events-auto">
                    {/* Top Left Stats (Clean Text) */}
                    <div className="flex flex-col gap-1 text-sm font-bold tracking-wide drop-shadow-md">
                        <div className="text-[#4fffa0]">Spectators: 48</div>
                        <div className="text-[#4fffa0]">on Mission: 112 / 1000</div>
                        <div className="text-[#4fffa0]">Total Locked: 45.928.201</div>

                        {/* Floating '5' */}
                        <div className="mt-6 text-5xl text-white/30 font-serif">5</div>
                    </div>

                    {/* Top Right Controls */}
                    <div className="flex items-center gap-6">
                        <button className="text-white font-bold text-lg hover:text-[#4fffa0] transition-colors">
                            About
                        </button>

                        {/* Connect Wallet (Rounded Hexagon Style) */}
                        <button className="px-8 py-2 bg-[#050505]/80 border-2 border-[#4fffa0] rounded-full text-[#4fffa0] font-bold tracking-wide hover:bg-[#4fffa0] hover:text-black transition-all shadow-[0_0_20px_rgba(79,255,160,0.3)]">
                            Connect Wallet
                        </button>

                        {/* Floating '1' */}
                        <div className="absolute top-24 right-10 text-5xl text-white/30 font-serif">1</div>
                    </div>
                </div>

                {/* --- CENTER: TIMER CASING (IMAGE BASED) --- */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl flex justify-center items-center pointer-events-none">
                    <div className="relative w-full flex justify-center items-center">
                        {/* The Casing Image */}
                        <img
                            src="/time-countdown.png"
                            alt="Timer Frame"
                            className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                        />

                        {/* The Digital Screen Area */}
                        <div className="absolute inset-0 flex items-center justify-center pt-2">
                            <div className="w-[62%] h-[40%] bg-[#081008] rounded-md shadow-[inset_0_0_20px_rgba(0,0,0,1)] border border-[#4fffa0]/20 relative overflow-hidden flex items-center justify-center">
                                {/* Screen Scanlines */}
                                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,0,0.05)_3px)] pointer-events-none z-0" />
                                {/* Screen Glow */}
                                <div className="absolute inset-0 bg-radial-gradient from-[#4fffa0]/10 to-transparent pointer-events-none z-0" />

                                <h1 className="relative z-10 text-5xl md:text-7xl font-mono font-bold text-[#4fffa0] tracking-wider drop-shadow-[0_0_10px_#4fffa0]">
                                    {time}
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BOTTOM: MISSION CARDS --- */}
                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pointer-events-auto mt-auto px-4">
                    {[
                        { title: "Watch the mission", price: "20$", desc: "Watch the mission unfold live and choose from all all active drones in real time", id: "2" },
                        { title: "Mission", price: "150$", desc: "Take control of your drone live and fly it fly it remotely in real time.", id: "3" },
                        { title: "Mission 1+2", price: "250$", desc: "Control your drone and secure your spur spot for the next mission.", id: "4" }
                    ].map((card, i) => (
                        <div key={i} className="flex flex-col items-center group cursor-pointer">
                            {/* Number above card */}
                            <span className="text-2xl text-white mb-3 font-serif">{card.id}</span>

                            {/* Card Body */}
                            <div className="w-full bg-[#0a0c10]/90 border border-[#333] p-6 rounded-xl hover:border-[#4fffa0] transition-colors relative overflow-hidden backdrop-blur-md text-left h-full">
                                {/* Top Green Line Accent */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-[#4fffa0] shadow-[0_0_15px_#4fffa0] rounded-full" />

                                <h3 className="text-white font-bold text-xl mb-2">
                                    {card.title} <span className="text-[#4fffa0]">{card.price}</span>
                                </h3>
                                <p className="text-sm text-gray-400 font-sans leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div >
    );
};

export default MissionObserverHero;
