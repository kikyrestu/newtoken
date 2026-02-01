import React from 'react';

export const HUDOverlay: React.FC = () => {
    return (
        <div className="hud-layer" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {/* Grid Pattern Overlay Only - Corner brackets removed per Vanja request */}
            <div className="grid-overlay"></div>
        </div>
    );
};
