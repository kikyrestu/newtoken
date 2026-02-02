<?php

namespace App\Http\Controllers;

use App\Models\UserWallet;
use App\Models\LockTransaction;
use App\Models\GlobalStat;
use App\Services\SolanaListenerService;
use App\Services\PriceOracleService;
use App\Services\EarlyBirdPricingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class LockController extends Controller
{
    public function __construct(
        private SolanaListenerService $solanaService,
        private PriceOracleService $priceService,
        private EarlyBirdPricingService $earlyBirdPricing
    ) {}

    /**
     * Get current tier pricing
     * GET /api/pricing
     */
    public function getPricing(): JsonResponse
    {
        try {
            Log::info('=== getPricing START ===');
            Log::info('Token mint from config: ' . config('solana.token_mint'));
            
            $details = $this->earlyBirdPricing->getAllTierPricingDetails();
            Log::info('Early bird details OK');
            
            $tokenPrice = $this->priceService->getTokenPriceUSD();
            Log::info('Token price: ' . $tokenPrice);

            $pricing = [];
            foreach ($details as $tier => $tierDetails) {
                $usd = (float) $tierDetails['current_price'];
                $tokensNeeded = $this->priceService->calculateTokensForUSD($usd);

                $pricing[$tier] = [
                    'usd' => $usd,
                    'tokens' => $tokensNeeded,
                    'tokens_formatted' => $this->priceService->formatTokenAmount($tokensNeeded),
                    'token_price' => $tokenPrice,
                    'current_price' => $usd,
                    'original_price' => (float) $tierDetails['original_price'],
                    'discount_percent' => (int) $tierDetails['discount_percent'],
                    'remaining_slots_in_tier' => $tierDetails['remaining_slots_in_tier'],
                    'next_price' => (float) $tierDetails['next_price'],
                    'locked_count' => (int) $tierDetails['locked_count'],
                ];
            }
            
            Log::info('=== getPricing SUCCESS ===');
            
            return response()->json([
                'success' => true,
                'prices' => $pricing,
                'updated_at' => now()->toISOString(),
                'cache_ttl' => config('solana.price_cache_ttl', 30)
            ]);
        } catch (\Exception $e) {
            Log::error('=== getPricing FAILED ===');
            Log::error('Error: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ':' . $e->getLine());
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch pricing: ' . $e->getMessage(),
                'debug_token_mint' => config('solana.token_mint'),
                'prices' => $this->priceService->getTierPricing()
            ], 503);
        }
    }

    /**
     * Get tier pricing with discount info (lightweight endpoint)
     * GET /api/pricing/tiers
     */
    public function getTierPricing(): JsonResponse
    {
        try {
            $details = $this->earlyBirdPricing->getAllTierPricingDetails();
            
            return response()->json([
                'success' => true,
                'tiers' => $details,
                'updated_at' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('getTierPricing failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify a lock transaction from frontend
     * POST /api/lock/verify
     */
    public function verifyLock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'signature' => 'required|string|min:87|max:88', // Solana signatures are 87-88 chars base58
            'wallet' => 'required|string|min:43|max:44', // Solana addresses are 43-44 chars base58
            'tier' => 'required|in:spectator,operator,elite'
        ]);

        $signature = $validated['signature'];
        $wallet = $validated['wallet'];
        $tier = $validated['tier'];

        // 2. Verify transaction on-chain
        $result = $this->solanaService->verifyLockTransaction($signature, $wallet);

        if (!$result['valid']) {
            Log::warning('Lock verification failed', [
                'signature' => $signature,
                'wallet' => $wallet,
                'error' => $result['error'] ?? 'Unknown'
            ]);

            return response()->json([
                'success' => false,
                'error' => $result['error'] ?? 'Invalid transaction'
            ], 400);
        }

        // 3. Get tier pricing info
        $tierPrice = $this->earlyBirdPricing->getTierCurrentUsdPrice($tier);
        $tokenPrice = null;
        try {
            $tokenPrice = $this->priceService->getTokenPriceUSD();
        } catch (\Exception $e) {}

        // 4. Record transaction (Atomic)
        try {
            DB::beginTransaction();

            // Double check lock inside transaction to reduce race window
            if (LockTransaction::where('signature', $signature)->exists()) {
                DB::rollBack();
                return response()->json([
                    'success' => true, // Idempotent success
                    'message' => 'Transaction already processed',
                    'data' => [
                        'tier' => $tier,
                        'signature' => $signature
                    ]
                ]);
            }

            // Create or get user wallet (Atomic lock with firstOrCreate)
            $userWallet = UserWallet::firstOrCreate(
                ['wallet_address' => $wallet],
                ['first_lock_at' => now()]
            );

            // Create lock transaction record
            $lockTx = LockTransaction::create([
                'user_wallet_id' => $userWallet->id,
                'signature' => $signature,
                'escrow_pda' => $result['escrow_pda'],
                'amount' => $result['amount'],
                'tier' => $tier,
                'lock_duration_days' => config('solana.default_lock_duration_days', 30),
                'lock_timestamp' => Carbon::createFromTimestamp($result['lock_timestamp']),
                'unlock_timestamp' => Carbon::createFromTimestamp($result['unlock_timestamp']),
                'status' => LockTransaction::STATUS_LOCKED,
                'usd_value_at_lock' => $tierPrice,
                'token_price_at_lock' => $tokenPrice,
            ]);

            // Update Aggregates
            $userWallet->update([
                'current_tier' => $tier,
                'total_locked_amount' => $userWallet->total_locked_amount + $result['amount']
            ]);
            
            $this->updateGlobalStats($tier, $result['amount'], $tierPrice);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'tier' => $tier,
                    'amount' => $result['amount'],
                    'escrow_pda' => $result['escrow_pda'],
                    'lock_timestamp' => Carbon::createFromTimestamp($result['lock_timestamp'])->toISOString(),
                    'solscan_url' => "https://solscan.io/tx/{$signature}" . (config('app.env') === 'local' ? '?cluster=devnet' : '')
                ]
            ]);

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            // Handle Unique Constraint Violation (Race Condition caught by DB)
            if ($e->getCode() == '23000') { // Integrity constraint violation
                 return response()->json([
                    'success' => true, // Return success to frontend so it doesn't error out
                    'message' => 'Transaction processed successfully (deduplicated)'
                ]);
            }
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Lock recording failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'error' => 'Processing failed'], 500);
        }
    }

    /**
     * Get user dashboard data
     * GET /api/user/{wallet}/dashboard
     */
    public function getUserDashboard(string $wallet): JsonResponse
    {
        // Validate wallet format (Solana addresses are 43-44 chars base58)
        if (strlen($wallet) < 43 || strlen($wallet) > 44) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid wallet address format'
            ], 400);
        }

        $user = UserWallet::where('wallet_address', $wallet)
            ->with(['lockTransactions' => fn($q) => $q->latest()->limit(20)])
            ->first();

        if (!$user) {
            return response()->json([
                'success' => true,
                'data' => [
                    'wallet' => $wallet,
                    'current_tier' => null,
                    'total_locked' => 0,
                    'total_locked_formatted' => '0',
                    'missions_completed' => 0,
                    'active_locks' => [],
                    'lock_history' => [],
                    'is_new_user' => true
                ]
            ]);
        }

        // Get active locks
        $activeLocks = $user->activeLocks()->get()->map(fn($tx) => [
            'id' => $tx->id,
            'signature' => $tx->signature, // ADD: Include signature for frontend
            'amount' => $tx->amount,
            'amount_formatted' => $tx->formatted_amount,
            'tier' => $tx->tier,
            'status' => $tx->status,
            'lock_timestamp' => $tx->lock_timestamp->toISOString(),
            'unlock_timestamp' => $tx->unlock_timestamp->toISOString(),
            'remaining_seconds' => $tx->remaining_seconds,
            'remaining_formatted' => $tx->formatted_remaining_time,
            'can_unlock' => $tx->canUnlock(),
            'escrow_pda' => $tx->escrow_pda,
            'solscan_url' => $tx->solscan_url
        ]);

        // Get lock history
        $lockHistory = $user->lockTransactions->map(fn($tx) => [
            'id' => $tx->id,
            'signature' => $tx->signature,
            'amount' => $tx->amount,
            'amount_formatted' => $tx->formatted_amount,
            'tier' => $tx->tier,
            'status' => $tx->status,
            'usd_value' => $tx->usd_value_at_lock,
            'lock_timestamp' => $tx->lock_timestamp->toISOString(),
            'unlock_timestamp' => $tx->unlock_timestamp->toISOString(),
            'solscan_url' => $tx->solscan_url
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'wallet' => $wallet,
                'current_tier' => $user->current_tier,
                'highest_active_tier' => $user->getHighestActiveTier(),
                'total_locked' => $user->total_locked_amount,
                'total_locked_formatted' => $user->formatted_locked_amount,
                'missions_completed' => $user->missions_completed,
                'member_since' => $user->first_lock_at?->toISOString(),
                'active_locks' => $activeLocks,
                'lock_history' => $lockHistory,
                'is_new_user' => false,
                // Stats object for Overview tab
                'stats' => [
                    'mission_points' => $user->mission_points ?? 0,
                    'total_earned' => $user->total_earned ?? 0,
                    'total_locked' => $user->total_locked_amount ?? 0,
                    'total_burned' => $user->total_burned ?? 0,
                    'missions_completed' => $user->missions_completed ?? 0,
                    'missions_canceled' => $user->missions_canceled ?? 0,
                    'missions_failed' => $user->missions_failed ?? 0,
                ],
            ]
        ]);
    }

    /**
     * Get next unlockable timestamp for a user
     * GET /api/user/{wallet}/next-unlock
     */
    public function getNextUnlock(string $wallet): JsonResponse
    {
        $user = UserWallet::where('wallet_address', $wallet)->first();

        if (!$user) {
            return response()->json([
                'success' => true,
                'data' => null
            ]);
        }

        $nextUnlock = $user->activeLocks()
            ->orderBy('unlock_timestamp')
            ->first();

        if (!$nextUnlock) {
            return response()->json([
                'success' => true,
                'data' => null
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'unlock_timestamp' => $nextUnlock->unlock_timestamp->toISOString(),
                'unix_timestamp' => $nextUnlock->unlock_timestamp->timestamp,
                'remaining_seconds' => $nextUnlock->remaining_seconds,
                'tier' => $nextUnlock->tier,
                'amount' => $nextUnlock->amount,
                'escrow_pda' => $nextUnlock->escrow_pda
            ]
        ]);
    }

    /**
     * Verify an unlock transaction from frontend
     * POST /api/unlock/verify
     */
    public function verifyUnlock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'signature' => 'required|string|min:87|max:88',
            'wallet' => 'required|string|min:43|max:44',
            'lock_id' => 'required|integer', // The lock transaction ID to unlock
        ]);

        $signature = $validated['signature'];
        $wallet = $validated['wallet'];
        $lockId = $validated['lock_id'];

        Log::info('Unlock verification request', [
            'signature' => substr($signature, 0, 20) . '...',
            'wallet' => substr($wallet, 0, 10) . '...',
            'lock_id' => $lockId
        ]);

        // 1. Get the lock transaction
        $lockTx = LockTransaction::where('id', $lockId)
            ->whereHas('userWallet', fn($q) => $q->where('wallet_address', $wallet))
            ->first();

        if (!$lockTx) {
            return response()->json([
                'success' => false,
                'error' => 'Lock transaction not found or does not belong to this wallet'
            ], 404);
        }

        // 2. Check if already unlocked
        if ($lockTx->status === LockTransaction::STATUS_UNLOCKED) {
            return response()->json([
                'success' => true,
                'message' => 'Already unlocked',
                'data' => [
                    'lock_id' => $lockId,
                    'unlocked_at' => $lockTx->unlocked_at?->toISOString()
                ]
            ]);
        }

        // 3. Check if can unlock (time-based)
        if (!$lockTx->canUnlock()) {
            return response()->json([
                'success' => false,
                'error' => 'Lock period has not expired yet',
                'remaining_seconds' => $lockTx->remaining_seconds
            ], 400);
        }

        // 4. Verify the unlock transaction on-chain
        try {
            $txValid = $this->solanaService->verifyUnlockTransaction($signature, $wallet, $lockTx->escrow_pda);
            
            if (!$txValid['valid']) {
                Log::warning('Unlock transaction verification failed', [
                    'signature' => $signature,
                    'error' => $txValid['error'] ?? 'Unknown'
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => $txValid['error'] ?? 'Invalid unlock transaction'
                ], 400);
            }
        } catch (\Exception $e) {
            // If verification service fails, we still allow the unlock if time has passed
            // This is a fallback for when RPC is down
            Log::warning('Unlock verification service error, allowing time-based unlock', [
                'error' => $e->getMessage()
            ]);
        }

        // 5. Update the lock transaction status
        try {
            DB::beginTransaction();

            $lockTx->update([
                'status' => LockTransaction::STATUS_UNLOCKED,
                'unlocked_at' => now(),
                'unlock_signature' => $signature,
                'admin_unlocked' => false
            ]);

            // Decrement global stats
            $this->decrementGlobalStatsOnUnlock($lockTx->tier, $lockTx->amount);

            // Update user wallet stats
            $userWallet = $lockTx->userWallet;
            if ($userWallet) {
                $userWallet->update([
                    'total_locked_amount' => max(0, $userWallet->total_locked_amount - $lockTx->amount)
                ]);

                // Update current tier to highest remaining active lock
                $highestTier = $userWallet->getHighestActiveTier();
                $userWallet->update(['current_tier' => $highestTier]);
            }

            DB::commit();

            Log::info('Unlock successful', [
                'lock_id' => $lockId,
                'signature' => $signature
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Unlock verified and recorded',
                'data' => [
                    'lock_id' => $lockId,
                    'signature' => $signature,
                    'unlocked_at' => now()->toISOString(),
                    'amount' => $lockTx->amount,
                    'tier' => $lockTx->tier,
                    'solscan_url' => "https://solscan.io/tx/{$signature}" . (config('app.env') === 'local' ? '?cluster=devnet' : '')
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Unlock processing failed', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to record unlock'
            ], 500);
        }
    }

    /**
     * Decrement global stats when unlock occurs
     */
    private function decrementGlobalStatsOnUnlock(string $tier, int $amount): void
    {
        // Decrement active locks
        GlobalStat::decrementStat(GlobalStat::KEY_ACTIVE_LOCKS);

        // Decrement tier count
        $tierKey = match ($tier) {
            'spectator' => GlobalStat::KEY_TOTAL_SPECTATORS,
            'operator' => GlobalStat::KEY_TOTAL_OPERATORS,
            'elite' => GlobalStat::KEY_TOTAL_ELITE,
            default => null
        };

        if ($tierKey) {
            GlobalStat::decrementStat($tierKey);
        }
    }

    /**
     * Update global statistics
     */
    private function updateGlobalStats(string $tier, int $amount, float $usdValue): void
    {
        // Increment total locked tokens
        GlobalStat::incrementStat(GlobalStat::KEY_TOTAL_LOCKED_TOKENS, $amount);
        
        // Increment total locked USD
        GlobalStat::incrementStat(GlobalStat::KEY_TOTAL_LOCKED_USD, $usdValue);
        
        // Increment tier-specific count
        $tierKey = match ($tier) {
            'spectator' => GlobalStat::KEY_TOTAL_SPECTATORS,
            'operator' => GlobalStat::KEY_TOTAL_OPERATORS,
            'elite' => GlobalStat::KEY_TOTAL_ELITE,
            default => null
        };
        
        if ($tierKey) {
            GlobalStat::incrementStat($tierKey);
        }
        
        // Increment active locks
        GlobalStat::incrementStat(GlobalStat::KEY_ACTIVE_LOCKS);
        
        // Update total participants (unique wallets)
        $totalParticipants = UserWallet::count();
        GlobalStat::setValue(GlobalStat::KEY_TOTAL_PARTICIPANTS, $totalParticipants, GlobalStat::TYPE_INTEGER);
    }
}
