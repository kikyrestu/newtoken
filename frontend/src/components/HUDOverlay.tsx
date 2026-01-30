import React from 'react';

export const HUDOverlay: React.FC = () => {
    return (
        <div className="hud-layer" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 }}>
            {/* Top Left Corner */}
            <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                    <path d="M0 20 V0 H20" stroke="#00ff41" strokeWidth="2" />
                    <rect x="5" y="5" width="5" height="5" fill="#00ff41" className="blink" />
                </svg>
            </div>

            {/* Top Right Corner */}
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                    <path d="M100 20 V0 H80" stroke="#00ff41" strokeWidth="2" />
                </svg>
            </div>

            {/* Bottom Left Corner */}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                    <path d="M0 80 V100 H20" stroke="#00ff41" strokeWidth="2" />
                </svg>
            </div>

            {/* Bottom Right Corner */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                    <path d="M100 80 V100 H80" stroke="#00ff41" strokeWidth="2" />
                    <rect x="90" y="90" width="5" height="5" fill="#00ff41" className="blink" />
                </svg>
            </div>

            {/* Scanning Line */}
            <div className="scan-line"></div>

            {/* Grid Pattern Overlay */}
            <div className="grid-overlay"></div>
        </div>
    );
};
