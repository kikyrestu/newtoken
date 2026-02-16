import { useEffect, useState } from 'react';
import { useBlockchainConfig, type BlockchainConfig } from '../../hooks/useBlockchainConfig';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
    Save,
    RotateCcw,
    Check,
    Globe,
    Coins,
    Code,
    AlertTriangle,
    CheckCircle,
    HelpCircle,
    Info,
    BookOpen,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Copy,
    Lock,
    LockOpen,
    Loader2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

// Encrypt button for sensitive fields
function EncryptButton({ fieldKey, hasValue, onEncrypted }: {
    fieldKey: string;
    hasValue: boolean;
    onEncrypted?: () => void;
}) {
    const { adminToken } = useAdminAuth();
    const [encrypted, setEncrypted] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // Check encryption status on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/app-settings/${fieldKey}/encrypted`, {
                    headers: { 'X-Admin-Token': adminToken || '' }
                });
                const data = await response.json();
                setEncrypted(data.encrypted ?? false);
            } catch {
                setEncrypted(false);
            } finally {
                setChecking(false);
            }
        };
        if (hasValue) checkStatus();
        else setChecking(false);
    }, [fieldKey, hasValue, adminToken]);

    const handleEncrypt = async () => {
        if (!hasValue || encrypted) return;

        if (!confirm(`Are you sure you want to encrypt the field "${fieldKey}"? The value will be encrypted in the database.`)) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/app-settings/${fieldKey}/encrypt`, {
                method: 'POST',
                headers: { 'X-Admin-Token': adminToken || '' }
            });
            const data = await response.json();
            if (data.success) {
                setEncrypted(true);
                onEncrypted?.();
            } else {
                alert(data.error || 'Failed to encrypt');
            }
        } catch (err) {
            alert('Error: failed to encrypt field');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="p-2 bg-gray-500/20 rounded-lg">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
        );
    }

    if (!hasValue) {
        return (
            <div className="p-2 bg-gray-500/10 rounded-lg cursor-not-allowed" title="Enter a value first">
                <LockOpen className="w-4 h-4 text-gray-500" />
            </div>
        );
    }

    if (encrypted) {
        return (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg" title="Encrypted">
                <Lock className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400">Encrypted</span>
            </div>
        );
    }

    return (
        <button
            onClick={handleEncrypt}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors"
            title="Click to encrypt this field"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
            ) : (
                <LockOpen className="w-4 h-4 text-yellow-400" />
            )}
            <span className="text-xs text-yellow-400">Encrypt</span>
        </button>
    );
}

/**
 * ESCROW-ONLY Admin Blockchain Configuration
 * Simplified UI for Vanja to configure smart contract settings
 */
export default function AdminBlockchainConfig() {
    const { config: savedConfig, saveConfig, resetConfig, loading, isConfigured } = useBlockchainConfig();
    const [config, setConfig] = useState<BlockchainConfig>(savedConfig);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // Sync with saved config
    useEffect(() => {
        setConfig(savedConfig);
    }, [savedConfig]);

    const handleChange = (field: keyof BlockchainConfig, value: string | number) => {
        setConfig(prev => ({ ...prev, [field]: value }));
        setSaved(false);
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

    // Check if Program ID is valid (not placeholder)
    const hasProgramId = config.program_id &&
        config.program_id !== '11111111111111111111111111111111' &&
        config.program_id.length >= 32;

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading configuration...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-300">🔧 Smart Contract Configuration</h2>
                    <p className="text-sm text-gray-500">Configure your token and escrow smart contract</p>
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
                    <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            🔐 Escrow Mode Configuration
                        </h3>
                        <p className="text-gray-300 text-sm mb-4">
                            This system uses <strong>smart contract escrow</strong> to lock tokens.
                            Users' tokens are held in a secure on-chain escrow (PDA) until the lock period ends.
                        </p>
                    </div>

                    <GuideSection title="1️⃣ How Escrow Works" icon={<Code className="w-5 h-5" />} defaultOpen>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                <p className="font-semibold text-purple-400 mb-2">🔐 Smart Contract Escrow</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-400">
                                    <li>Tokens stored in <strong>Escrow PDA</strong> on-chain (not in any wallet)</li>
                                    <li>Users can <strong>unlock automatically</strong> after timer expires</li>
                                    <li>No manual intervention needed - trustless system</li>
                                    <li>Requires Program ID from deployed Anchor contract</li>
                                </ul>
                            </div>
                        </div>
                    </GuideSection>

                    <GuideSection title="2️⃣ How to Get Token Mint Address" icon={<Coins className="w-5 h-5" />}>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <ol className="list-decimal list-inside space-y-1 text-gray-400">
                                <li>Go to <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="text-[#00ff41] hover:underline">Solscan.io</a></li>
                                <li>Search for your token name</li>
                                <li>Copy the "Token Address" (44 characters)</li>
                            </ol>
                        </div>
                    </GuideSection>

                    <GuideSection title="3️⃣ What is Program ID?" icon={<Code className="w-5 h-5" />}>
                        <div className="space-y-3 text-sm text-gray-300 mt-3">
                            <p><strong>Program ID</strong> is the address of your deployed smart contract on Solana.</p>
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300">
                                <p className="font-semibold">⚠️ Important:</p>
                                <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                                    <li>You must deploy the Anchor program first</li>
                                    <li>After deployment, you get the Program ID</li>
                                    <li>Paste the Program ID here to enable escrow</li>
                                </ul>
                            </div>
                        </div>
                    </GuideSection>
                </div>
            )}

            {/* Status Banner */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${isConfigured && hasProgramId
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                }`}>
                {isConfigured && hasProgramId ? (
                    <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Escrow Ready</span>
                        <span className="text-sm opacity-70">- Smart contract configured for {config.network}</span>
                    </>
                ) : !hasProgramId ? (
                    <>
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Program ID Required</span>
                        <span className="text-sm opacity-70">- Deploy smart contract and enter Program ID</span>
                    </>
                ) : (
                    <>
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Configuration Incomplete</span>
                        <span className="text-sm opacity-70">- Token mint required</span>
                    </>
                )}
            </div>

            {/* Config Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Network Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-[#00ff41]" />
                        <Tooltip content="Choose Solana network. Use Devnet for testing, Mainnet for production.">
                            <h3 className="font-semibold text-white">Network</h3>
                        </Tooltip>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Solana Network *</label>
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
                                RPC URL *
                                <Tooltip content="Endpoint to connect to Solana. For production, use Helius/QuickNode for better performance.">
                                    <span />
                                </Tooltip>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={config.rpc_url}
                                    onChange={(e) => handleChange('rpc_url', e.target.value)}
                                    placeholder="https://api.mainnet-beta.solana.com"
                                    className="flex-1 px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00ff41]/50"
                                />
                                <EncryptButton fieldKey="rpc_url" hasValue={!!config.rpc_url} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Token Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-[#00ff41]" />
                        <Tooltip content="Configure your SPL token. Get token mint address from Solscan.io">
                            <h3 className="font-semibold text-white">Token</h3>
                        </Tooltip>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center text-xs text-gray-500 mb-1">
                                Token Mint Address *
                                <Tooltip content="Your SPL token address on Solana (44 characters). Get it from Solscan.io">
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
                                <EncryptButton fieldKey="token_mint" hasValue={!!config.token_mint} />
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
                                    Symbol *
                                    <Tooltip content="Token symbol as displayed in wallets (3-5 characters)">
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
                                    Decimals *
                                    <Tooltip content="Token decimals. Most SPL tokens use 9. Check on Solscan if unsure.">
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

                {/* Smart Contract Section */}
                <div className="bg-black/40 border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Code className="w-5 h-5 text-purple-400" />
                        <Tooltip content="Program ID from deployed Anchor smart contract. Required for escrow to work.">
                            <h3 className="font-semibold text-white">Smart Contract (Escrow)</h3>
                        </Tooltip>
                    </div>

                    <div className="space-y-4">
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-300">
                            <Info className="w-4 h-4 inline mr-2" />
                            Escrow smart contract holds tokens securely on-chain.
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Program ID *</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={config.program_id}
                                    onChange={(e) => handleChange('program_id', e.target.value)}
                                    placeholder="Enter Program ID from deployed contract..."
                                    className="flex-1 px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500/50"
                                />
                                <EncryptButton fieldKey="program_id" hasValue={!!config.program_id} />
                                {config.program_id && <CopyButton text={config.program_id} />}
                            </div>
                            {!hasProgramId && (
                                <p className="text-xs text-yellow-500 mt-2">
                                    ⚠️ Deploy smart contract first, then paste Program ID here
                                </p>
                            )}
                            {hasProgramId && (
                                <p className="text-xs text-green-500 mt-2">
                                    ✅ Program ID configured
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Price Oracle Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-[#00ff41]" />
                        <Tooltip content="Token price source for USD calculation. Jupiter recommended.">
                            <h3 className="font-semibold text-white">Price Oracle</h3>
                        </Tooltip>
                    </div>

                    <div className="space-y-4">
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
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-400">
                            <strong>Auto-sync:</strong> Token price fetched from DEX in real-time.
                        </div>
                    </div>
                </div>
            </div>

            {/* Escrow Mode Info */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-sm text-purple-300">
                <Info className="w-4 h-4 inline mr-2" />
                <strong>Escrow Mode:</strong> Tokens are stored in on-chain escrow (PDA). Users can claim tokens automatically after lock period expires via smart contract. No manual intervention needed.
            </div>

            {/* Quick Summary */}
            <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-3">📋 Configuration Summary</h3>
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
                        <span className="text-gray-500">Program ID</span>
                        <p className={hasProgramId ? 'text-purple-400' : 'text-yellow-400'}>
                            {hasProgramId ? '🔐 Configured' : '⚠️ Required'}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Status</span>
                        <p className={isConfigured && hasProgramId ? 'text-green-400' : 'text-yellow-400'}>
                            {isConfigured && hasProgramId ? '✅ Ready' : '⚠️ Incomplete'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
