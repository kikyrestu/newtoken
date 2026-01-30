import React, { useState, useEffect, useCallback } from 'react';
import { Move, Save, RotateCcw, Settings, X, Eye, EyeOff } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

interface TimerDeviceProps {
    unlockTimestamp?: number;
    className?: string;
    showEditor?: boolean;
    onEditorToggle?: (show: boolean) => void;
}

interface Position {
    x: number; // percentage from center (-50 to 50)
    y: number; // percentage from center (-50 to 50)
    scale: number; // 0.5 to 2
}

const DEFAULT_POSITION: Position = {
    x: 0,
    y: 0,
    scale: 1
};

const STORAGE_KEY = 'timer-device-position';

export default function TimerDevice({
    unlockTimestamp = Date.now() + 24 * 60 * 60 * 1000, // Default: 24 hours from now
    className = '',
    showEditor = false,
    onEditorToggle
}: TimerDeviceProps) {
    const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [editorOpen, setEditorOpen] = useState(showEditor);
    const [showControls, setShowControls] = useState(true);

    // Load position from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setPosition(parsed);
            } catch (e) {
                console.warn('Failed to parse saved position');
            }
        }
    }, []);

    // Save position to localStorage
    const savePosition = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        console.log('Position saved:', position);
    }, [position]);

    // Reset position
    const resetPosition = useCallback(() => {
        setPosition(DEFAULT_POSITION);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // Handle mouse down for dragging
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!editorOpen) return;
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - (position.x * window.innerWidth / 100),
            y: e.clientY - (position.y * window.innerHeight / 100)
        });
    }, [editorOpen, position]);

    // Handle mouse move for dragging
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newX = ((e.clientX - dragStart.x) / window.innerWidth) * 100;
            const newY = ((e.clientY - dragStart.y) / window.innerHeight) * 100;

            setPosition(prev => ({
                ...prev,
                x: Math.max(-40, Math.min(40, newX)),
                y: Math.max(-40, Math.min(40, newY))
            }));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    // Toggle editor
    const toggleEditor = useCallback(() => {
        const newState = !editorOpen;
        setEditorOpen(newState);
        onEditorToggle?.(newState);
    }, [editorOpen, onEditorToggle]);

    return (
        <>
            {/* Timer Device - Combined PNG + Countdown */}
            <div
                className={`timer-device-container ${className}`}
                style={{
                    transform: `translate(${position.x}vw, ${position.y}vh) scale(${position.scale})`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                    cursor: editorOpen ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
                onMouseDown={handleMouseDown}
            >
                {/* PNG Frame */}
                <div className="relative w-full max-w-xl h-[200px] md:h-[260px] lg:h-[300px]">
                    <img
                        src="/assets/timer-countdown.png"
                        alt="Countdown Frame"
                        className="h-full w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                        draggable={false}
                    />

                    {/* Countdown Timer - Positioned inside the frame */}
                    <div className="absolute top-[34%] bottom-[30%] left-[15%] right-[15%] flex items-center justify-center z-[-1]">
                        <CountdownTimer
                            unlockTimestamp={unlockTimestamp}
                            size="md"
                            showLabels={false}
                            showStatus={false}
                            variant="device"
                            className="w-full h-full flex items-center justify-center"
                        />
                    </div>

                    {/* Editor Mode Indicator */}
                    {editorOpen && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#00ff41]/20 border border-[#00ff41] rounded px-3 py-1 text-[#00ff41] text-xs font-mono whitespace-nowrap">
                            <Move className="inline w-3 h-3 mr-1" />
                            DRAG TO MOVE
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Controls Panel */}
            {showControls && (
                <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                    {/* Toggle Editor Button */}
                    <button
                        onClick={toggleEditor}
                        className={`p-3 rounded-full shadow-lg transition-all ${editorOpen
                            ? 'bg-[#00ff41] text-black hover:bg-[#00ff41]/80'
                            : 'bg-zinc-800/90 text-white hover:bg-zinc-700'
                            }`}
                        title={editorOpen ? 'Close Editor' : 'Open Position Editor'}
                    >
                        {editorOpen ? <X size={20} /> : <Settings size={20} />}
                    </button>

                    {/* Editor Panel */}
                    {editorOpen && (
                        <div className="bg-zinc-900/95 border border-zinc-700 rounded-lg p-4 shadow-xl backdrop-blur-sm min-w-[240px]">
                            <h3 className="text-[#00ff41] font-bold text-sm mb-3 flex items-center gap-2">
                                <Move size={16} />
                                Timer Position Editor
                            </h3>

                            {/* Position Values */}
                            <div className="space-y-3 text-xs font-mono">
                                {/* X Position */}
                                <div>
                                    <label className="text-zinc-400 block mb-1">X Offset: {position.x.toFixed(1)}vw</label>
                                    <input
                                        type="range"
                                        min="-40"
                                        max="40"
                                        step="0.5"
                                        value={position.x}
                                        onChange={(e) => setPosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                                        className="w-full accent-[#00ff41]"
                                    />
                                </div>

                                {/* Y Position */}
                                <div>
                                    <label className="text-zinc-400 block mb-1">Y Offset: {position.y.toFixed(1)}vh</label>
                                    <input
                                        type="range"
                                        min="-40"
                                        max="40"
                                        step="0.5"
                                        value={position.y}
                                        onChange={(e) => setPosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                                        className="w-full accent-[#00ff41]"
                                    />
                                </div>

                                {/* Scale */}
                                <div>
                                    <label className="text-zinc-400 block mb-1">Scale: {position.scale.toFixed(2)}x</label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="1.5"
                                        step="0.05"
                                        value={position.scale}
                                        onChange={(e) => setPosition(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                                        className="w-full accent-[#00ff41]"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={savePosition}
                                    className="flex-1 bg-[#00ff41] text-black py-2 px-3 rounded text-xs font-bold hover:bg-[#00ff41]/80 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Save size={14} />
                                    Save
                                </button>
                                <button
                                    onClick={resetPosition}
                                    className="flex-1 bg-zinc-700 text-white py-2 px-3 rounded text-xs font-bold hover:bg-zinc-600 transition-colors flex items-center justify-center gap-1"
                                >
                                    <RotateCcw size={14} />
                                    Reset
                                </button>
                            </div>

                            {/* Hide Controls Toggle */}
                            <button
                                onClick={() => setShowControls(false)}
                                className="w-full mt-3 text-zinc-500 hover:text-zinc-300 text-xs flex items-center justify-center gap-1 py-1"
                            >
                                <EyeOff size={12} />
                                Hide Controls (Press E to show)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Hidden Controls - Show on E key */}
            {!showControls && (
                <button
                    onClick={() => setShowControls(true)}
                    className="fixed bottom-4 right-4 z-[100] p-2 bg-zinc-800/50 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all"
                    title="Show Editor (E)"
                >
                    <Eye size={16} />
                </button>
            )}
        </>
    );
}
