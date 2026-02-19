import React from 'react';

type ModalTab = 'safety' | 'participation' | 'about';

interface ModalNavTabsProps {
    active: ModalTab;
    onNavigate: (tab: ModalTab) => void;
}

/**
 * Shared navigation tabs for switching between Safety, Participation, and About modals
 * without needing to close the current modal first.
 */
export const ModalNavTabs: React.FC<ModalNavTabsProps> = ({ active, onNavigate }) => {
    const tabs: { key: ModalTab; label: string }[] = [
        { key: 'safety', label: 'Safety' },
        { key: 'participation', label: 'Participation' },
        { key: 'about', label: 'About' },
    ];

    return (
        <div className="flex gap-1 mb-4">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onNavigate(tab.key)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 ${active === tab.key
                            ? 'bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40'
                            : 'bg-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/10 border border-transparent'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default ModalNavTabs;
