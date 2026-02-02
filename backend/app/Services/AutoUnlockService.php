<?php

namespace App\Services;

use App\Models\LockTransaction;
use App\Models\AppSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

/**
 * Auto-Unlock Service
 * 
 * Handles automatic unlocking of tokens when lock period expires.
 * This service will:
 * 1. Find all matured locks (unlock_at <= now)
 * 2. Trigger transfer of tokens from escrow to user wallet
 * 3. Update lock status to 'completed'
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

        // Get all active locks that are ready to unlock
        $maturedLocks = LockTransaction::where('status', 'active')
            ->where('unlock_at', '<=', Carbon::now())
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
                    Log::info("[AutoUnlock] Successfully unlocked ID:{$lock->id} for wallet {$lock->wallet_address}");
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
     * For now, this marks the lock as "pending_unlock" for user to claim.
     * Full auto-unlock requires server keypair which needs secure setup.
     * 
     * @param LockTransaction $lock
     * @return array
     */
    protected function processUnlock(LockTransaction $lock): array
    {
        // Option 1: Full Auto-Unlock (requires server keypair)
        // This would send tokens back automatically
        // $result = $this->executeOnChainUnlock($lock);
        
        // Option 2: Mark as "pending_unlock" for user notification
        // User still needs to trigger unlock, but they're notified
        $lock->status = 'pending_unlock';
        $lock->save();

        // Decrement global stats since lock is ending
        $this->decrementGlobalStats($lock);

        return [
            'success' => true,
            'message' => 'Marked as pending_unlock',
        ];

        // If implementing full auto-unlock, uncomment below:
        // return $this->executeOnChainUnlock($lock);
    }

    /**
     * Execute on-chain unlock transaction
     * 
     * NOTE: This requires a server keypair stored securely.
     * The keypair must have authority to release tokens from escrow.
     * 
     * @param LockTransaction $lock
     * @return array
     */
    protected function executeOnChainUnlock(LockTransaction $lock): array
    {
        // Get config from app settings
        $programId = AppSetting::get('program_id');
        $rpcUrl = AppSetting::get('rpc_url', 'https://api.devnet.solana.com');
        
        // Server keypair for signing (must be set in env)
        $serverKeypair = env('UNLOCK_SERVER_KEYPAIR');
        
        if (!$serverKeypair || !$programId) {
            return [
                'success' => false,
                'error' => 'Server keypair or program ID not configured',
            ];
        }

        // TODO: Implement actual Solana transaction
        // This would need a PHP Solana SDK or call to a separate service
        // 
        // Steps:
        // 1. Create unlock instruction
        // 2. Sign with server keypair
        // 3. Send transaction
        // 4. Wait for confirmation
        // 5. Update lock status to 'completed'
        
        // For now, return error indicating not yet implemented
        return [
            'success' => false,
            'error' => 'On-chain auto-unlock not yet implemented - requires server keypair setup',
        ];
    }

    /**
     * Decrement global stats when lock ends
     */
    protected function decrementGlobalStats(LockTransaction $lock): void
    {
        // Update global stats to reflect unlocked tokens
        \DB::table('global_stats')
            ->where('id', 1)
            ->decrementEach([
                'total_locked_tokens' => $lock->amount,
                'total_locked_usd' => $lock->usd_value ?? 0,
            ]);

        // Decrement tier counter
        $tierField = 'tier_' . strtolower($lock->tier) . '_count';
        \DB::table('global_stats')
            ->where('id', 1)
            ->decrement($tierField);
    }

    /**
     * Get pending unlocks count (for dashboard display)
     */
    public static function getPendingUnlocksCount(): int
    {
        return LockTransaction::where('status', 'pending_unlock')->count();
    }

    /**
     * Get user's pending unlocks
     */
    public static function getUserPendingUnlocks(string $wallet): \Illuminate\Database\Eloquent\Collection
    {
        return LockTransaction::where('wallet_address', $wallet)
            ->where('status', 'pending_unlock')
            ->orderBy('unlock_at', 'desc')
            ->get();
    }
}
