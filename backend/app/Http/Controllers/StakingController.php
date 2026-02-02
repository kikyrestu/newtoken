<?php

namespace App\Http\Controllers;

use App\Models\StakingTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class StakingController extends Controller
{
    // ========================================================================
    // PUBLIC ENDPOINTS
    // ========================================================================

    /**
     * Get staking tier information
     */
    public function getTiers(): JsonResponse
    {
        $tiers = [];
        
        foreach (StakingTransaction::TIERS as $id => $tier) {
            $tiers[] = [
                'id' => $id,
                'name' => $tier['name'],
                'max_usd' => $tier['max_usd'],
                'lock_days' => $tier['lock_days'],
                'lock_weeks' => $tier['lock_days'] / 7,
                'apr_percent' => $tier['apr_percent'],
                'description' => "Lock up to \${$tier['max_usd']} for {$tier['lock_days']} days at {$tier['apr_percent']}% APR",
            ];
        }
        
        return response()->json([
            'success' => true,
            'tiers' => $tiers,
        ]);
    }

    /**
     * Calculate potential reward for a stake
     */
    public function calculateReward(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tier' => 'required|integer|in:1,2,3',
            'amount' => 'required|numeric|min:0.000001',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
            ], 422);
        }

        $tier = (int) $request->tier;
        $amount = (float) $request->amount;
        $tierInfo = StakingTransaction::getTierInfo($tier);

        if (!$tierInfo) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid tier',
            ], 400);
        }

        $reward = StakingTransaction::calculateReward(
            $amount,
            $tierInfo['lock_days'],
            $tierInfo['apr_percent']
        );

        return response()->json([
            'success' => true,
            'tier' => $tier,
            'tier_name' => $tierInfo['name'],
            'amount' => $amount,
            'lock_days' => $tierInfo['lock_days'],
            'apr_percent' => $tierInfo['apr_percent'],
            'reward' => round($reward, 6),
            'total_return' => round($amount + $reward, 6),
        ]);
    }

    // ========================================================================
    // USER ENDPOINTS (Requires wallet)
    // ========================================================================

    /**
     * Get user's active stakes
     */
    public function getMyStakes(Request $request): JsonResponse
    {
        $wallet = $request->input('wallet');

        if (!$wallet) {
            return response()->json([
                'success' => false,
                'error' => 'Wallet address required',
            ], 400);
        }

        // Update claimable status for stakes that have matured
        StakingTransaction::byWallet($wallet)
            ->where('status', 'active')
            ->where('unlocks_at', '<=', now())
            ->update(['status' => 'claimable']);

        $stakes = StakingTransaction::byWallet($wallet)
            ->whereIn('status', ['active', 'claimable', 'pending'])
            ->orderBy('staked_at', 'desc')
            ->get()
            ->map(fn($s) => $s->toApiArray());

        $history = StakingTransaction::byWallet($wallet)
            ->whereIn('status', ['claimed', 'canceled'])
            ->orderBy('claimed_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn($s) => $s->toApiArray());

        return response()->json([
            'success' => true,
            'wallet' => $wallet,
            'active_stakes' => $stakes,
            'history' => $history,
            'summary' => [
                'total_staked' => StakingTransaction::byWallet($wallet)->active()->sum('amount'),
                'total_pending_rewards' => StakingTransaction::byWallet($wallet)->active()->sum('reward_amount'),
                'total_earned' => StakingTransaction::byWallet($wallet)->where('status', 'claimed')->sum('reward_amount'),
            ],
        ]);
    }

    /**
     * Create a new stake (after user transfers tokens)
     */
    public function stake(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'wallet' => 'required|string|size:44',
            'tier' => 'required|integer|in:1,2,3',
            'amount' => 'required|numeric|min:0.000001',
            'signature' => 'required|string|max:128',
            'usd_value' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
            ], 422);
        }

        // Check if signature already used
        if (StakingTransaction::where('signature', $request->signature)->exists()) {
            return response()->json([
                'success' => false,
                'error' => 'Transaction signature already used',
            ], 409);
        }

        $tier = (int) $request->tier;
        $tierInfo = StakingTransaction::getTierInfo($tier);
        $amount = (float) $request->amount;
        $usdValue = $request->usd_value ?? null;

        // Validate max USD for tier
        if ($usdValue && $usdValue > $tierInfo['max_usd']) {
            return response()->json([
                'success' => false,
                'error' => "Maximum stake for {$tierInfo['name']} tier is \${$tierInfo['max_usd']}",
            ], 400);
        }

        // Calculate reward
        $reward = StakingTransaction::calculateReward(
            $amount,
            $tierInfo['lock_days'],
            $tierInfo['apr_percent']
        );

        $stakedAt = now();
        $unlocksAt = $stakedAt->copy()->addDays($tierInfo['lock_days']);

        $stake = StakingTransaction::create([
            'wallet_address' => $request->wallet,
            'signature' => $request->signature,
            'tier' => $tier,
            'amount' => $amount,
            'usd_value' => $usdValue,
            'lock_days' => $tierInfo['lock_days'],
            'apr_percent' => $tierInfo['apr_percent'],
            'reward_amount' => $reward,
            'staked_at' => $stakedAt,
            'unlocks_at' => $unlocksAt,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Stake created successfully',
            'stake' => $stake->toApiArray(),
        ], 201);
    }

    /**
     * Claim a matured stake
     */
    public function claim(Request $request, int $id): JsonResponse
    {
        $wallet = $request->input('wallet');

        if (!$wallet) {
            return response()->json([
                'success' => false,
                'error' => 'Wallet address required',
            ], 400);
        }

        $stake = StakingTransaction::where('id', $id)
            ->where('wallet_address', $wallet)
            ->first();

        if (!$stake) {
            return response()->json([
                'success' => false,
                'error' => 'Stake not found',
            ], 404);
        }

        if (!$stake->isClaimable()) {
            return response()->json([
                'success' => false,
                'error' => 'Stake not yet claimable',
                'unlocks_at' => $stake->unlocks_at->toIso8601String(),
                'remaining_seconds' => $stake->getRemainingSeconds(),
            ], 400);
        }

        // Mark as claimed
        $stake->update([
            'status' => 'claimed',
            'claimed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Stake claimed successfully',
            'stake' => $stake->fresh()->toApiArray(),
            'payout' => [
                'principal' => $stake->amount,
                'reward' => $stake->reward_amount,
                'total' => $stake->amount + $stake->reward_amount,
            ],
        ]);
    }

    // ========================================================================
    // ADMIN ENDPOINTS
    // ========================================================================

    /**
     * Get all stakes (admin)
     */
    public function adminList(Request $request): JsonResponse
    {
        $query = StakingTransaction::query();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($wallet = $request->input('wallet')) {
            $query->where('wallet_address', 'like', "%{$wallet}%");
        }

        $stakes = $query->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $stakes->items(),
            'pagination' => [
                'current_page' => $stakes->currentPage(),
                'last_page' => $stakes->lastPage(),
                'per_page' => $stakes->perPage(),
                'total' => $stakes->total(),
            ],
            'summary' => [
                'total_staked' => StakingTransaction::active()->sum('amount'),
                'total_pending_rewards' => StakingTransaction::active()->sum('reward_amount'),
                'active_count' => StakingTransaction::active()->count(),
                'claimable_count' => StakingTransaction::claimable()->count(),
            ],
        ]);
    }

    /**
     * Get staking stats (admin)
     */
    public function adminStats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'stats' => [
                'total_staked' => StakingTransaction::active()->sum('amount'),
                'total_pending_rewards' => StakingTransaction::active()->sum('reward_amount'),
                'total_claimed_rewards' => StakingTransaction::where('status', 'claimed')->sum('reward_amount'),
                'active_stakes' => StakingTransaction::active()->count(),
                'completed_stakes' => StakingTransaction::where('status', 'claimed')->count(),
                'by_tier' => [
                    1 => StakingTransaction::active()->where('tier', 1)->count(),
                    2 => StakingTransaction::active()->where('tier', 2)->count(),
                    3 => StakingTransaction::active()->where('tier', 3)->count(),
                ],
            ],
        ]);
    }
}
