<?php

namespace App\Services;

use App\Models\LockTransaction;
use App\Models\UserWallet;
use App\Models\GlobalStats;
use App\Models\AppSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Auto-Unlock Service
 * 
 * Handles automatic unlocking of tokens when lock period expires.
 * This service will:
 * 1. Find all matured locks (unlock_timestamp <= now)
 * 2. Mark them as "pending_unlock" for user to claim
 * 3. Update global stats
 * 
 * FIX [API-4]: Fixed wrong column names, status values, and relation usage.
 */
class AutoUnlockService
{
    /**
     * Process all matured locks for automatic unlock
     * 
     * @return array Summary of processed unlocks
     */
    public function processMaturedLocks(): array
    {
        $summary = [
            'processed' => 0,
            'success' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        // FIX [API-4]: Use correct status 'locked' and column 'unlock_timestamp'
        $maturedLocks = LockTransaction::where('status', LockTransaction::STATUS_LOCKED)
            ->where('unlock_timestamp', '<=', Carbon::now())
            ->get();

        if ($maturedLocks->isEmpty()) {
            Log::info('[AutoUnlock] No matured locks to process');
            return $summary;
        }

        Log::info("[AutoUnlock] Found {$maturedLocks->count()} matured locks to process");

        foreach ($maturedLocks as $lock) {
            $summary['processed']++;
            
            try {
                $result = $this->processUnlock($lock);
                
                if ($result['success']) {
                    $summary['success']++;
                    // FIX [API-4]: Access wallet via relation
                    $walletAddress = $lock->userWallet->wallet_address ?? 'unknown';
                    Log::info("[AutoUnlock] Successfully unlocked ID:{$lock->id} for wallet {$walletAddress}");
                } else {
                    $summary['failed']++;
                    $summary['errors'][] = "Lock #{$lock->id}: {$result['error']}";
                    Log::error("[AutoUnlock] Failed to unlock ID:{$lock->id} - {$result['error']}");
                }
            } catch (\Exception $e) {
                $summary['failed']++;
                $summary['errors'][] = "Lock #{$lock->id}: " . $e->getMessage();
                Log::error("[AutoUnlock] Exception for ID:{$lock->id} - " . $e->getMessage());
            }
        }

        return $summary;
    }

    /**
     * Process a single unlock
     * 
     * Marks the lock as "pending_unlock" for user to claim.
     * Full auto-unlock requires server keypair which needs secure setup.
     */
    protected function processUnlock(LockTransaction $lock): array
    {
        // Mark as expired/unlockable — user still needs to trigger on-chain unlock
        $lock->status = LockTransaction::STATUS_EXPIRED;
        $lock->save();

        // Decrement global stats since lock period has ended
        $this->decrementGlobalStats($lock);

        return [
            'success' => true,
            'message' => 'Marked as expired (ready for unlock)',
        ];
    }

    /**
     * Decrement global stats when lock ends
     * 
     * FIX [API-4]: Use GlobalStats model if available, otherwise use direct DB
     * with correct column names.
     */
    protected function decrementGlobalStats(LockTransaction $lock): void
    {
        try {
            // Try using GlobalStats model first
            if (class_exists(\App\Models\GlobalStats::class)) {
                $stats = GlobalStats::first();
                if ($stats) {
                    $stats->decrement('total_locked_tokens', $lock->amount);
                    $stats->decrement('total_locked_usd', $lock->usd_value_at_lock ?? 0);
                    
                    // Decrement tier counter
                    $tierField = 'tier_' . strtolower($lock->tier) . '_count';
                    if (\Schema::hasColumn($stats->getTable(), $tierField)) {
                        $stats->decrement($tierField);
                    }
                }
            } else {
                // Fallback: Direct DB update
                DB::table('global_stats')
                    ->where('id', 1)
                    ->update([
                        'total_locked_tokens' => DB::raw("GREATEST(0, total_locked_tokens - {$lock->amount})"),
                        'total_locked_usd' => DB::raw("GREATEST(0, total_locked_usd - " . ($lock->usd_value_at_lock ?? 0) . ")"),
                    ]);
            }
        } catch (\Exception $e) {
            Log::error('[AutoUnlock] Failed to decrement global stats', [
                'lock_id' => $lock->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get pending unlocks count (for dashboard display)
     */
    public static function getPendingUnlocksCount(): int
    {
        return LockTransaction::where('status', LockTransaction::STATUS_EXPIRED)->count();
    }

    /**
     * Get user's pending unlocks
     * FIX [API-4]: Use relation through UserWallet instead of direct wallet_address column
     */
    public static function getUserPendingUnlocks(string $wallet): \Illuminate\Database\Eloquent\Collection
    {
        $userWallet = UserWallet::where('wallet_address', $wallet)->first();
        
        if (!$userWallet) {
            return new \Illuminate\Database\Eloquent\Collection();
        }

        return $userWallet->lockTransactions()
            ->where('status', LockTransaction::STATUS_EXPIRED)
            ->orderBy('unlock_timestamp', 'desc')
            ->get();
    }
}
