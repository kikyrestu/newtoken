import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { Ruler, Type, Settings2, X, Eye, EyeOff, Edit3 } from 'lucide-react';

// Visual Editor Context for global state management
interface VisualEditorContextType {
    showRuler: boolean;
    setShowRuler: (show: boolean) => void;
    editMode: boolean;
    setEditMode: (edit: boolean) => void;
    isControlsOpen: boolean;
    setIsControlsOpen: (open: boolean) => void;
}

const VisualEditorContext = createContext<VisualEditorContextType | undefined>(undefined);

export const useVisualEditor = () => {
    const context = useContext(VisualEditorContext);
    if (!context) {
        throw new Error('useVisualEditor must be used within VisualEditorProvider');
    }
    return context;
};

// Provider Component
export const VisualEditorProvider = ({ children }: { children: ReactNode }) => {
    const [showRuler, setShowRuler] = useState(() => {
        const saved = localStorage.getItem('visualEditor_showRuler');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [editMode, setEditMode] = useState(() => {
        const saved = localStorage.getItem('visualEditor_editMode');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [isControlsOpen, setIsControlsOpen] = useState(false);

    // Persist settings to localStorage
    useEffect(() => {
        localStorage.setItem('visualEditor_showRuler', JSON.stringify(showRuler));
    }, [showRuler]);

    useEffect(() => {
        localStorage.setItem('visualEditor_editMode', JSON.stringify(editMode));
    }, [editMode]);

    return (
        <VisualEditorContext.Provider value={{
            showRuler,
            setShowRuler,
            editMode,
            setEditMode,
            isControlsOpen,
            setIsControlsOpen
        }}>
            {children}
        </VisualEditorContext.Provider>
    );
};

// Toggle Button Component
const ToggleButton = ({
    active,
    onClick,
    icon: Icon,
    label,
    activeColor = 'lime'
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    activeColor?: 'lime' | 'cyan' | 'yellow';
}) => {
    const colorStyles = {
        lime: {
            activeBg: 'bg-lime-500/20',
            activeBorder: 'border-lime-400',
            activeText: 'text-lime-400',
            activeShadow: 'shadow-[0_0_15px_rgba(132,204,22,0.4)]'
        },
        cyan: {
            activeBg: 'bg-cyan-500/20',
            activeBorder: 'border-cyan-400',
            activeText: 'text-cyan-400',
            activeShadow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]'
        },
        yellow: {
            activeBg: 'bg-yellow-500/20',
            activeBorder: 'border-yellow-400',
            activeText: 'text-yellow-400',
            activeShadow: 'shadow-[0_0_15px_rgba(250,204,21,0.4)]'
        }
    };

    const styles = colorStyles[activeColor];

    return (
        <button
            onClick={onClick}
            className={`
                group flex items-center gap-3 w-full px-4 py-3 rounded-lg
                border transition-all duration-300
                ${active
                    ? `${styles.activeBg} ${styles.activeBorder} ${styles.activeText} ${styles.activeShadow}`
                    : 'bg-zinc-900/50 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                }
            `}
        >
            <div className={`
                p-2 rounded-lg transition-all duration-300
                ${active ? styles.activeBg : 'bg-zinc-800 group-hover:bg-zinc-700'}
            `}>
                <Icon size={18} className={active ? styles.activeText : 'text-zinc-400 group-hover:text-zinc-300'} />
            </div>
            <div className="flex-1 text-left">
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs opacity-60">
                    {active ? 'ON' : 'OFF'}
                </div>
            </div>
            <div className={`
                w-12 h-6 rounded-full p-1 transition-all duration-300
                ${active ? styles.activeBg : 'bg-zinc-800'}
            `}>
                <div className={`
                    w-4 h-4 rounded-full transition-all duration-300
                    ${active
                        ? `${styles.activeText.replace('text-', 'bg-').replace('-400', '-500')} translate-x-6`
                        : 'bg-zinc-600 translate-x-0'
                    }
                `} />
            </div>
        </button>
    );
};

// Main Controls Panel
export const VisualEditorControls = () => {
    const {
        showRuler,
        setShowRuler,
        editMode,
        setEditMode,
        isControlsOpen,
        setIsControlsOpen
    } = useVisualEditor();

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsControlsOpen(!isControlsOpen)}
                className={`
                    fixed bottom-24 right-4 z-[9998] p-3 rounded-full
                    border-2 transition-all duration-300
                    ${isControlsOpen
                        ? 'bg-red-500/20 border-red-400 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.4)]'
                        : 'bg-zinc-900/90 border-[#00ff41] text-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:bg-[#00ff41]/10'
                    }
                `}
                title="Visual Editor Settings"
            >
                {isControlsOpen ? <X size={20} /> : <Settings2 size={20} />}
            </button>

            {/* Controls Panel */}
            <div className={`
                fixed bottom-40 right-4 z-[9997] w-72
                bg-zinc-950/95 backdrop-blur-xl
                border border-zinc-700 rounded-xl
                shadow-2xl shadow-black/50
                transition-all duration-300 origin-bottom-right
                ${isControlsOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
                }
            `}>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                    <Edit3 size={18} className="text-[#00ff41]" />
                    <span className="font-bold text-white text-sm">Visual Editor</span>
                    <span className="ml-auto text-xs text-zinc-500 font-mono">DEV MODE</span>
                </div>

                {/* Controls */}
                <div className="p-3 space-y-2">
                    {/* Ruler Toggle */}
                    <ToggleButton
                        active={showRuler}
                        onClick={() => setShowRuler(!showRuler)}
                        icon={Ruler}
                        label="Debug Ruler"
                        activeColor="cyan"
                    />

                    {/* Edit Mode Toggle */}
                    <ToggleButton
                        active={editMode}
                        onClick={() => setEditMode(!editMode)}
                        icon={Type}
                        label="Edit Text Mode"
                        activeColor="lime"
                    />
                </div>

                {/* Footer Info */}
                <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50 rounded-b-xl">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        {editMode ? (
                            <>
                                <Eye size={12} className="text-lime-400" />
                                <span className="text-lime-400">Click any text to edit</span>
                            </>
                        ) : (
                            <>
                                <EyeOff size={12} />
                                <span>Edit mode disabled</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default VisualEditorControls;
