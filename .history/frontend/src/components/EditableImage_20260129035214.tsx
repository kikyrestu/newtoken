import { useState, useRef, useEffect, useCallback } from 'react';
import { useVisualEditor } from './VisualEditorControls';
import { Move, Maximize2, RotateCcw, Check, X, Loader2 } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAdminAuth } from '../context/AdminAuthContext';

interface EditableImageProps {
    src: string;
    alt?: string;
    className?: string;
    storageKey?: string; // Key for backend persistence
    initialWidth?: number;
    initialHeight?: number;
}

interface ImageTransform {
    width: number;
    height: number;
    x: number;
    y: number;
}

export const EditableImage = ({
    src,
    alt = '',
    className = '',
    storageKey,
    initialWidth = 200,
    initialHeight = 200
}: EditableImageProps) => {
    const { editMode } = useVisualEditor();
    const { isAdminAuthenticated } = useAdminAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const defaultTransform: ImageTransform = {
        width: initialWidth,
        height: initialHeight,
        x: 0,
        y: 0
    };

    // Backend persistence via useSiteSettings
    const {
        value: savedTransform,
        setValue: saveToBackend,
        reset: resetInBackend,
        loading: settingsLoading
    } = useSiteSettings<ImageTransform>({
        key: storageKey ? `editableImage_${storageKey}` : 'editableImage_default',
        defaultValue: defaultTransform,
        poll: true,
        pollInterval: 10000
    });

    // Transform state
    const [transform, setTransform] = useState<ImageTransform>(defaultTransform);
    const [originalTransform, setOriginalTransform] = useState<ImageTransform | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isSaving, setIsSaving] = useState(false);

    // Lock aspect ratio
    const [aspectRatio, setAspectRatio] = useState(1);

    // Sync with backend
    useEffect(() => {
        if (!settingsLoading && savedTransform) {
            setTransform(savedTransform);
        }
    }, [savedTransform, settingsLoading]);

    // Get natural dimensions on load
    useEffect(() => {
        if (imageRef.current && imageRef.current.naturalWidth) {
            setAspectRatio(imageRef.current.naturalWidth / imageRef.current.naturalHeight);
        }
    }, [src]);

    // Handle click to start editing
    const handleClick = (e: React.MouseEvent) => {
        if (editMode && !isEditing && isAdminAuthenticated) {
            e.preventDefault();
            e.stopPropagation();
            setOriginalTransform({ ...transform });
            setIsEditing(true);
        }
    };

    // Handle drag start
    const handleDragStart = (e: React.MouseEvent) => {
        if (!isEditing) return;
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    };

    // Handle resize start
    const handleResizeStart = (e: React.MouseEvent) => {
        if (!isEditing) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    // Handle mouse move for drag/resize
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setTransform(prev => ({
                    ...prev,
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                }));
            } else if (isResizing) {
                const deltaX = e.clientX - dragStart.x;
                setTransform(prev => {
                    const newWidth = Math.max(50, prev.width + deltaX);
                    const newHeight = newWidth / aspectRatio;
                    return { ...prev, width: newWidth, height: newHeight };
                });
                setDragStart({ x: e.clientX, y: e.clientY });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragStart, aspectRatio]);

    // Save changes to backend
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        const success = await saveToBackend(transform);
        setIsSaving(false);

        if (success) {
            setIsEditing(false);
            setOriginalTransform(null);
        }
    }, [transform, saveToBackend]);

    // Cancel changes
    const handleCancel = () => {
        if (originalTransform) {
            setTransform(originalTransform);
        }
        setIsEditing(false);
        setOriginalTransform(null);
    };

    // Reset to original
    const handleReset = async () => {
        setTransform(defaultTransform);
        await resetInBackend();
        setIsEditing(false);
    };

    // Not in edit mode - render normally
    if (!editMode) {
        return (
            <div
                className={`relative ${className}`}
                style={{
                    width: transform.width,
                    height: transform.height,
                    transform: `translate(${transform.x}px, ${transform.y}px)`
                }}
            >
                <img
                    ref={imageRef}
                    src={src}
                    alt={alt}
                    className="w-full h-full object-contain"
                />
            </div>
        );
    }

    // Edit mode - not admin
    if (!isAdminAuthenticated) {
        return (
            <div
                className={`relative ${className}`}
                style={{
                    width: transform.width,
                    height: transform.height,
                    transform: `translate(${transform.x}px, ${transform.y}px)`
                }}
            >
                <img
                    ref={imageRef}
                    src={src}
                    alt={alt}
                    className="w-full h-full object-contain"
                />
            </div>
        );
    }

    // Edit mode - not active editing
    if (!isEditing) {
        return (
            <div
                ref={containerRef}
                className={`
                    relative cursor-pointer group
                    outline outline-2 outline-dashed outline-transparent
                    hover:outline-lime-400/50
                    transition-all duration-200
                    ${className}
                `}
                style={{
                    width: transform.width,
                    height: transform.height,
                    transform: `translate(${transform.x}px, ${transform.y}px)`
                }}
                onClick={handleClick}
            >
                <img
                    ref={imageRef}
                    src={src}
                    alt={alt}
                    className="w-full h-full object-contain"
                />
                {/* Edit indicator on hover */}
                <span className="
                    absolute -top-2 -right-2 opacity-0 group-hover:opacity-100
                    bg-lime-500 text-black text-[10px] px-1.5 py-0.5 rounded
                    font-bold tracking-wide transition-opacity duration-200
                    pointer-events-none z-50 flex items-center gap-1
                ">
                    <Maximize2 size={10} />
                    RESIZE
                </span>
            </div>
        );
    }

    // Active editing mode
    return (
        <div
            ref={containerRef}
            className={`
                relative cursor-move
                outline outline-2 outline-lime-400
                shadow-[0_0_20px_rgba(132,204,22,0.3)]
                ${className}
            `}
            style={{
                width: transform.width,
                height: transform.height,
                transform: `translate(${transform.x}px, ${transform.y}px)`
            }}
            onMouseDown={handleDragStart}
        >
            <img
                ref={imageRef}
                src={src}
                alt={alt}
                className="w-full h-full object-contain pointer-events-none"
            />

            {/* Drag Handle Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Move className="text-lime-400" size={24} />
            </div>

            {/* Resize Handle (bottom-right corner) */}
            <div
                className="
                    absolute -bottom-2 -right-2 w-6 h-6
                    bg-lime-500 rounded-full cursor-se-resize
                    flex items-center justify-center
                    hover:scale-110 transition-transform
                    shadow-lg
                "
                onMouseDown={handleResizeStart}
            >
                <Maximize2 size={12} className="text-black" />
            </div>

            {/* Size indicator */}
            <div className="absolute -top-8 left-0 text-xs text-lime-400 font-mono bg-zinc-900/90 px-2 py-1 rounded">
                {Math.round(transform.width)} × {Math.round(transform.height)}
            </div>

            {/* Action buttons */}
            <div className="absolute -bottom-12 left-0 flex items-center gap-2">
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
            </div>

            {/* Sync info */}
            <div className="absolute -bottom-20 left-0 text-[10px] text-gray-500">
                Changes sync to all users within 10s
            </div>
        </div>
    );
};

export default EditableImage;
