import { useState, useEffect } from 'react';

interface DebugRulerProps {
    show?: boolean;
}

export const DebugRuler = ({ show = true }: DebugRulerProps) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateWindowSize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        updateWindowSize();
        window.addEventListener('resize', updateWindowSize);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', updateWindowSize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    if (!show) return null;

    const centerX = windowSize.width / 2;
    const centerY = windowSize.height / 2;

    // Generate ruler ticks
    const horizontalTicks = [];
    const verticalTicks = [];

    // Horizontal ruler (top) - every 50px major, every 10px minor
    for (let i = 0; i <= windowSize.width; i += 10) {
        const isMajor = i % 100 === 0;
        const isMid = i % 50 === 0 && !isMajor;
        horizontalTicks.push(
            <div
                key={`h-${i}`}
                className="absolute top-0"
                style={{ left: i }}
            >
                <div
                    className={`w-px ${isMajor ? 'bg-red-500 h-4' : isMid ? 'bg-yellow-400 h-3' : 'bg-white/50 h-2'}`}
                />
                {isMajor && (
                    <span className="absolute top-4 left-0.5 text-[9px] text-red-400 font-mono transform -translate-x-1/2">
                        {i}
                    </span>
                )}
            </div>
        );
    }

    // Vertical ruler (left) - every 50px major, every 10px minor
    for (let i = 0; i <= windowSize.height; i += 10) {
        const isMajor = i % 100 === 0;
        const isMid = i % 50 === 0 && !isMajor;
        verticalTicks.push(
            <div
                key={`v-${i}`}
                className="absolute left-0"
                style={{ top: i }}
            >
                <div
                    className={`h-px ${isMajor ? 'bg-red-500 w-4' : isMid ? 'bg-yellow-400 w-3' : 'bg-white/50 w-2'}`}
                />
                {isMajor && (
                    <span className="absolute left-5 top-0 text-[9px] text-red-400 font-mono transform -translate-y-1/2">
                        {i}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            {/* Horizontal Ruler (Top) */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-black/70 border-b border-white/20">
                {horizontalTicks}
            </div>

            {/* Vertical Ruler (Left) */}
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-black/70 border-r border-white/20">
                {verticalTicks}
            </div>

            {/* Center Crosshair */}
            <div
                className="absolute w-px h-full bg-cyan-500/50"
                style={{ left: centerX }}
            />
            <div
                className="absolute h-px w-full bg-cyan-500/50"
                style={{ top: centerY }}
            />

            {/* Center Point Marker */}
            <div
                className="absolute w-6 h-6 border-2 border-cyan-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: centerX, top: centerY }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                </div>
            </div>

            {/* Center Label */}
            <div
                className="absolute bg-cyan-900/90 px-2 py-1 rounded text-xs font-mono text-cyan-300 transform -translate-x-1/2"
                style={{ left: centerX, top: centerY + 20 }}
            >
                CENTER ({Math.round(centerX)}, {Math.round(centerY)})
            </div>

            {/* Mouse Crosshair Lines */}
            <div
                className="absolute w-px h-full bg-lime-400/30"
                style={{ left: mousePos.x }}
            />
            <div
                className="absolute h-px w-full bg-lime-400/30"
                style={{ top: mousePos.y }}
            />

            {/* Mouse Position Indicator */}
            <div
                className="absolute bg-black/90 border border-lime-400 px-3 py-2 rounded-lg shadow-lg"
                style={{
                    left: mousePos.x + 15,
                    top: mousePos.y + 15,
                    transform: mousePos.x > windowSize.width - 150 ? 'translateX(-120%)' : undefined
                }}
            >
                <div className="text-lime-400 font-mono text-sm font-bold">
                    X: {mousePos.x}px
                </div>
                <div className="text-lime-400 font-mono text-sm font-bold">
                    Y: {mousePos.y}px
                </div>
                <div className="text-cyan-400 font-mono text-xs mt-1 border-t border-white/20 pt-1">
                    From Center: ({mousePos.x - Math.round(centerX)}, {mousePos.y - Math.round(centerY)})
                </div>
            </div>

            {/* Window Size Info */}
            <div className="absolute bottom-4 right-4 bg-black/90 border border-purple-500 px-3 py-2 rounded-lg">
                <div className="text-purple-400 font-mono text-xs font-bold">
                    Window: {windowSize.width} x {windowSize.height}
                </div>
            </div>

            {/* Guide Info (Top Right) */}
            <div className="absolute top-10 right-4 bg-black/90 border border-white/30 px-3 py-2 rounded-lg text-xs font-mono">
                <div className="text-red-400">● Major tick = 100px</div>
                <div className="text-yellow-400">● Mid tick = 50px</div>
                <div className="text-white/50">● Minor tick = 10px</div>
                <div className="text-cyan-400 mt-1">◎ Center crosshair</div>
                <div className="text-lime-400">+ Mouse position</div>
            </div>
        </div>
    );
};

export default DebugRuler;
