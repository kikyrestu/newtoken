import React from 'react';
import { Mail } from 'lucide-react';

// SVG Icons for social platforms
const XIcon = () => (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

const DiscordIcon = () => (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
);

export const Footer: React.FC = () => {
    const socialLinks = [
        { name: 'X', icon: <XIcon />, href: 'https://x.com/flyUAlive' },
        { name: 'Telegram', icon: <TelegramIcon />, href: 'https://t.me/FLYUAofficial' },
        { name: 'Discord', icon: <DiscordIcon />, href: 'https://discord.gg/YKhEVKbK' },
    ];

    return (
        <footer className="relative w-full mt-auto">
            {/* Green gradient separator line */}
            <div
                className="h-px w-full"
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,65,0.08) 20%, rgba(0,255,65,0.35) 50%, rgba(0,255,65,0.08) 80%, transparent 100%)',
                }}
            />

            {/* Footer content */}
            <div className="w-full py-5 px-4"
                style={{ background: 'linear-gradient(180deg, rgba(0,255,65,0.02) 0%, transparent 100%)' }}
            >
                <div className="flex flex-col items-center gap-3">

                    {/* Social icons row */}
                    <div className="flex items-center gap-5">
                        {socialLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={link.name}
                                className="relative group text-[#00ff41]/50 hover:text-[#00ff41] transition-all duration-300"
                            >
                                {/* Glow background on hover */}
                                <span className="absolute inset-0 -m-2 rounded-full bg-[#00ff41]/0 group-hover:bg-[#00ff41]/10 transition-all duration-300 scale-0 group-hover:scale-100" />
                                <span className="relative z-10 block group-hover:drop-shadow-[0_0_8px_rgba(0,255,65,0.6)] transition-all duration-300 group-hover:scale-110">
                                    {link.icon}
                                </span>
                            </a>
                        ))}
                    </div>

                    {/* Email + Copyright row */}
                    <div className="flex items-center gap-3 text-[11px] tracking-wider font-mono">
                        <a
                            href="mailto:info@flyua.live"
                            className="text-[#00ff41]/35 hover:text-[#00ff41]/80 transition-all duration-300 flex items-center gap-1.5"
                        >
                            <Mail className="w-3 h-3" />
                            <span>info@flyua.live</span>
                        </a>

                        <span className="text-[#00ff41]/20">·</span>

                        <p className="text-[#00ff41]/30 tracking-widest">
                            &copy; FLYUA 2026
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
