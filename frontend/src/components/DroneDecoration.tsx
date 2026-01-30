import React from 'react';

// Web3 "Cyber-Drone" SVG Component
const CyberDrone = ({ scale = 1, color = "#00ff41", delay = "0s", duration = "3s" }) => (
    <div
        className="drone-unit"
        style={{
            width: `${120 * scale}px`,
            filter: `drop-shadow(0 0 8px ${color})`,
            animationDuration: duration,
            animationDelay: delay
        }}
    >
        <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Energy Core */}
            <circle cx="100" cy="50" r="15" fill={color} opacity="0.8" className="pulse-core" />

            {/* Main Body Frame */}
            <path d="M70 50 L130 50 L140 40 L60 40 Z" fill="#1a1a1a" stroke={color} strokeWidth="2" />
            <path d="M90 50 L110 50 L100 70 Z" fill="#1a1a1a" stroke={color} strokeWidth="1" />

            {/* Rotors (Holographic Spin) */}
            <ellipse cx="40" cy="40" rx="35" ry="5" stroke={color} strokeWidth="1" opacity="0.6" className="rotor-spin" />
            <ellipse cx="160" cy="40" rx="35" ry="5" stroke={color} strokeWidth="1" opacity="0.6" className="rotor-spin" />

            {/* Scan Laser Beam */}
            <path d="M100 70 L80 150 L120 150 Z" fill={`url(#scanGradient-${color})`} opacity="0.3" className="scanner-beam" />

            {/* Tech Detailing */}
            <rect x="95" y="45" width="10" height="2" fill="white" />
            <text x="145" y="45" fill={color} fontSize="10" fontFamily="monospace">MK-{Math.floor(Math.random() * 99)}</text>

            <defs>
                <linearGradient id={`scanGradient-${color}`} x1="100" y1="70" x2="100" y2="150" gradientUnits="userSpaceOnUse">
                    <stop stopColor={color} stopOpacity="0.5" />
                    <stop offset="1" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    </div>
);

export const DroneDecoration: React.FC = () => {
    return (
        <div className="drone-layer drone-bg" style={{ pointerEvents: 'none', overflow: 'hidden' }}>
            {/* Atmospheric Fog */}
            <div className="fog-layer"></div>

            {/* SQUAD LEADER (Center, Large) */}
            <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
                <CyberDrone scale={1.5} color="#00ff41" duration="4s" />
            </div>

            {/* FLANKER LEFT (Aggressive Red) */}
            <div style={{ position: 'absolute', top: '25%', left: '15%', zIndex: 1 }}>
                <CyberDrone scale={0.8} color="#ff3333" delay="1s" duration="3.5s" />
            </div>

            {/* FLANKER RIGHT (Aggressive Red) */}
            <div style={{ position: 'absolute', top: '25%', right: '15%', zIndex: 1 }}>
                <CyberDrone scale={0.8} color="#ff3333" delay="1.5s" duration="3.8s" />
            </div>

            {/* SCOUT TOP (Neon Cyan) */}
            <div style={{ position: 'absolute', top: '8%', right: '25%', zIndex: 0, opacity: 0.7 }}>
                <CyberDrone scale={0.6} color="#00e5ff" delay="0.5s" duration="5s" />
            </div>

            {/* PATROL BOTTOM LEFT */}
            <div style={{ position: 'absolute', bottom: '20%', left: '5%', zIndex: 0, opacity: 0.6 }}>
                <CyberDrone scale={0.7} color="#00ff41" delay="2s" duration="6s" />
            </div>

        </div>
    );
};
