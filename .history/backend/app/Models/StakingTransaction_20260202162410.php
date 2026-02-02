<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class StakingTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'wallet_address',
        'signature',
        'tier',
        'amount',
        'usd_value',
        'lock_days',
        'apr_percent',
        'reward_amount',
        'staked_at',
        'unlocks_at',
        'claimed_at',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:6',
        'usd_value' => 'decimal:2',
        'apr_percent' => 'decimal:2',
        'reward_amount' => 'decimal:6',
        'staked_at' => 'datetime',
        'unlocks_at' => 'datetime',
        'claimed_at' => 'datetime',
    ];

    // ========================================================================
    // STAKING TIER DEFINITIONS
    // ========================================================================

    public const TIERS = [
        1 => [
            'name' => 'Bronze',
            'max_usd' => 20,
            'lock_days' => 14,
            'apr_percent' => 20,
        ],
        2 => [
            'name' => 'Silver',
            'max_usd' => 50,
            'lock_days' => 28,
            'apr_percent' => 30,
        ],
        3 => [
            'name' => 'Gold',
            'max_usd' => 100,
            'lock_days' => 56,
            'apr_percent' => 50,
        ],
    ];

    // ========================================================================
    // SCOPES
    // ========================================================================

    public function scopeByWallet($query, string $wallet)
    {
        return $query->where('wallet_address', $wallet);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeClaimable($query)
    {
        return $query->where('status', 'claimable')
            ->orWhere(function ($q) {
                $q->where('status', 'active')
                    ->where('unlocks_at', '<=', now());
            });
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    /**
     * Calculate reward based on amount and APR
     */
    public static function calculateReward(float $amount, int $lockDays, float $aprPercent): float
    {
        // Reward = (Amount × APR × Days) / 365
        return ($amount * ($aprPercent / 100) * $lockDays) / 365;
    }

    /**
     * Get tier info by tier number
     */
    public static function getTierInfo(int $tier): ?array
    {
        return self::TIERS[$tier] ?? null;
    }

    /**
     * Check if stake is ready to claim
     */
    public function isClaimable(): bool
    {
        return $this->status === 'claimable' || 
            ($this->status === 'active' && $this->unlocks_at <= now());
    }

    /**
     * Get remaining time until unlock
     */
    public function getRemainingSeconds(): int
    {
        if ($this->unlocks_at <= now()) {
            return 0;
        }
        return now()->diffInSeconds($this->unlocks_at);
    }

    /**
     * Format for API response
     */
    public function toApiArray(): array
    {
        $tierInfo = self::getTierInfo($this->tier);
        
        return [
            'id' => $this->id,
            'wallet_address' => $this->wallet_address,
            'signature' => $this->signature,
            'tier' => $this->tier,
            'tier_name' => $tierInfo['name'] ?? 'Unknown',
            'amount' => $this->amount,
            'amount_formatted' => number_format($this->amount, 2),
            'usd_value' => $this->usd_value,
            'lock_days' => $this->lock_days,
            'apr_percent' => $this->apr_percent,
            'reward_amount' => $this->reward_amount,
            'reward_formatted' => number_format($this->reward_amount ?? 0, 2),
            'staked_at' => $this->staked_at?->toIso8601String(),
            'unlocks_at' => $this->unlocks_at?->toIso8601String(),
            'claimed_at' => $this->claimed_at?->toIso8601String(),
            'status' => $this->status,
            'is_claimable' => $this->isClaimable(),
            'remaining_seconds' => $this->getRemainingSeconds(),
            'remaining_formatted' => $this->formatRemaining(),
        ];
    }

    /**
     * Format remaining time as human-readable string
     */
    protected function formatRemaining(): string
    {
        $seconds = $this->getRemainingSeconds();
        
        if ($seconds <= 0) {
            return 'Ready to claim';
        }
        
        $days = floor($seconds / 86400);
        $hours = floor(($seconds % 86400) / 3600);
        
        if ($days > 0) {
            return "{$days}d {$hours}h remaining";
        }
        
        $minutes = floor(($seconds % 3600) / 60);
        return "{$hours}h {$minutes}m remaining";
    }
}
