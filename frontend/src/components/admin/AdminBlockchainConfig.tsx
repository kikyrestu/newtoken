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
    CheckCircle
} from 'lucide-react';

export default function AdminBlockchainConfig() {
    const { config: savedConfig, saveConfig, resetConfig, loading, isConfigured } = useBlockchainConfig();
    const [config, setConfig] = useState<BlockchainConfig>(savedConfig);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

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

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading configuration...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-300">Blockchain Configuration</h2>
                    <p className="text-sm text-gray-500">Configure token, program, and network settings for production</p>
                </div>
                <div className="flex items-center gap-2">
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
                        <span className="text-sm opacity-70">- Token mint and Program ID required</span>
                    </>
                )}
            </div>

            {/* Config Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Network Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-[#00ff41]" />
                        <h3 className="font-semibold text-white">Network</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Solana Network</label>
                            <select
                                value={config.network}
                                onChange={(e) => handleChange('network', e.target.value)}
                                className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white focus:outline-none focus:border-[#00ff41]/50"
                            >
                                <option value="devnet">Devnet (Testing)</option>
                                <option value="mainnet-beta">Mainnet-Beta (Production)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1">RPC URL</label>
                            <input
                                type="text"
                                value={config.rpc_url}
                                onChange={(e) => handleChange('rpc_url', e.target.value)}
                                placeholder="https://api.mainnet-beta.solana.com"
                                className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00ff41]/50"
                            />
                            <p className="text-xs text-gray-600 mt-1">Use Helius, QuickNode, or Triton for production</p>
                        </div>
                    </div>
                </div>

                {/* Token Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-[#00ff41]" />
                        <h3 className="font-semibold text-white">Token</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Token Mint Address *</label>
                            <input
                                type="text"
                                value={config.token_mint}
                                onChange={(e) => handleChange('token_mint', e.target.value)}
                                placeholder="TokenMintAddress123..."
                                className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00ff41]/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Symbol</label>
                                <input
                                    type="text"
                                    value={config.token_symbol}
                                    onChange={(e) => handleChange('token_symbol', e.target.value)}
                                    placeholder="TOKE"
                                    className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white focus:outline-none focus:border-[#00ff41]/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Decimals</label>
                                <input
                                    type="number"
                                    value={config.token_decimals}
                                    onChange={(e) => handleChange('token_decimals', parseInt(e.target.value) || 6)}
                                    className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white focus:outline-none focus:border-[#00ff41]/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Program Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Code className="w-5 h-5 text-[#00ff41]" />
                        <h3 className="font-semibold text-white">Smart Contract</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Program ID *</label>
                            <input
                                type="text"
                                value={config.program_id}
                                onChange={(e) => handleChange('program_id', e.target.value)}
                                placeholder="ProgramId123..."
                                className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00ff41]/50"
                            />
                            <p className="text-xs text-gray-600 mt-1">Deployed mission_lock program address</p>
                        </div>
                    </div>
                </div>

                {/* Wallets Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Wallet className="w-5 h-5 text-[#00ff41]" />
                        <h3 className="font-semibold text-white">Wallets</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Treasury Wallet</label>
                            <input
                                type="text"
                                value={config.treasury_wallet}
                                onChange={(e) => handleChange('treasury_wallet', e.target.value)}
                                placeholder="TreasuryWallet123..."
                                className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00ff41]/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Authority Wallet</label>
                            <input
                                type="text"
                                value={config.authority_wallet}
                                onChange={(e) => handleChange('authority_wallet', e.target.value)}
                                placeholder="AuthorityWallet123..."
                                className="w-full px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#00ff41]/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Price Oracle Section */}
                <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl p-5 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-[#00ff41]" />
                        <h3 className="font-semibold text-white">Price Oracle</h3>
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

            {/* Quick Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
                <strong>Note:</strong> After saving, the new configuration will be applied automatically.
                No restart required. For smart contract deployment, use Anchor CLI separately.
            </div>
        </div>
    );
}
