import React from 'react';

export const SideMenu: React.FC = () => {
    return (
        <div style={{ position: 'absolute', top: '50%', left: '2rem', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 30 }}>
            {/* Safety Measures Button */}
            <div className="glass-panel btn-interactive" style={{
                padding: '1.5rem',
                border: '1px solid #00ff41',
                backgroundColor: 'rgba(0, 20, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                width: '120px',
                height: '120px',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
            }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span style={{ color: '#00ff41', fontSize: '0.7rem', textAlign: 'center', fontWeight: 'bold' }}>SAFETY MEASURES</span>
            </div>

            {/* Instructions Button */}
            <div className="glass-panel btn-interactive" style={{
                padding: '1.5rem',
                border: '1px solid #00ff41',
                backgroundColor: 'rgba(0, 20, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                width: '120px',
                height: '120px',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
            }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <span style={{ color: '#00ff41', fontSize: '0.7rem', textAlign: 'center', fontWeight: 'bold' }}>INSTRUCTIONS</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
            </div>
        </div>
    );
};
