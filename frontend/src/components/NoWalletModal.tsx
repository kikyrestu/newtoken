import React, { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Download, ExternalLink, Wallet, Globe, AlertTriangle, RefreshCw, MousePointer, CheckCircle } from 'lucide-react';

interface NoWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * No Wallet Modal - Auto-detects device type and shows relevant tutorial
 * z-index [900] to ensure it appears above timer and all other elements
 */
export const NoWalletModal: React.FC<NoWalletModalProps> = ({ isOpen, onClose }) => {
    const [isMobile, setIsMobile] = useState(false);

    // Detect device type on mount
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'mobile', 'tablet'];
            const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword)) || window.innerWidth < 768;
            setIsMobile(isMobileDevice);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isOpen) return null;

    // Get current site URL for deep links (works in production and dev)
    const siteUrl = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://flyua.live';

    const encodedUrl = encodeURIComponent(siteUrl);

    const walletOptions = [
        {
            name: 'Phantom',
            url: 'https://phantom.app/',
            chromeUrl: 'https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa',
            // Phantom deep link format - opens in-app browser
            deepLink: `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedUrl}`
        },
        {
            name: 'Solflare',
            url: 'https://solflare.com/',
            chromeUrl: 'https://chrome.google.com/webstore/detail/solflare-wallet/bhhhlbepdkbapadjdnnojkbgioiodbic',
            // Solflare deep link format
            deepLink: `https://solflare.com/ul/v1/browse/${encodedUrl}`
        }
    ];

    return (
        <div
            className="fixed inset-0 z-[900] flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop - solid black to prevent timer bleed-through */}
            <div className="absolute inset-0 bg-black backdrop-blur-md" />

            {/* Modal Content */}
            <div
                className="relative w-full max-w-lg bg-[#0d1117] border border-[#00ff41]/30 rounded-lg overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-[#0d1117] p-4 border-b border-[#00ff41]/20 z-10">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00ff41]/10 rounded-full">
                            <Wallet className="w-5 h-5 text-[#00ff41]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Connect Wallet</h2>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                {isMobile ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                                {isMobile ? 'Mobile' : 'Desktop'} detected
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">

                    {/* ===== ALREADY HAVE WALLET SECTION ===== */}
                    <div className="p-4 bg-[#00ff41]/5 border border-[#00ff41]/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-[#00ff41]" />
                            <p className="text-[#00ff41] font-bold">Already have a wallet?</p>
                        </div>

                        {isMobile ? (
                            <>
                                <p className="text-sm text-gray-300 mb-3">
                                    Open this website from inside your wallet app's browser:
                                </p>
                                <div className="flex gap-2">
                                    {walletOptions.map(w => (
                                        <button
                                            key={w.name}
                                            onClick={() => { window.location.href = w.deepLink; }}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#00ff41] hover:bg-[#00cc33] text-black font-bold text-sm rounded-lg transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Open {w.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-300 mb-3">
                                    Make sure your wallet extension is installed, then refresh this page.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#00ff41] hover:bg-[#00cc33] text-black font-bold text-sm rounded-lg transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh Page
                                </button>
                            </>
                        )}
                    </div>

                    {/* ===== DIVIDER ===== */}
                    <div className="flex items-center gap-3 text-gray-500">
                        <div className="flex-1 h-px bg-gray-700" />
                        <span className="text-xs uppercase">or install a wallet</span>
                        <div className="flex-1 h-px bg-gray-700" />
                    </div>

                    {/* ===== TUTORIAL SECTION (Auto-detected) ===== */}
                    {isMobile ? (
                        /* ===== MOBILE TUTORIAL ===== */
                        <div className="space-y-4">
                            {/* Step 1 */}
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ff41] text-black flex items-center justify-center text-sm font-bold">1</div>
                                <div>
                                    <p className="text-white font-medium">Download Wallet App</p>
                                    <p className="text-xs text-gray-400 mt-1">Choose one:</p>
                                    <div className="flex gap-2 mt-2">
                                        {walletOptions.map(w => (
                                            <button
                                                key={w.name}
                                                onClick={() => window.open(w.url, '_blank')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                                            >
                                                <Wallet className="w-3 h-3 text-[#00ff41]" />
                                                <span className="text-white">{w.name}</span>
                                                <Download className="w-3 h-3 text-[#00ff41]" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ff41] text-black flex items-center justify-center text-sm font-bold">2</div>
                                <div>
                                    <p className="text-white font-medium">Create New Wallet</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Open app → "Create New Wallet" → Save your <span className="text-yellow-400">seed phrase</span> securely
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 - IMPORTANT */}
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-yellow-500 text-black flex items-center justify-center text-sm font-bold">3</div>
                                <div>
                                    <div className="flex items-center gap-2 text-yellow-400 font-bold">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Open Website from App</span>
                                    </div>
                                    <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <Globe className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                            <div className="text-xs text-yellow-200">
                                                <p className="font-bold">Don't use your regular browser!</p>
                                                <p className="mt-1">Open wallet app → Tap <strong>Browser</strong> icon → Go to <strong>flyua.live</strong></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ff41] text-black flex items-center justify-center text-sm font-bold">4</div>
                                <div>
                                    <p className="text-white font-medium">Click "Connect"</p>
                                    <p className="text-xs text-gray-400 mt-1">Wallet will be auto-detected inside the app browser</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ===== DESKTOP TUTORIAL ===== */
                        <div className="space-y-4">
                            {/* Step 1 */}
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ff41] text-black flex items-center justify-center text-sm font-bold">1</div>
                                <div>
                                    <p className="text-white font-medium">Install Browser Extension</p>
                                    <p className="text-xs text-gray-400 mt-1">Click to install:</p>
                                    <div className="flex flex-col gap-2 mt-2">
                                        {walletOptions.map(w => (
                                            <button
                                                key={w.name}
                                                onClick={() => window.open(w.chromeUrl, '_blank')}
                                                className="flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Wallet className="w-4 h-4 text-[#00ff41]" />
                                                    <span className="text-white">{w.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[#00ff41]">
                                                    <span className="text-xs">Chrome Web Store</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ff41] text-black flex items-center justify-center text-sm font-bold">2</div>
                                <div>
                                    <p className="text-white font-medium">Create New Wallet</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Click extension icon → "Create New Wallet" → Save your <span className="text-yellow-400">seed phrase</span>
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ff41] text-black flex items-center justify-center text-sm font-bold">3</div>
                                <div className="flex items-start gap-2">
                                    <div>
                                        <p className="text-white font-medium">Refresh This Page</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Press Ctrl+R (Windows) or Cmd+R (Mac)
                                        </p>
                                    </div>
                                    <RefreshCw className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00ff41] text-black flex items-center justify-center text-sm font-bold">4</div>
                                <div className="flex items-start gap-2">
                                    <div>
                                        <p className="text-white font-medium">Click "Connect"</p>
                                        <p className="text-xs text-gray-400 mt-1">Extension will popup to approve</p>
                                    </div>
                                    <MousePointer className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 p-4 bg-[#0d1117] border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoWalletModal;
