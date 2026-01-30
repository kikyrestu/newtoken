<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserWallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'wallet_address',
        'current_tier',
        'total_locked_amount',
        'missions_completed',
        'first_lock_at',
    ];

    protected $casts = [
        'total_locked_amount' => 'integer',
        'missions_completed' => 'integer',
        'first_lock_at' => 'datetime',
    ];

    /**
     * Tier constants
     */
    public const TIER_SPECTATOR = 'spectator';
    public const TIER_OPERATOR = 'operator';
    public const TIER_ELITE = 'elite';

    public const TIERS = [
        self::TIER_SPECTATOR,
        self::TIER_OPERATOR,
        self::TIER_ELITE,
    ];

    /**
     * Get all lock transactions for this wallet
     */
    public function lockTransactions(): HasMany
    {
        return $this->hasMany(LockTransaction::class);
    }

    /**
     * Get active (locked) transactions
     */
    public function activeLocks(): HasMany
    {
        return $this->lockTransactions()->where('status', 'locked');
    }

    /**
     * Check if user has an active lock
     */
    public function hasActiveLock(): bool
    {
        return $this->activeLocks()->exists();
    }

    /**
     * Get the highest tier from active locks
     */
    public function getHighestActiveTier(): ?string
    {
        $tierOrder = [
            self::TIER_SPECTATOR => 1,
            self::TIER_OPERATOR => 2,
            self::TIER_ELITE => 3,
        ];

        $activeTiers = $this->activeLocks()->pluck('tier')->toArray();
        
        if (empty($activeTiers)) {
            return null;
        }

        usort($activeTiers, fn($a, $b) => ($tierOrder[$b] ?? 0) - ($tierOrder[$a] ?? 0));
        
        return $activeTiers[0];
    }

    /**
     * Format total locked amount for display (9 decimals)
     */
    public function getFormattedLockedAmountAttribute(): string
    {
        return number_format($this->total_locked_amount / 1_000_000_000, 4);
    }

    /**
     * Scope for finding by wallet address
     */
    public function scopeByAddress($query, string $address)
    {
        return $query->where('wallet_address', $address);
    }
}
