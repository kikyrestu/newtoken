import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useVisualEditor } from './VisualEditorControls';
import { Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAdminAuth } from '../context/AdminAuthContext';

interface EditableTextProps {
    children: ReactNode;
    className?: string;
    as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    onSave?: (newText: string) => void;
    storageKey?: string; // Key for backend persistence
}

export const EditableText = ({
    children,
    className = '',
    as: Component = 'span',
    onSave,
    storageKey
}: EditableTextProps) => {
    const { editMode } = useVisualEditor();
    const { isAdminAuthenticated } = useAdminAuth();

    // Backend persistence via useSiteSettings
    const {
        value: savedText,
        setValue: saveToBackend,
        reset: resetInBackend,
        loading: settingsLoading
    } = useSiteSettings<string | null>({
        key: storageKey ? `editableText_${storageKey}` : 'editableText_default',
        defaultValue: null,
        poll: true,
        pollInterval: 10000
    });

    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState<string>('');
    const [originalText, setOriginalText] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Initialize text from children
    useEffect(() => {
        const childText = typeof children === 'string' ? children : '';
        setOriginalText(childText);

        // Use saved value from backend if available
        if (!settingsLoading) {
            if (savedText !== null) {
                setText(savedText);
            } else {
                setText(childText);
            }
        }
    }, [children, savedText, settingsLoading]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Handle click to start editing
    const handleClick = (e: React.MouseEvent) => {
        if (editMode && !isEditing && isAdminAuthenticated) {
            e.preventDefault();
            e.stopPropagation();
            setIsEditing(true);
        }
    };

    // Save changes to backend
    const handleSave = useCallback(async () => {
        if (!storageKey) {
            setIsEditing(false);
            onSave?.(text);
            return;
        }

        setIsSaving(true);
        const success = await saveToBackend(text);
        setIsSaving(false);

        if (success) {
            setIsEditing(false);
            onSave?.(text);
        }
    }, [text, storageKey, saveToBackend, onSave]);

    // Cancel editing
    const handleCancel = () => {
        setText(savedText || originalText);
        setIsEditing(false);
    };

    // Reset to original
    const handleReset = async () => {
        setText(originalText);
        setIsEditing(false);

        if (storageKey) {
            await resetInBackend();
        }
    };

    // Handle key events
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    // Display text (from backend or original)
    const displayText = savedText || (typeof children === 'string' ? children : '');

    // If not in edit mode, just render content
    if (!editMode) {
        return (
            <Component className={className}>
                {displayText}
            </Component>
        );
    }

    // In edit mode but not admin - can't edit
    if (!isAdminAuthenticated) {
        return (
            <Component className={className}>
                {displayText}
            </Component>
        );
    }

    // In edit mode but not actively editing
    if (!isEditing) {
        return (
            <Component
                className={`
                    ${className}
                    cursor-pointer relative
                    outline outline-2 outline-dashed outline-transparent
                    hover:outline-lime-400/50
                    transition-all duration-200
                    group
                `}
                onClick={handleClick}
            >
                {displayText}
                {/* Edit indicator on hover */}
                <span className="
                    absolute -top-2 -right-2 opacity-0 group-hover:opacity-100
                    bg-lime-500 text-black text-[10px] px-1.5 py-0.5 rounded
                    font-bold tracking-wide transition-opacity duration-200
                    pointer-events-none z-50
                ">
                    EDIT
                </span>
                {/* Modified indicator */}
                {savedText && savedText !== originalText && (
                    <span className="
                        absolute -top-2 -left-2
                        bg-cyan-500 text-black text-[10px] px-1.5 py-0.5 rounded
                        font-bold tracking-wide
                        pointer-events-none z-50
                    ">
                        MODIFIED
                    </span>
                )}
            </Component>
        );
    }

    // Actively editing
    return (
        <div className="relative inline-block">
            <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`
                    ${className}
                    bg-zinc-900/95 border-2 border-lime-400
                    rounded-lg p-2 resize-none
                    focus:outline-none focus:ring-2 focus:ring-lime-400/50
                    shadow-[0_0_20px_rgba(132,204,22,0.3)]
                    min-w-[200px] min-h-[40px]
                `}
                style={{
                    width: Math.max(200, text.length * 10),
                    height: Math.max(40, text.split('\n').length * 24 + 16)
                }}
            />

            {/* Action buttons */}
            <div className="absolute -bottom-10 left-0 flex items-center gap-2">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="
                        flex items-center gap-1 px-3 py-1.5 rounded-lg
                        bg-lime-500 text-black font-bold text-xs
                        hover:bg-lime-400 transition-colors
                        shadow-lg disabled:opacity-50
                    "
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {isSaving ? 'Saving...' : 'Save for All'}
                </button>
                <button
                    onClick={handleCancel}
                    className="
                        flex items-center gap-1 px-3 py-1.5 rounded-lg
                        bg-zinc-700 text-white font-bold text-xs
                        hover:bg-zinc-600 transition-colors
                        shadow-lg
                    "
                >
                    <X size={14} />
                    Cancel
                </button>
                {savedText && savedText !== originalText && (
                    <button
                        onClick={handleReset}
                        className="
                            flex items-center gap-1 px-3 py-1.5 rounded-lg
                            bg-red-500/20 text-red-400 font-bold text-xs
                            hover:bg-red-500/30 transition-colors
                            shadow-lg border border-red-500/50
                        "
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                )}
            </div>

            {/* Hint */}
            <div className="absolute -top-8 left-0 text-xs text-zinc-400 font-mono">
                Enter to save • Esc to cancel • Shift+Enter for new line
            </div>
        </div>
    );
};

export default EditableText;
