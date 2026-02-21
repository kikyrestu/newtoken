import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Move, Save, RotateCcw, Settings, X, Eye, EyeOff, Monitor, Smartphone } from 'lucide-react';
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
    x: number;           // Device horizontal position (vw)
    y: number;           // Device vertical position (vh)
    scale: number;       // Device scale (0.5 to 2)
    digitOffsetX: number; // Digit offset inside frame (px)
    digitOffsetY: number; // Digit offset inside frame (px)
    digitScale: number;   // Digit scale inside frame
}

const DEFAULT_POSITION: Position = {
    x: 0,
    y: 0,
    scale: 1.3,  // Increased 30% per Vanja's request
    digitOffsetX: 0,
    digitOffsetY: 0,
    digitScale: 1
};

// Mobile default - smaller and differently positioned
const DEFAULT_POSITION_MOBILE: Position = {
    x: 0,
    y: 0,
    scale: 0.7,
    digitOffsetX: 0,
    digitOffsetY: 0,
    digitScale: 0.9
};

const SETTINGS_KEY_DESKTOP = 'timer-device-position-desktop';
const SETTINGS_KEY_MOBILE = 'timer-device-position-mobile';
const MOBILE_BREAKPOINT = 768;

// Hook to detect mobile vs desktop
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
}

export default function TimerDevice({
    unlockTimestamp = Date.now() + 24 * 60 * 60 * 1000,
    className = '',
    showEditor = false,
    onEditorToggle
}: TimerDeviceProps) {
    // ========================================================================
    // STATE
    // ========================================================================

    const isMobile = useIsMobile();
    const currentDefault = isMobile ? DEFAULT_POSITION_MOBILE : DEFAULT_POSITION;

    // Desktop settings
    const {
        value: savedDesktopPosition,
        setValue: saveDesktopToBackend,
        reset: resetDesktopInBackend,
        loading: desktopLoading
    } = useSiteSettings<Position>({
        key: SETTINGS_KEY_DESKTOP,
        defaultValue: DEFAULT_POSITION,
        poll: true,
        pollInterval: 10000
    });

    // Mobile settings
    const {
        value: savedMobilePosition,
        setValue: saveMobileToBackend,
        reset: resetMobileInBackend,
        loading: mobileLoading
    } = useSiteSettings<Position>({
        key: SETTINGS_KEY_MOBILE,
        defaultValue: DEFAULT_POSITION_MOBILE,
        poll: true,
        pollInterval: 10000
    });

    const savedPosition = isMobile ? savedMobilePosition : savedDesktopPosition;
    const settingsLoading = isMobile ? mobileLoading : desktopLoading;

    const [position, setPosition] = useState<Position>(currentDefault);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [editorOpen, setEditorOpen] = useState(showEditor);
    const [showControls, setShowControls] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'device' | 'digits'>('device');

    const { isAdminAuthenticated } = useAdminAuth();

    // ========================================================================
    // SYNC WITH BACKEND
    // ========================================================================

    useEffect(() => {
        if (!settingsLoading && savedPosition) {
            // Merge with current default for backward compatibility
            setPosition({ ...currentDefault, ...savedPosition });
        }
    }, [savedPosition, settingsLoading, currentDefault]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const savePosition = useCallback(async () => {
        setIsSaving(true);
        const saveFunc = isMobile ? saveMobileToBackend : saveDesktopToBackend;
        const success = await saveFunc(position);
        setIsSaving(false);

        if (success) {
        }
    }, [position, isMobile, saveMobileToBackend, saveDesktopToBackend]);

    const resetPosition = useCallback(async () => {
        setPosition(currentDefault);
        const resetFunc = isMobile ? resetMobileInBackend : resetDesktopInBackend;
        await resetFunc();
    }, [currentDefault, isMobile, resetMobileInBackend, resetDesktopInBackend]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!editorOpen || activeTab !== 'device') return;
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - (position.x * window.innerWidth / 100),
            y: e.clientY - (position.y * window.innerHeight / 100)
        });
    }, [editorOpen, activeTab, position]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newX = ((e.clientX - dragStart.x) / window.innerWidth) * 100;
            const newY = ((e.clientY - dragStart.y) / window.innerHeight) * 100;

            setPosition(prev => ({
                ...prev,
                x: Math.max(-90, Math.min(90, newX)),
                y: Math.max(-90, Math.min(90, newY))
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
            {/* Timer Device */}
            <div
                className={`timer-device-container ${className}`}
                style={{
                    transform: `translate(${position.x}vw, ${position.y}vh) scale(${position.scale})`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                    cursor: editorOpen && activeTab === 'device' ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="timer-device relative inline-block">
                    <img
                        src="/assets/timer-countdown.png"
                        alt="Countdown Frame"
                        className="w-full max-w-[500px] pointer-events-none select-none"
                        draggable="false"
                    />

                    {/* Countdown Timer - With adjustable offset */}
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            transform: `translate(${position.digitOffsetX}px, ${position.digitOffsetY}px) scale(${position.digitScale})`,
                            transition: 'transform 0.2s ease-out'
                        }}
                    >
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
                            EDIT MODE - {activeTab.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Controls Panel - Rendered via Portal to bypass pointer-events-none parents */}
            {isAdminAuthenticated && createPortal(
                <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
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

                    {editorOpen && (
                        <div className="bg-black/90 border border-[#00ff41]/30 rounded-lg p-4 w-80 shadow-xl">
                            {/* Tabs */}
                            <div className="flex gap-1 mb-3">
                                <button
                                    onClick={() => setActiveTab('device')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded ${activeTab === 'device'
                                        ? 'bg-[#00ff41] text-black'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    📦 Device Position
                                </button>
                                <button
                                    onClick={() => setActiveTab('digits')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded ${activeTab === 'digits'
                                        ? 'bg-[#00ff41] text-black'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    🔢 Digit Position
                                </button>
                            </div>

                            {/* Device Tab */}
                            {activeTab === 'device' && (
                                <div className="space-y-3">
                                    <h4 className="text-[#00ff41] font-bold text-sm flex items-center gap-2">
                                        <Move size={16} />
                                        Device Position
                                    </h4>
                                    <p className="text-gray-500 text-[10px]">Drag device or use sliders</p>

                                    <div>
                                        <label className="text-gray-400 text-xs block mb-1">
                                            Horizontal: {position.x.toFixed(1)}vw
                                        </label>
                                        <input
                                            type="range"
                                            min="-90"
                                            max="90"
                                            step="0.5"
                                            value={position.x}
                                            onChange={(e) => setPosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                                            className="w-full accent-[#00ff41]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-gray-400 text-xs block mb-1">
                                            Vertical: {position.y.toFixed(1)}vh
                                        </label>
                                        <input
                                            type="range"
                                            min="-90"
                                            max="90"
                                            step="0.5"
                                            value={position.y}
                                            onChange={(e) => setPosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                                            className="w-full accent-[#00ff41]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-gray-400 text-xs block mb-1">
                                            Device Scale: {position.scale.toFixed(2)}x
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
                            )}

                            {/* Digits Tab */}
                            {activeTab === 'digits' && (
                                <div className="space-y-3">
                                    <h4 className="text-[#00ff41] font-bold text-sm flex items-center gap-2">
                                        🔢 Digit Position (Inside Frame)
                                    </h4>
                                    <p className="text-gray-500 text-[10px]">Fine-tune digits within the device frame</p>

                                    <div>
                                        <label className="text-gray-400 text-xs block mb-1">
                                            Horizontal Offset: {position.digitOffsetX}px
                                        </label>
                                        <input
                                            type="range"
                                            min="-50"
                                            max="50"
                                            step="1"
                                            value={position.digitOffsetX}
                                            onChange={(e) => setPosition(prev => ({ ...prev, digitOffsetX: parseFloat(e.target.value) }))}
                                            className="w-full accent-cyan-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-gray-400 text-xs block mb-1">
                                            Vertical Offset: {position.digitOffsetY}px
                                        </label>
                                        <input
                                            type="range"
                                            min="-50"
                                            max="50"
                                            step="1"
                                            value={position.digitOffsetY}
                                            onChange={(e) => setPosition(prev => ({ ...prev, digitOffsetY: parseFloat(e.target.value) }))}
                                            className="w-full accent-cyan-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-gray-400 text-xs block mb-1">
                                            Digit Scale: {position.digitScale.toFixed(2)}x
                                        </label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="1.5"
                                            step="0.05"
                                            value={position.digitScale}
                                            onChange={(e) => setPosition(prev => ({ ...prev, digitScale: parseFloat(e.target.value) }))}
                                            className="w-full accent-cyan-400"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={savePosition}
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#00ff41] text-black text-xs font-bold py-2 rounded hover:bg-[#00cc33] transition-colors disabled:opacity-50"
                                >
                                    <Save size={14} />
                                    {isSaving ? 'Saving...' : `Save ${isMobile ? 'Mobile' : 'Desktop'}`}
                                </button>
                                <button
                                    onClick={resetPosition}
                                    className="flex items-center justify-center gap-1.5 bg-gray-700 text-white text-xs font-bold py-2 px-3 rounded hover:bg-gray-600 transition-colors"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>

                            {/* Device Mode Indicator */}
                            <div className="flex items-center justify-center gap-2 mt-3 p-2 bg-gray-800/50 rounded border border-gray-700">
                                {isMobile ? (
                                    <><Smartphone size={14} className="text-cyan-400" />
                                        <span className="text-cyan-400 text-xs font-bold">EDITING MOBILE</span></>
                                ) : (
                                    <><Monitor size={14} className="text-purple-400" />
                                        <span className="text-purple-400 text-xs font-bold">EDITING DESKTOP</span></>
                                )}
                            </div>

                            <p className="text-gray-500 text-[10px] mt-2 text-center">
                                Resize browser to switch between Desktop/Mobile editing
                            </p>

                            <button
                                onClick={() => setShowControls(!showControls)}
                                className="mt-2 w-full flex items-center justify-center gap-1.5 text-gray-400 text-xs hover:text-white transition-colors"
                            >
                                {showControls ? <EyeOff size={12} /> : <Eye size={12} />}
                                {showControls ? 'Hide Timer' : 'Show Timer'}
                            </button>
                        </div>
                    )}

                    {!editorOpen && (
                        <span
                            className="text-gray-500 text-xs bg-black/50 px-2 py-1 rounded"
                        >
                            Press E to edit
                        </span>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}
