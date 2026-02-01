import { useEffect, useState } from 'react';
import { useBlockchainConfig, type BlockchainConfig } from '../../hooks/useBlockchainConfig';
import {
    Save,
    RotateCcw,
    Check,
    Wallet,
    Globe,
    Coins,
    Code,
    AlertTriangle,
    CheckCircle,
    HelpCircle,
    Info,
    BookOpen,
    Shield,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Copy
} from 'lucide-react';

// Tooltip component for inline explanations
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-flex items-center">
            {children}
            <button
                type="button"
                className="ml-1 text-gray-500 hover:text-[#00ff41] transition-colors"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                onClick={() => setShow(!show)}
            >
                <HelpCircle className="w-4 h-4" />
            </button>
            {show && (
                <div className="absolute z-50 left-full ml-2 w-72 p-3 bg-black/95 border border-[#00ff41]/30 rounded-lg text-sm text-gray-300 shadow-xl">
                    <div className="absolute left-0 top-3 -translate-x-1 w-2 h-2 bg-black border-l border-b border-[#00ff41]/30 rotate-45" />
                    {content}
                </div>
            )}
        </div>
    );
}

// Collapsible guide section
function GuideSection({ title, icon, children, defaultOpen = false }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#00ff41]/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#00ff41]/10 rounded-lg text-[#00ff41]">{icon}</div>
                    <span className="font-semibold text-white">{title}</span>
                </div>
                {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {open && (
                <div className="p-4 pt-0 border-t border-[#00ff41]/10">
                    {children}
                </div>
            )}
        </div>
    );
}

// Copy button
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="p-1 hover:bg-[#00ff41]/20 rounded transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-500" />}
        </button>
    );
}

export default function AdminBlockchainConfig() {
    const { config: savedConfig, saveConfig, resetConfig, loading, isConfigured } = useBlockchainConfig();
    const [config, setConfig] = useState<BlockchainConfig>(savedConfig);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [lockMode, setLockMode] = useState<'transfer' | 'program'>('transfer');

    // Sync with saved config
    useEffect(() => {
        setConfig(savedConfig);
        // Detect mode based on program_id
        const isTransferMode = !savedConfig.program_id ||
            savedConfig.program_id === '11111111111111111111111111111111' ||
            savedConfig.program_id.length < 32;
        setLockMode(isTransferMode ? 'transfer' : 'program');
    }, [savedConfig]);

    const handleChange = (field: keyof BlockchainConfig, value: string | number) => {
        setConfig(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleModeChange = (mode: 'transfer' | 'program') => {
        setLockMode(mode);
        if (mode === 'transfer') {
            // Clear program_id for transfer mode
            handleChange('program_id', '11111111111111111111111111111111');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const success = await saveConfig(config);
        if (success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        setSaving(false);
    };

    const handleReset = () => {
        resetConfig();
        setConfig(savedConfig);
        setSaved(false);
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading configuration...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-300">🔧 Token Configuration</h2>
                    <p className="text-sm text-gray-500">Configure your token, network, and lock mechanism</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${showGuide
                                ? 'bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30'
                                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        {showGuide ? 'Hide Guide' : 'Show Guide'}
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-[#00ff41] text-black font-medium rounded-lg hover:bg-[#00cc33] disabled:opacity-50 transition-colors"
                    >
                        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Config'}
                    </button>
                </div>
            </div>

            {/* Tutorial Guide Section */}
            {showGuide && (
                <div className="space-y-4 animate-fadeIn">
                    <div className="bg-gradient-to-r from-[#00ff41]/10 to-transparent border border-[#00ff41]/20 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-[#00ff41] mb-3 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            📚 Tutorial: Cara Konfigurasi Token
                        </h3>
                        <p className="text-gray-300 text-sm mb-4">
                            Halaman ini digunakan untuk mengkonfigurasi token yang akan digunakan dalam sistem lock.
                            Ikuti panduan di bawah ini untuk memahami setiap field.
                        </p>
                    </div>

                    <GuideSection title="1️⃣ Apa itu Lock Mode?" icon={<Shield className="w-5 h-5" />} defaultOpen>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="font-semibold text-blue-400 mb-2">📦 Transfer Mode (Recommended for Beginners)</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-400">
                                    <li>Token ditransfer ke <strong>Treasury Wallet</strong> saat user lock</li>
                                    <li>Saat unlock, <strong>admin harus manual transfer balik</strong> ke user</li>
                                    <li>Tidak perlu deploy custom Solana program</li>
                                    <li>Cocok untuk testing dan launch awal</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                <p className="font-semibold text-purple-400 mb-2">🔐 Program Mode (Advanced)</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-400">
                                    <li>Token disimpan di <strong>Escrow PDA</strong> on-chain</li>
                                    <li>User bisa <strong>unlock otomatis</strong> setelah timer expired</li>
                                    <li>Memerlukan custom Solana program (Anchor)</li>
                                    <li>Butuh Program ID dan deploy ke blockchain</li>
                                </ul>
                            </div>
                        </div>
                    </GuideSection>

                    <GuideSection title="2️⃣ Cara Mendapatkan Token Mint Address" icon={<Coins className="w-5 h-5" />}>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <p><strong>Token Mint Address</strong> adalah alamat unik token di Solana blockchain.</p>
                            <div className="p-3 bg-black/50 rounded-lg font-mono text-xs">
                                <p className="text-gray-500 mb-1"># Contoh Token Mint Address:</p>
                                <p className="text-[#00ff41]">7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr</p>
                            </div>
                            <p className="text-gray-400">Cara mendapatkan:</p>
                            <ol className="list-decimal list-inside space-y-1 text-gray-400">
                                <li>Buka <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="text-[#00ff41] hover:underline">Solscan.io</a></li>
                                <li>Cari nama token Anda</li>
                                <li>Copy alamat "Token Address"</li>
                                <li>Pastikan ini adalah SPL Token (bukan SOL)</li>
                            </ol>
                        </div>
                    </GuideSection>

                    <GuideSection title="3️⃣ Apa itu Treasury Wallet?" icon={<Wallet className="w-5 h-5" />}>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <p><strong>Treasury Wallet</strong> adalah wallet yang menerima token saat user melakukan lock.</p>
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300">
                                <p className="font-semibold">⚠️ Penting:</p>
                                <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                                    <li>Pastikan wallet ini <strong>memiliki Token Account</strong> untuk token Anda</li>
                                    <li>Simpan private key dengan aman - diperlukan untuk unlock</li>
                                    <li>Jangan gunakan wallet personal, buat wallet khusus treasury</li>
                                </ul>
                            </div>
                        </div>
                    </GuideSection>

                    <GuideSection title="4️⃣ Kapan Perlu Program ID?" icon={<Code className="w-5 h-5" />}>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <p><strong>Program ID</strong> hanya diperlukan jika Anda menggunakan <strong>Program Mode</strong>.</p>
                            <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                                <p className="text-gray-400">Jika menggunakan <strong>Transfer Mode</strong>:</p>
                                <p className="font-mono text-sm mt-1 text-gray-500">Biarkan default: 11111111111111111111111111111111</p>
                            </div>
                            <p className="text-gray-400 mt-2">
                                Program ID didapat setelah deploy Anchor program ke Solana.
                                Jika Anda tidak tahu apa itu, gunakan Transfer Mode.
                            </p>
                        </div>
                    </GuideSection>

                    <GuideSection title="5️⃣ Tentang RPC URL" icon={<Globe className="w-5 h-5" />}>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <p><strong>RPC URL</strong> adalah endpoint untuk berkomunikasi dengan Solana blockchain.</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 bg-black/50 rounded-lg">
                                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">DEVNET</span>
                                    <code className="text-xs text-gray-400">https://api.devnet.solana.com</code>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-black/50 rounded-lg">
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">MAINNET</span>
                                    <code className="text-xs text-gray-400">https://api.mainnet-beta.solana.com</code>
                                </div>
                            </div>
                            <p className="text-gray-400 mt-2">
                                Untuk production, gunakan RPC provider seperti:
                                <a href="https://www.helius.dev" target="_blank" className="text-[#00ff41] hover:underline ml-1">Helius</a>,
                                <a href="https://www.quicknode.com" target="_blank" className="text-[#00ff41] hover:underline ml-1">QuickNode</a>, atau
                                <a href="https://triton.one" target="_blank" className="text-[#00ff41] hover:underline ml-1">Triton</a>
                            </p>
                        </div>
                    </GuideSection>
                </div>
            )}

            {/* Status Banner */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${isConfigured
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                }`}>
                {isConfigured ? (
                    <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Configuration Complete</span>
                        <span className="text-sm opacity-70">- Ready for {config.network}</span>
                    </>
                ) : (
                    <>
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Configuration Incomplete</span>
                        <span className="text-sm opacity-70">- Token mint and Treasury required</span>
                    </>
                )}
            </div>

            {/* Lock Mode Selector */}
            <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-[#00ff41]" />
                    <Tooltip content="Pilih bagaimana token akan di-lock. Transfer Mode untuk sederhana, Program Mode untuk otomatis unlock.">
                        <h3 className="font-semibold text-white">Lock Mode</h3>
                    </Tooltip>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleModeChange('transfer')}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${lockMode === 'transfer'
                                ? 'border-[#00ff41] bg-[#00ff41]/10'
                                : 'border-gray-700 hover:border-gray-600 bg-black/30'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${lockMode === 'transfer' ? 'bg-[#00ff41]' : 'bg-gray-600'}`} />
                            <span className={`font-semibold ${lockMode === 'transfer' ? 'text-[#00ff41]' : 'text-gray-400'}`}>
                                📦 Transfer Mode
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Token ditransfer ke Treasury. Unlock manual oleh admin.
                        </p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                            Recommended
                        </span>
                    </button>

                    <button
                        onClick={() => handleModeChange('program')}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${lockMode === 'program'
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-gray-700 hover:border-gray-600 bg-black/30'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${lockMode === 'program' ? 'bg-purple-500' : 'bg-gray-600'}`} />
                            <span className={`font-semibold ${lockMode === 'program' ? 'text-purple-400' : 'text-gray-400'}`}>
                                🔐 Program Mode
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Token di escrow on-chain. User unlock otomatis.
                        </p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                            Advanced
                        </span>
                    </button>
                </div>
            </div>

            {/* Config Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Network Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-[#00ff41]" />
                        <Tooltip content="Pilih jaringan Solana. Gunakan Devnet untuk testing, Mainnet untuk production.">
                            <h3 className="font-semibold text-white">Network</h3>
                        </Tooltip>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Solana Network</label>
                            <select
                                value={config.network}
                                onChange={(e) => handleChange('network', e.target.value)}
                                className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white focus:outline-none focus:border-[#00ff41]/50"
                            >
                                <option value="devnet">🧪 Devnet (Testing)</option>
                                <option value="mainnet-beta">🚀 Mainnet-Beta (Production)</option>
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center text-xs text-gray-500 mb-1">
                                RPC URL
                                <Tooltip content="Endpoint untuk connect ke Solana. Default sudah bisa jalan, tapi untuk production gunakan Helius/QuickNode untuk performa lebih baik.">
                                    <span />
                                </Tooltip>
                            </label>
                            <input
                                type="text"
                                value={config.rpc_url}
                                onChange={(e) => handleChange('rpc_url', e.target.value)}
                                placeholder="https://api.mainnet-beta.solana.com"
                                className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00ff41]/50"
                            />
                            <p className="text-xs text-gray-600 mt-1">Untuk production: Helius, QuickNode, atau Triton</p>
                        </div>
                    </div>
                </div>

                {/* Token Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-[#00ff41]" />
                        <Tooltip content="Konfigurasi token SPL yang akan di-lock. Token mint address didapat dari Solscan.io">
                            <h3 className="font-semibold text-white">Token</h3>
                        </Tooltip>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center text-xs text-gray-500 mb-1">
                                Token Mint Address *
                                <Tooltip content="Alamat SPL token di Solana. Dapatkan dari Solscan.io dengan mencari nama token Anda. Contoh: 7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr">
                                    <span />
                                </Tooltip>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={config.token_mint}
                                    onChange={(e) => handleChange('token_mint', e.target.value)}
                                    placeholder="TokenMintAddress123..."
                                    className="flex-1 px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00ff41]/50"
                                />
                                {config.token_mint && (
                                    <a
                                        href={`https://solscan.io/token/${config.token_mint}${config.network === 'devnet' ? '?cluster=devnet' : ''}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2 bg-[#00ff41]/10 text-[#00ff41] rounded-lg hover:bg-[#00ff41]/20 transition-colors"
                                        title="View on Solscan"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="flex items-center text-xs text-gray-500 mb-1">
                                    Symbol
                                    <Tooltip content="Simbol token seperti yang ditampilkan di wallet (3-5 karakter). Contoh: SOL, USDC, BONK">
                                        <span />
                                    </Tooltip>
                                </label>
                                <input
                                    type="text"
                                    value={config.token_symbol}
                                    onChange={(e) => handleChange('token_symbol', e.target.value)}
                                    placeholder="TOKE"
                                    maxLength={10}
                                    className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white focus:outline-none focus:border-[#00ff41]/50"
                                />
                            </div>
                            <div>
                                <label className="flex items-center text-xs text-gray-500 mb-1">
                                    Decimals
                                    <Tooltip content="Jumlah decimal token. Hampir semua SPL token menggunakan 9 decimals. Jika ragu, biarkan 9.">
                                        <span />
                                    </Tooltip>
                                </label>
                                <input
                                    type="number"
                                    value={config.token_decimals}
                                    onChange={(e) => handleChange('token_decimals', parseInt(e.target.value) || 9)}
                                    min={0}
                                    max={18}
                                    className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white focus:outline-none focus:border-[#00ff41]/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Program Section - Only show in Program Mode */}
                {lockMode === 'program' && (
                    <div className="bg-black/40 border border-purple-500/20 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Code className="w-5 h-5 text-purple-400" />
                            <Tooltip content="Program ID dari custom Solana program (Anchor). Diperlukan untuk Program Mode dengan escrow otomatis.">
                                <h3 className="font-semibold text-white">Smart Contract (Program Mode)</h3>
                            </Tooltip>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-300">
                                <Info className="w-4 h-4 inline mr-2" />
                                Program Mode memerlukan deploy custom Anchor program ke Solana.
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Program ID *</label>
                                <input
                                    type="text"
                                    value={config.program_id}
                                    onChange={(e) => handleChange('program_id', e.target.value)}
                                    placeholder="ProgramId123..."
                                    className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500/50"
                                />
                                <p className="text-xs text-gray-600 mt-1">Didapat setelah deploy Anchor program ke Solana</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Wallets Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Wallet className="w-5 h-5 text-[#00ff41]" />
                        <Tooltip content="Wallet untuk menerima token yang di-lock. Di Transfer Mode, semua token masuk ke Treasury Wallet.">
                            <h3 className="font-semibold text-white">Wallets</h3>
                        </Tooltip>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center text-xs text-gray-500 mb-1">
                                Treasury Wallet *
                                <Tooltip content="Wallet yang menerima token saat user lock. PENTING: Simpan private key dengan aman - diperlukan untuk unlock manual di Transfer Mode.">
                                    <span />
                                </Tooltip>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={config.treasury_wallet}
                                    onChange={(e) => handleChange('treasury_wallet', e.target.value)}
                                    placeholder="TreasuryWallet123..."
                                    className="flex-1 px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00ff41]/50"
                                />
                                {config.treasury_wallet && <CopyButton text={config.treasury_wallet} />}
                            </div>
                            <p className="text-xs text-yellow-500/80 mt-1">⚠️ Simpan private key treasury dengan aman!</p>
                        </div>

                        <div>
                            <label className="flex items-center text-xs text-gray-500 mb-1">
                                Authority Wallet
                                <Tooltip content="Wallet dengan privilege admin untuk emergency unlock. Biasanya sama dengan Treasury, tapi bisa dipisah untuk keamanan.">
                                    <span />
                                </Tooltip>
                            </label>
                            <input
                                type="text"
                                value={config.authority_wallet}
                                onChange={(e) => handleChange('authority_wallet', e.target.value)}
                                placeholder="AuthorityWallet123... (optional)"
                                className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00ff41]/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Price Oracle Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-[#00ff41]" />
                        <Tooltip content="Sumber harga token untuk kalkulasi USD value. Jupiter atau Raydium akan memberikan harga real-time dari DEX.">
                            <h3 className="font-semibold text-white">Price Oracle</h3>
                        </Tooltip>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Price Source</label>
                            <select
                                value={config.price_oracle}
                                onChange={(e) => handleChange('price_oracle', e.target.value)}
                                className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white focus:outline-none focus:border-[#00ff41]/50"
                            >
                                <option value="jupiter">Jupiter (Recommended)</option>
                                <option value="raydium">Raydium</option>
                            </select>
                            <p className="text-xs text-gray-600 mt-1">Harga otomatis dari market DEX</p>
                        </div>
                        <div className="flex items-end">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-400 w-full">
                                <strong>Auto-sync:</strong> Harga token akan otomatis diambil dari {config.price_oracle === 'jupiter' ? 'Jupiter' : 'Raydium'} DEX secara real-time.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mode-specific Info */}
            {lockMode === 'transfer' ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
                    <Info className="w-4 h-4 inline mr-2" />
                    <strong>Transfer Mode Active:</strong> Token akan ditransfer ke Treasury saat lock. Untuk unlock, admin perlu manual transfer token kembali ke user dari Treasury wallet.
                    Pastikan Anda memiliki akses ke private key Treasury.
                </div>
            ) : (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-sm text-purple-300">
                    <Info className="w-4 h-4 inline mr-2" />
                    <strong>Program Mode Active:</strong> Token disimpan di escrow PDA on-chain. User dapat claim token secara otomatis setelah timer expired melalui smart contract.
                    Pastikan Program ID sudah di-deploy dengan benar.
                </div>
            )}

            {/* Quick Summary */}
            <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-3">📋 Current Configuration Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Network</span>
                        <p className="text-white font-mono">{config.network}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Token</span>
                        <p className="text-white font-mono">{config.token_symbol || 'Not set'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Lock Mode</span>
                        <p className={`font-mono ${lockMode === 'transfer' ? 'text-blue-400' : 'text-purple-400'}`}>
                            {lockMode === 'transfer' ? '📦 Transfer' : '🔐 Program'}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Status</span>
                        <p className={isConfigured ? 'text-green-400' : 'text-yellow-400'}>
                            {isConfigured ? '✅ Ready' : '⚠️ Incomplete'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
