import React, { useMemo } from 'react';

export const LayoutRuler: React.FC = () => {
    const ticks = useMemo(() => Array.from({ length: 11 }, (_, i) => i * 10), []);

    return (
        <div
            aria-hidden="true"
            className="fixed inset-0 z-[9999] pointer-events-none"
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgba(239,68,68,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(239,68,68,0.25) 1px, transparent 1px)',
                    backgroundSize: '10% 10%',
                }}
            />

            {ticks.map((tick) => (
                <div
                    key={`x-${tick}`}
                    className="absolute top-0 text-[10px] font-mono text-red-500/80 select-none"
                    style={{
                        left: `${tick}%`,
                        transform: tick === 0 ? 'translateX(2px)' : tick === 100 ? 'translateX(-100%) translateX(-2px)' : 'translateX(-50%)',
                    }}
                >
                    {tick}%
                </div>
            ))}

            {ticks.map((tick) => (
                <div
                    key={`y-${tick}`}
                    className="absolute left-0 text-[10px] font-mono text-red-500/80 select-none"
                    style={{
                        top: `${tick}%`,
                        transform: tick === 0 ? 'translateY(2px)' : tick === 100 ? 'translateY(-100%) translateY(-2px)' : 'translateY(-50%)',
                    }}
                >
                    {tick}%
                </div>
            ))}
        </div>
    );
};

