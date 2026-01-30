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

        // 1. Check if transaction already processed
        if (LockTransaction::where('signature', $signature)->exists()) {
            return response()->json([
                'success' => false,
                'error' => 'Transaction already processed'
            ], 400);
        }

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

        // 3. Get tier pricing for USD value (dynamic early-bird)
        $tierPrice = $this->earlyBirdPricing->getTierCurrentUsdPrice($tier);
        $tokenPrice = null;
        
        try {
            $tokenPrice = $this->priceService->getTokenPriceUSD();
        } catch (\Exception $e) {
            // Continue without token price
        }

        // 4. Create/Update records in transaction
        try {
            DB::beginTransaction();

            // Create or get user wallet
            $userWallet = UserWallet::firstOrCreate(
                ['wallet_address' => $wallet],
                ['first_lock_at' => now()]
            );

            // Calculate lock duration
            $lockDurationDays = config('solana.default_lock_duration_days', 30);

            // Create lock transaction record
            $lockTx = LockTransaction::create([
                'user_wallet_id' => $userWallet->id,
                'signature' => $signature,
                'escrow_pda' => $result['escrow_pda'],
                'amount' => $result['amount'],
                'tier' => $tier,
                'lock_duration_days' => $lockDurationDays,
                'lock_timestamp' => Carbon::createFromTimestamp($result['lock_timestamp']),
                'unlock_timestamp' => Carbon::createFromTimestamp($result['unlock_timestamp']),
                'status' => LockTransaction::STATUS_LOCKED,
                'usd_value_at_lock' => $tierPrice,
                'token_price_at_lock' => $tokenPrice,
            ]);

            // Update user's current tier & total locked
            $userWallet->update([
                'current_tier' => $tier,
                'total_locked_amount' => $userWallet->total_locked_amount + $result['amount']
            ]);

            // Update global stats
            $this->updateGlobalStats($tier, $result['amount'], $tierPrice);

            DB::commit();

            Log::info('Lock transaction verified and recorded', [
                'signature' => $signature,
                'wallet' => $wallet,
                'tier' => $tier,
                'amount' => $result['amount']
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'tier' => $tier,
                    'amount' => $result['amount'],
                    'amount_formatted' => $this->priceService->formatTokenAmount($result['amount']),
                    'escrow_pda' => $result['escrow_pda'],
                    'lock_timestamp' => Carbon::createFromTimestamp($result['lock_timestamp'])->toISOString(),
                    'unlock_timestamp' => Carbon::createFromTimestamp($result['unlock_timestamp'])->toISOString(),
                    'usd_value' => $tierPrice,
                    'solscan_url' => "https://solscan.io/tx/{$signature}" . (env('DEV_MODE', false) ? '?cluster=devnet' : '')
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to record lock transaction', [
                'signature' => $signature,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to record transaction'
            ], 500);
        }
    }

    /**
     * Get user dashboard data
     * GET /api/user/{wallet}/dashboard
     */
    public function getUserDashboard(string $wallet): JsonResponse
    {
        // Validate wallet format (basic check)
        if (strlen($wallet) !== 44) {
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
                'is_new_user' => false
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
