<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class LockTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_wallet_id',
        'signature',
        'escrow_pda',
        'amount',
        'tier',
        'lock_duration_days',
        'lock_timestamp',
        'unlock_timestamp',
        'status',
        'usd_value_at_lock',
        'token_price_at_lock',
    ];

    protected $casts = [
        'amount' => 'integer',
        'lock_duration_days' => 'integer',
        'lock_timestamp' => 'datetime',
        'unlock_timestamp' => 'datetime',
        'usd_value_at_lock' => 'decimal:2',
        'token_price_at_lock' => 'decimal:10',
    ];

    /**
     * Status constants
     */
    public const STATUS_LOCKED = 'locked';
    public const STATUS_UNLOCKED = 'unlocked';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the user wallet that owns this transaction
     */
    public function userWallet(): BelongsTo
    {
        return $this->belongsTo(UserWallet::class);
    }

    /**
     * Check if the lock has expired (can be unlocked)
     */
    public function canUnlock(): bool
    {
        return $this->status === self::STATUS_LOCKED 
            && Carbon::now()->greaterThanOrEqualTo($this->unlock_timestamp);
    }

    /**
     * Check if currently locked and not yet unlockable
     */
    public function isActiveLock(): bool
    {
        return $this->status === self::STATUS_LOCKED 
            && Carbon::now()->lessThan($this->unlock_timestamp);
    }

    /**
     * Get remaining lock time in seconds
     */
    public function getRemainingSecondsAttribute(): int
    {
        if (!$this->isActiveLock()) {
            return 0;
        }
        
        return max(0, $this->unlock_timestamp->diffInSeconds(Carbon::now()));
    }

    /**
     * Get formatted remaining time
     */
    public function getFormattedRemainingTimeAttribute(): string
    {
        $seconds = $this->remaining_seconds;
        
        if ($seconds <= 0) {
            return 'Unlockable';
        }

        $days = floor($seconds / 86400);
        $hours = floor(($seconds % 86400) / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = $seconds % 60;

        return sprintf('%02d:%02d:%02d:%02d', $days, $hours, $minutes, $secs);
    }

    /**
     * Format amount for display (9 decimals)
     */
    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount / 1_000_000_000, 4);
    }

    /**
     * Get Solscan URL for transaction
     */
    public function getSolscanUrlAttribute(): string
    {
        return "https://solscan.io/tx/{$this->signature}";
    }

    /**
     * Scope for active locks
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_LOCKED);
    }

    /**
     * Scope for expired (unlockable) locks
     */
    public function scopeUnlockable($query)
    {
        return $query->where('status', self::STATUS_LOCKED)
            ->where('unlock_timestamp', '<=', Carbon::now());
    }

    /**
     * Scope by tier
     */
    public function scopeByTier($query, string $tier)
    {
        return $query->where('tier', $tier);
    }
}
