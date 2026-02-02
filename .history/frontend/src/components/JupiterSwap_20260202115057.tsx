import React, { useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface JupiterTerminalConfig {
    displayMode: 'integrated' | 'modal' | 'widget';
    integratedTargetId?: string;
    endpoint: string;
    formProps?: {
        initialInputMint?: string;
        initialOutputMint?: string;
        fixedInputMint?: boolean;
        fixedOutputMint?: boolean;
        initialAmount?: string;
        swapMode?: 'ExactIn' | 'ExactOut';
    };
    containerStyles?: React.CSSProperties;
    passThroughWallet?: any;
    onSuccess?: (txid: string) => void;
    onSwapError?: (error: any) => void;
}

declare global {
    interface Window {
        Jupiter?: {
            init: (config: JupiterTerminalConfig) => void;
            resume: () => void;
            close: () => void;
        };
    }
}

interface JupiterSwapProps {
    /**
     * Your token's mint address (output token)
     */
    outputMint: string;

    /**
     * Optional input mint (e.g., USDC, SOL)
     */
    inputMint?: string;

    /**
     * Lock output to your token only
     */
    fixedOutput?: boolean;

    /**
     * Callback when swap is successful
     */
    onSuccess?: (txid: string) => void;

    /**
     * Callback when swap fails
     */
    onError?: (error: any) => void;

    /**
     * Container height
     */
    height?: string;

    /**
     * Custom styling
     */
    className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Default input mints
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
// SOL_MINT available if needed: So11111111111111111111111111111111111111112

// Jupiter Terminal script URL
const JUPITER_TERMINAL_SCRIPT = 'https://terminal.jup.ag/main-v2.js';
const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

// ============================================================================
// COMPONENT
// ============================================================================

export const JupiterSwap: React.FC<JupiterSwapProps> = ({
    outputMint,
    inputMint = USDC_MINT,
    fixedOutput = true,
    onSuccess,
    onError,
    height = '500px',
    className = ''
}) => {
    const wallet = useWallet();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // ========================================================================
    // Load Jupiter Terminal Script
    // ========================================================================

    useEffect(() => {
        // Check if already loaded
        if (window.Jupiter) {
            setIsLoaded(true);
            return;
        }

        // Check if script is already in DOM
        const existingScript = document.querySelector(`script[src="${JUPITER_TERMINAL_SCRIPT}"]`);
        if (existingScript) {
            existingScript.addEventListener('load', () => setIsLoaded(true));
            return;
        }

        // Load script
        const script = document.createElement('script');
        script.src = JUPITER_TERMINAL_SCRIPT;
        script.async = true;

        script.onload = () => {
            console.log('Jupiter Terminal loaded');
            setIsLoaded(true);
        };

        script.onerror = () => {
            console.error('Failed to load Jupiter Terminal');
            setError('Failed to load swap widget');
        };

        document.head.appendChild(script);

        return () => {
            // Cleanup not needed - script should persist
        };
    }, []);

    // ========================================================================
    // Initialize Jupiter Terminal
    // ========================================================================

    useEffect(() => {
        if (!isLoaded || !window.Jupiter || isInitialized) {
            return;
        }

        // Small delay to ensure DOM is ready
        const initTimeout = setTimeout(() => {
            try {
                window.Jupiter!.init({
                    displayMode: 'integrated',
                    integratedTargetId: 'jupiter-terminal-container',
                    endpoint: RPC_ENDPOINT,

                    formProps: {
                        initialInputMint: inputMint,
                        initialOutputMint: outputMint,
                        fixedOutputMint: fixedOutput,
                        swapMode: 'ExactIn'
                    },

                    containerStyles: {
                        maxHeight: height,
                        borderRadius: '12px',
                    },

                    passThroughWallet: wallet,

                    onSuccess: (txid: string) => {
                        console.log('Swap successful:', txid);
                        onSuccess?.(txid);
                    },

                    onSwapError: (err: any) => {
                        console.error('Swap error:', err);
                        onError?.(err);
                    }
                });

                setIsInitialized(true);
                console.log('Jupiter Terminal initialized');
            } catch (err) {
                console.error('Failed to initialize Jupiter:', err);
                setError('Failed to initialize swap widget');
            }
        }, 500);

        return () => clearTimeout(initTimeout);
    }, [isLoaded, isInitialized, inputMint, outputMint, fixedOutput, wallet, onSuccess, onError, height]);

    // ========================================================================
    // Render
    // ========================================================================

    if (error) {
        return (
            <div className={`jupiter-swap-error ${className}`}>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <a
                        href={`https://jup.ag/swap/${inputMint}-${outputMint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-2 bg-[#4fffa0] text-black font-bold rounded-lg hover:bg-[#3dd988] transition-colors"
                    >
                        Open Jupiter ↗
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={`jupiter-swap-container ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#4fffa0] font-bold text-lg flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4l-8 8h5v8h6v-8h5z" />
                    </svg>
                    Swap to Mission Tokens
                </h3>

                <a
                    href={`https://jup.ag/swap/${inputMint}-${outputMint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#4fffa0]/50 hover:text-[#4fffa0] transition-colors"
                >
                    Open in Jupiter ↗
                </a>
            </div>

            {/* Loading State */}
            {!isLoaded && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin h-8 w-8 text-[#4fffa0]" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm text-gray-400">Loading swap widget...</span>
                    </div>
                </div>
            )}

            {/* Jupiter Terminal Container */}
            <div
                id="jupiter-terminal-container"
                ref={containerRef}
                className="rounded-xl overflow-hidden border border-[#4fffa0]/20 bg-[#0a0c10]"
                style={{
                    minHeight: isLoaded ? height : '0',
                    display: isLoaded ? 'block' : 'none'
                }}
            />

            {/* Info */}
            <div className="mt-4 text-xs text-gray-500 text-center">
                Powered by Jupiter Aggregator • Best rates across Solana DEXes
            </div>
        </div>
    );
};

// ============================================================================
// MODAL VERSION
// ============================================================================

interface JupiterSwapModalProps extends JupiterSwapProps {
    isOpen: boolean;
    onClose: () => void;
}

export const JupiterSwapModal: React.FC<JupiterSwapModalProps> = ({
    isOpen,
    onClose,
    ...props
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg bg-[#0a0c10] border border-[#4fffa0]/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(79,255,160,0.1)]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <JupiterSwap {...props} height="450px" />
            </div>
        </div>
    );
};

export default JupiterSwap;
