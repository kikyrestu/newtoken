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
                            📚 Tutorial: Token Configuration
                        </h3>
                        <p className="text-gray-300 text-sm mb-4">
                            This page is used to configure the token settings for the lock system.
                            Follow the guide below to understand each field.
                        </p>
                    </div>

                    <GuideSection title="1️⃣ What is Lock Mode?" icon={<Shield className="w-5 h-5" />} defaultOpen>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="font-semibold text-blue-400 mb-2">📦 Transfer Mode (Recommended for Beginners)</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-400">
                                    <li>Tokens are transferred to <strong>Treasury Wallet</strong> when user locks</li>
                                    <li>For unlock, <strong>admin must manually transfer back</strong> to user</li>
                                    <li>No need to deploy custom Solana program</li>
                                    <li>Suitable for testing and initial launch</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                <p className="font-semibold text-purple-400 mb-2">🔐 Program Mode (Advanced)</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-400">
                                    <li>Tokens are stored in <strong>Escrow PDA</strong> on-chain</li>
                                    <li>Users can <strong>unlock automatically</strong> after timer expires</li>
                                    <li>Requires custom Solana program (Anchor)</li>
                                    <li>Needs Program ID and blockchain deployment</li>
                                </ul>
                            </div>
                        </div>
                    </GuideSection>

                    <GuideSection title="2️⃣ How to Get Token Mint Address" icon={<Coins className="w-5 h-5" />}>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <p><strong>Token Mint Address</strong> is the unique address of your token on Solana blockchain.</p>
                            <div className="p-3 bg-black/50 rounded-lg font-mono text-xs">
                                <p className="text-gray-500 mb-1"># Example Token Mint Address:</p>
                                <p className="text-[#00ff41]">7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr</p>
                            </div>
                            <p className="text-gray-400">How to get it:</p>
                            <ol className="list-decimal list-inside space-y-1 text-gray-400">
                                <li>Go to <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="text-[#00ff41] hover:underline">Solscan.io</a></li>
                                <li>Search for your token name</li>
                                <li>Copy the "Token Address"</li>
                                <li>Make sure it's an SPL Token (not SOL)</li>
                            </ol>
                        </div>
                    </GuideSection>

                    <GuideSection title="3️⃣ What is Treasury Wallet?" icon={<Wallet className="w-5 h-5" />}>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <p><strong>Treasury Wallet</strong> is the wallet that receives tokens when users lock.</p>
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300">
                                <p className="font-semibold">⚠️ Important:</p>
                                <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                                    <li>Make sure this wallet <strong>has a Token Account</strong> for your token</li>
                                    <li>Keep the private key safe - required for manual unlock</li>
                                    <li>Don't use personal wallet, create a dedicated treasury wallet</li>
                                </ul>
                            </div>
                        </div>
                    </GuideSection>

                    <GuideSection title="4️⃣ When Do I Need Program ID?" icon={<Code className="w-5 h-5" />}>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <p><strong>Program ID</strong> is only required if you're using <strong>Program Mode</strong>.</p>
                            <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                                <p className="text-gray-400">If using <strong>Transfer Mode</strong>:</p>
                                <p className="font-mono text-sm mt-1 text-gray-500">Leave default: 11111111111111111111111111111111</p>
                            </div>
                            <p className="text-gray-400 mt-2">
                                Program ID is obtained after deploying Anchor program to Solana.
                                If you don't know what this is, use Transfer Mode.
                            </p>
                        </div>
                    </GuideSection>

                    <GuideSection title="5️⃣ About RPC URL" icon={<Globe className="w-5 h-5" />}>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <p><strong>RPC URL</strong> is the endpoint to communicate with Solana blockchain.</p>
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
                                For production, use RPC providers like:
                                <a href="https://www.helius.dev" target="_blank" className="text-[#00ff41] hover:underline ml-1">Helius</a>,
                                <a href="https://www.quicknode.com" target="_blank" className="text-[#00ff41] hover:underline ml-1">QuickNode</a>, or
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
                    <Tooltip content="Choose how tokens will be locked. Transfer Mode for simple setup, Program Mode for automatic unlock.">
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
                                    <Tooltip content="Number of token decimals. Almost all SPL tokens use 9 decimals. If unsure, leave as 9.">
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
                            <Tooltip content="Program ID from custom Solana program (Anchor). Required for Program Mode with automatic escrow.">
                                <h3 className="font-semibold text-white">Smart Contract (Program Mode)</h3>
                            </Tooltip>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-300">
                                <Info className="w-4 h-4 inline mr-2" />
                                Program Mode requires deploying a custom Anchor program to Solana.
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
                                <p className="text-xs text-gray-600 mt-1">Obtained after deploying Anchor program to Solana</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Wallets Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Wallet className="w-5 h-5 text-[#00ff41]" />
                        <Tooltip content="Wallet to receive locked tokens. In Transfer Mode, all tokens go to Treasury Wallet.">
                            <h3 className="font-semibold text-white">Wallets</h3>
                        </Tooltip>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center text-xs text-gray-500 mb-1">
                                Treasury Wallet *
                                <Tooltip content="Wallet that receives tokens when user locks. IMPORTANT: Keep private key safe - required for manual unlock in Transfer Mode.">
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
                            <p className="text-xs text-yellow-500/80 mt-1">⚠️ Keep treasury private key safe!</p>
                        </div>

                        <div>
                            <label className="flex items-center text-xs text-gray-500 mb-1">
                                Authority Wallet
                                <Tooltip content="Wallet with admin privilege for emergency unlock. Usually same as Treasury, but can be separated for security.">
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
                        <Tooltip content="Token price source for USD value calculation. Jupiter or Raydium will provide real-time prices from DEX.">
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
                            <p className="text-xs text-gray-600 mt-1">Automatic pricing from DEX market</p>
                        </div>
                        <div className="flex items-end">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-400 w-full">
                                <strong>Auto-sync:</strong> Token price will be automatically fetched from {config.price_oracle === 'jupiter' ? 'Jupiter' : 'Raydium'} DEX in real-time.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mode-specific Info */}
            {lockMode === 'transfer' ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
                    <Info className="w-4 h-4 inline mr-2" />
                    <strong>Transfer Mode Active:</strong> Tokens will be transferred to Treasury when locked. For unlock, admin needs to manually transfer tokens back to user from Treasury wallet.
                    Make sure you have access to Treasury private key.
                </div>
            ) : (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-sm text-purple-300">
                    <Info className="w-4 h-4 inline mr-2" />
                    <strong>Program Mode Active:</strong> Tokens are stored in escrow PDA on-chain. Users can claim tokens automatically after timer expires via smart contract.
                    Make sure Program ID is deployed correctly.
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
