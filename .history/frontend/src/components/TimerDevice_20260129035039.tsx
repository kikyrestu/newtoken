import React, { useState, useEffect, useCallback } from 'react';
import { Move, Save, RotateCcw, Settings, X, Eye, EyeOff } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useSiteSettings } from '../hooks/useSiteSettings';

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

const SETTINGS_KEY = 'timer-device-position';

export default function TimerDevice({
    unlockTimestamp = Date.now() + 24 * 60 * 60 * 1000,
    className = '',
    showEditor = false,
    onEditorToggle
}: TimerDeviceProps) {
    // ========================================================================
    // STATE
    // ========================================================================

    // Use backend settings instead of localStorage
    const {
        value: savedPosition,
        setValue: saveToBackend,
        reset: resetInBackend,
        loading: settingsLoading
    } = useSiteSettings<Position>({
        key: SETTINGS_KEY,
        defaultValue: DEFAULT_POSITION,
        poll: true,
        pollInterval: 10000 // Sync every 10 seconds
    });

    const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [editorOpen, setEditorOpen] = useState(showEditor);
    const [showControls, setShowControls] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Admin auth check - only admins can see Position Editor
    const { isAdminAuthenticated } = useAdminAuth();

    // ========================================================================
    // SYNC WITH BACKEND
    // ========================================================================

    // Update local position when backend value changes
    useEffect(() => {
        if (!settingsLoading && savedPosition) {
            setPosition(savedPosition);
        }
    }, [savedPosition, settingsLoading]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    // Save position to backend (admin only)
    const savePosition = useCallback(async () => {
        setIsSaving(true);
        const success = await saveToBackend(position);
        setIsSaving(false);

        if (success) {
            console.log('Position saved to backend:', position);
        } else {
            console.warn('Failed to save position - admin access required');
        }
    }, [position, saveToBackend]);

    // Reset position to default
    const resetPosition = useCallback(async () => {
        setPosition(DEFAULT_POSITION);
        await resetInBackend();
    }, [resetInBackend]);

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

    // ========================================================================
    // RENDER
    // ========================================================================

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
                {/* Timer Device Image */}
                <div className="timer-device relative inline-block">
                    <img
                        src="/assets/timer-countdown.png"
                        alt="Countdown Frame"
                        className="w-full max-w-[500px] pointer-events-none select-none"
                        draggable="false"
                    />

                    {/* Countdown Timer - Positioned inside the frame */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <CountdownTimer
                            unlockTimestamp={unlockTimestamp}
                            variant="device"
                            showLabels={false}
                            showStatus={false}
                            className="timer-digits"
                        />
                    </div>

                    {/* Editor Mode Indicator */}
                    {editorOpen && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded font-bold">
                            EDIT MODE
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Controls Panel - Only show for admin users */}
            {isAdminAuthenticated && (
                <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
                    {/* Toggle Editor Button */}
                    <button
                        onClick={toggleEditor}
                        className={`p-3 rounded-full shadow-lg transition-all ${editorOpen
                            ? 'bg-yellow-500 text-black'
                            : 'bg-[#00ff41]/20 text-[#00ff41] hover:bg-[#00ff41]/30'
                            }`}
                        title={editorOpen ? 'Close Editor' : 'Open Position Editor'}
                    >
                        {editorOpen ? <X size={20} /> : <Settings size={20} />}
                    </button>

                    {/* Editor Panel */}
                    {editorOpen && (
                        <div className="bg-black/90 border border-[#00ff41]/30 rounded-lg p-4 w-72 shadow-xl">
                            <h4 className="text-[#00ff41] font-bold text-sm mb-3 flex items-center gap-2">
                                <Move size={16} />
                                Timer Position Editor
                            </h4>

                            {/* Position Controls */}
                            <div className="space-y-3">
                                {/* X Position */}
                                <div>
                                    <label className="text-gray-400 text-xs block mb-1">
                                        Horizontal: {position.x.toFixed(1)}%
                                    </label>
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
                                    <label className="text-gray-400 text-xs block mb-1">
                                        Vertical: {position.y.toFixed(1)}%
                                    </label>
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
                                    <label className="text-gray-400 text-xs block mb-1">
                                        Scale: {position.scale.toFixed(2)}x
                                    </label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
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
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#00ff41] text-black text-xs font-bold py-2 rounded hover:bg-[#00cc33] transition-colors disabled:opacity-50"
                                >
                                    <Save size={14} />
                                    {isSaving ? 'Saving...' : 'Save for All'}
                                </button>
                                <button
                                    onClick={resetPosition}
                                    className="flex items-center justify-center gap-1.5 bg-gray-700 text-white text-xs font-bold py-2 px-3 rounded hover:bg-gray-600 transition-colors"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>

                            {/* Sync Info */}
                            <p className="text-gray-500 text-[10px] mt-2 text-center">
                                Changes will sync to all users within 10s
                            </p>

                            {/* Toggle Controls Visibility */}
                            <button
                                onClick={() => setShowControls(!showControls)}
                                className="mt-2 w-full flex items-center justify-center gap-1.5 text-gray-400 text-xs hover:text-white transition-colors"
                            >
                                {showControls ? <EyeOff size={12} /> : <Eye size={12} />}
                                {showControls ? 'Hide Timer' : 'Show Timer'}
                            </button>
                        </div>
                    )}

                    {/* Keyboard shortcut hint */}
                    {!editorOpen && (
                        <span
                            className="text-gray-500 text-xs bg-black/50 px-2 py-1 rounded"
                            title="Show Editor (E)"
                        >
                            Press E to edit
                        </span>
                    )}
                </div>
            )}
        </>
    );
}
