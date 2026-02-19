import React from 'react';
import { X, Shield, Cpu, Users, Scale, Lock, Globe } from 'lucide-react';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
    isClosing?: boolean;
}

/**
 * About modal — scrollable container with platform information
 * Content provided by Vanja
 */
export const AboutModal: React.FC<AboutModalProps> = ({
    isOpen,
    onClose,
    isClosing = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="w-full max-w-xl pointer-events-auto">
            <div
                className={`relative bg-[#0a0c10]/95 border border-[#00ff41]/60 p-6 rounded-lg 
                    overflow-hidden backdrop-blur-md shadow-[0_0_40px_rgba(0,255,65,0.3)]
                    ${isClosing ? 'animate-tv-off' : 'animate-tv-on'}`}
                style={{ transformOrigin: 'center center' }}
            >
                {/* Top accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[3px] bg-[#00ff41] shadow-[0_0_15px_#00ff41] rounded-full" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors z-50 pointer-events-auto cursor-pointer"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Globe className="w-6 h-6 text-[#00ff41]" />
                    <div className="w-2 h-8 bg-[#00ff41]" />
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                        About <span className="text-[#00ff41]">FLYUA</span>
                    </h2>
                </div>

                {/* Scrollable Content */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">

                    {/* Intro */}
                    <div className="flex items-start gap-4 group">
                        <div className="flex-shrink-0 mt-1">
                            <Globe className="w-5 h-5 text-[#00ff41] opacity-70 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">Platform Overview</h4>
                            <p className="text-xs text-gray-400 leading-relaxed text-justify">
                                This platform addresses operator shortages and centralized control bottlenecks by enabling ordinary individuals to contribute to drone missions under strict automated safety controls and certified pilot supervision—while assuming zero liability—and bridges fully automated systems with human situational intelligence.
                            </p>
                        </div>
                    </div>

                    {/* Crypto Token */}
                    <div className="flex items-start gap-4 group">
                        <div className="flex-shrink-0 mt-1">
                            <Cpu className="w-5 h-5 text-[#00ff41] opacity-70 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">Crypto Token as Coordination Layer</h4>
                            <p className="text-xs text-gray-400 leading-relaxed text-justify">
                                Tokens function as a logistical and procedural layer — serving as the coordination framework that links participants, missions, and reward structures.
                            </p>
                        </div>
                    </div>

                    {/* Client Side Benefit */}
                    <div className="flex items-start gap-4 group">
                        <div className="flex-shrink-0 mt-1">
                            <Users className="w-5 h-5 text-[#00ff41] opacity-70 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">Client Side Benefit</h4>
                            <p className="text-xs text-gray-400 leading-relaxed text-justify">
                                Mission initiators receive enhanced operational support. The system provides cost efficient aid for large-scale missions, accelerating execution, expanding data collection, and improving predictive models, strategic tools, and autonomous system reliability.
                            </p>
                        </div>
                    </div>

                    {/* Mission Authorization */}
                    <div className="flex items-start gap-4 group">
                        <div className="flex-shrink-0 mt-1">
                            <Scale className="w-5 h-5 text-[#00ff41] opacity-70 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">Mission Authorization & Legitimacy</h4>
                            <p className="text-xs text-gray-400 leading-relaxed text-justify mb-2">
                                Operations are conducted by a licensed aviation operator under full regulatory authorization. All missions are supervised by certified Remote Pilots in compliance with:
                            </p>
                            <ul className="text-xs text-gray-400 space-y-1 ml-4 list-disc">
                                <li>National aviation regulations</li>
                                <li>ISO 21384 UAV operational standards</li>
                                <li>Mandatory insurance and airspace coordination protocols</li>
                            </ul>
                        </div>
                    </div>

                    {/* Technical Foundation */}
                    <div className="flex items-start gap-4 group">
                        <div className="flex-shrink-0 mt-1">
                            <Shield className="w-5 h-5 text-[#00ff41] opacity-70 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">Technical Foundation</h4>
                            <p className="text-xs text-gray-400 leading-relaxed text-justify">
                                Institution-owned fleet: all required equipment is institution-supplied and maintained; no user hardware or additional software required.
                            </p>
                        </div>
                    </div>

                    {/* Operational Security */}
                    <div className="flex items-start gap-4 group">
                        <div className="flex-shrink-0 mt-1">
                            <Lock className="w-5 h-5 text-[#00ff41] opacity-70 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">Operational Security</h4>
                            <p className="text-xs text-gray-400 leading-relaxed text-justify">
                                Any information not provided is withheld to preserve mission integrity and operational success. Transparency is balanced against responsibility, security, and strategic advantage.
                            </p>
                        </div>
                    </div>

                    {/* Initial Deployment */}
                    <div className="flex items-start gap-4 group">
                        <div className="flex-shrink-0 mt-1">
                            <Shield className="w-5 h-5 text-[#f59e0b] opacity-70 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-[#f59e0b] mb-1 uppercase tracking-wide">Initial Deployment & Phase I–II Disclosure Directive</h4>
                            <p className="text-xs text-gray-400 leading-relaxed text-justify">
                                The first two missions constitute large-scale strategic deployments; information remains classified until completion. Upon conclusion, all required documentation and data will be declassified and released in controlled, phased increments.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div >
    );
};

export default AboutModal;
