import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useStaking } from '../hooks/useStaking';
import type { StakingTier, StakeInfo } from '../hooks/useStaking';
import { Clock, Gift, Lock, ChevronRight, AlertCircle } from 'lucide-react';

// ============================================================================
// STAKING PANEL COMPONENT
// ============================================================================

export const StakingPanel: React.FC = () => {
    const { connected } = useWallet();
    const { tiers, activeStakes, summary, loading, claim } = useStaking();
    const [selectedTier, setSelectedTier] = useState<StakingTier | null>(null);
    const [claimingId, setClaimingId] = useState<number | null>(null);

    if (!connected) {
        return (
            <div className="text-center p-8 border border-dashed border-gray-700 rounded-xl">
                <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Connect wallet to access Staking</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 text-center text-[#00ff41] animate-pulse">
                Loading Staking Data...
            </div>
        );
    }

    const handleClaim = async (stakeId: number) => {
        setClaimingId(stakeId);
        try {
            // TODO: In production, this would:
            // 1. Initiate on-chain claim transaction via wallet
            // 2. Get the transaction signature
            // 3. Pass signature to claim() for backend verification
            // For now, show a placeholder message
            const claimSignature = prompt('Enter your claim transaction signature:');
            if (!claimSignature) {
                return;
            }
            const result = await claim(stakeId, claimSignature);
            if (!result.success) {
                alert(result.error || 'Failed to claim');
            }
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-black/30 border border-gray-700 rounded-lg">
                    <div className="text-center">
                        <p className="text-gray-500 text-xs uppercase">Total Staked</p>
                        <p className="text-white font-mono text-lg">{summary.total_staked.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs uppercase">Pending Rewards</p>
                        <p className="text-yellow-400 font-mono text-lg">{summary.total_pending_rewards.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs uppercase">Total Earned</p>
                        <p className="text-[#00ff41] font-mono text-lg">{summary.total_earned.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Active Stakes */}
            {activeStakes.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Stakes</h4>
                    {activeStakes.map((stake) => (
                        <ActiveStakeCard
                            key={stake.id}
                            stake={stake}
                            onClaim={handleClaim}
                            isLoading={claimingId === stake.id}
                        />
                    ))}
                </div>
            )}

            {/* Staking Tiers */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stake New Tokens</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tiers.map((tier) => (
                        <TierCard
                            key={tier.id}
                            tier={tier}
                            isSelected={selectedTier?.id === tier.id}
                            onClick={() => setSelectedTier(tier)}
                        />
                    ))}
                </div>
            </div>

            {/* Selected Tier Details */}
            {selectedTier && (
                <StakeForm tier={selectedTier} onClose={() => setSelectedTier(null)} />
            )}
        </div>
    );
};

// ============================================================================
// TIER CARD
// ============================================================================

interface TierCardProps {
    tier: StakingTier;
    isSelected: boolean;
    onClick: () => void;
}

const TierCard: React.FC<TierCardProps> = ({ tier, isSelected, onClick }) => {
    const tierColors: Record<number, string> = {
        1: 'border-amber-700 bg-amber-900/20',
        2: 'border-gray-400 bg-gray-600/20',
        3: 'border-yellow-500 bg-yellow-900/20',
    };

    const tierNames: Record<number, string> = {
        1: '🥉 Bronze',
        2: '🥈 Silver',
        3: '🥇 Gold',
    };

    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-lg border transition-all text-left
                ${isSelected ? 'border-[#00ff41] bg-[#00ff41]/10' : tierColors[tier.id]}
                hover:border-[#00ff41]/50`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white">{tierNames[tier.id]}</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
            <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                    <span className="text-gray-500">Max Stake</span>
                    <span className="text-white">${tier.max_usd}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Lock Period</span>
                    <span className="text-white">{tier.lock_weeks} weeks</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">APR</span>
                    <span className="text-[#00ff41] font-bold">{tier.apr_percent}%</span>
                </div>
            </div>
        </button>
    );
};

// ============================================================================
// ACTIVE STAKE CARD
// ============================================================================

interface ActiveStakeCardProps {
    stake: StakeInfo;
    onClaim: (id: number) => void;
    isLoading: boolean;
}

const ActiveStakeCard: React.FC<ActiveStakeCardProps> = ({ stake, onClaim, isLoading }) => {
    return (
        <div className={`p-4 rounded-lg border ${stake.is_claimable ? 'border-[#00ff41] bg-[#00ff41]/10' : 'border-gray-700 bg-black/30'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {stake.is_claimable ? (
                        <Gift className="w-4 h-4 text-[#00ff41]" />
                    ) : (
                        <Clock className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="font-bold text-white">{stake.tier_name} Stake</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${stake.is_claimable ? 'bg-[#00ff41]/20 text-[#00ff41]' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                    {stake.is_claimable ? 'Ready to Claim' : stake.remaining_formatted}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div>
                    <span className="text-gray-500">Staked</span>
                    <p className="text-white font-mono">{stake.amount_formatted}</p>
                </div>
                <div>
                    <span className="text-gray-500">Reward</span>
                    <p className="text-[#00ff41] font-mono">+{stake.reward_formatted}</p>
                </div>
                <div>
                    <span className="text-gray-500">APR</span>
                    <p className="text-white">{stake.apr_percent}%</p>
                </div>
            </div>

            {stake.is_claimable && (
                <button
                    onClick={() => onClaim(stake.id)}
                    disabled={isLoading}
                    className={`w-full py-2 rounded font-bold text-xs uppercase transition-all
                        ${isLoading
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-[#00ff41] text-black hover:bg-[#00ff41]/80'}`}
                >
                    {isLoading ? 'Claiming...' : `Claim ${(stake.amount + stake.reward_amount).toLocaleString()} Tokens`}
                </button>
            )}
        </div>
    );
};

// ============================================================================
// STAKE FORM (PLACEHOLDER)
// ============================================================================

interface StakeFormProps {
    tier: StakingTier;
    onClose: () => void;
}

const StakeForm: React.FC<StakeFormProps> = ({ tier, onClose }) => {
    const [amount, setAmount] = useState('');
    const { calculateReward } = useStaking();
    const [reward, setReward] = useState<number | null>(null);
    const isStaking = false; // TODO: implement staking transaction flow

    const handleAmountChange = async (value: string) => {
        setAmount(value);
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
            const result = await calculateReward(tier.id, numValue);
            setReward(result?.reward ?? null);
        } else {
            setReward(null);
        }
    };

    const handleStake = async () => {
        // NOTE: In production, this would:
        // 1. Initiate token transfer to treasury
        // 2. Get transaction signature
        // 3. Call stake() with signature

        alert(`Staking flow would initiate here for ${amount} tokens on ${tier.name} tier.\n\nThis requires wallet transaction integration.`);
    };

    return (
        <div className="p-4 border border-[#00ff41]/50 rounded-lg bg-black/30">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-white">Stake on {tier.name}</h4>
                <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Amount to Stake</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="Enter token amount"
                        className="w-full p-3 bg-black/50 border border-gray-700 rounded text-white font-mono focus:border-[#00ff41] outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max: ${tier.max_usd} USD equivalent</p>
                </div>

                {reward !== null && (
                    <div className="p-3 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Lock Period</span>
                            <span className="text-white">{tier.lock_days} days</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                            <span className="text-gray-400">APR</span>
                            <span className="text-white">{tier.apr_percent}%</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-700">
                            <span className="text-white font-bold">Estimated Reward</span>
                            <span className="text-[#00ff41] font-bold">+{reward.toFixed(4)} tokens</span>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleStake}
                    disabled={!amount || parseFloat(amount) <= 0 || isStaking}
                    className={`w-full py-3 rounded font-bold uppercase transition-all
                        ${(!amount || parseFloat(amount) <= 0)
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-[#00ff41] text-black hover:bg-[#00ff41]/80'}`}
                >
                    {isStaking ? 'Staking...' : 'Stake Tokens'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Tokens will be locked for {tier.lock_days} days
                </p>
            </div>
        </div>
    );
};

export default StakingPanel;
