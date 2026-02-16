<?php

namespace App\Http\Controllers;

use App\Models\StakingTransaction;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class StakingController extends Controller
{
    // ========================================================================
    // ADMIN AUTH HELPER
    // ========================================================================

    /**
     * Verify admin token from database
     */
    private function getAdminOrFail(Request $request): Admin|JsonResponse
    {
        $token = $request->header('X-Admin-Token');
        
        if (!$token) {
            return response()->json(['error' => 'No token provided'], 401);
        }

        $admin = Admin::findByToken($token);
        
        if (!$admin) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        return $admin;
    }

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
            'wallet' => 'required|string|min:43|max:44', // Solana addresses are 43-44 chars base58
            'tier' => 'required|integer|in:1,2,3',
            'amount' => 'required|numeric|min:0.000001',
            'signature' => 'required|string|min:86|max:88', // Solana signatures are 86-88 chars base58
            'usd_value' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
            ], 422);
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

        // FIX [SK-2]: Verify stake transaction on-chain before recording
        try {
            $solana = new \App\Services\SolanaListenerService();
            $verification = $this->verifyClaimTransaction(
                $solana,
                $request->signature,
                $request->wallet
            );

            if (!$verification['valid']) {
                return response()->json([
                    'success' => false,
                    'error' => 'On-chain verification failed: ' . ($verification['error'] ?? 'Unknown'),
                ], 400);
            }
        } catch (\Exception $e) {
            \Log::error('Stake on-chain verification failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to verify stake transaction on-chain',
            ], 500);
        }

        // Use DB transaction to prevent race condition on signature check
        try {
            \DB::beginTransaction();

            // Double check signature inside transaction to prevent race condition
            if (StakingTransaction::where('signature', $request->signature)->exists()) {
                \DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error' => 'Transaction signature already used',
                ], 409);
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

            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stake created successfully',
                'stake' => $stake->toApiArray(),
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            \DB::rollBack();
            // Handle unique constraint violation (duplicate signature)
            if ($e->getCode() == '23000') {
                return response()->json([
                    'success' => false,
                    'error' => 'Transaction signature already used',
                ], 409);
            }
            throw $e;
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Stake creation failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to create stake',
            ], 500);
        }
    }

    /**
     * Claim a matured stake
     * SECURITY FIX [SK-1]: Now requires on-chain verification
     */
    public function claim(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'wallet' => 'required|string|min:43|max:44',
            'claim_signature' => 'required|string|min:86|max:88',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
            ], 422);
        }

        $wallet = $request->input('wallet');

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

        // Verify claim signature not already used
        $existingClaim = StakingTransaction::where('claim_signature', $request->claim_signature)->first();
        if ($existingClaim) {
            return response()->json([
                'success' => false,
                'error' => 'Claim signature already used',
            ], 409);
        }

        // On-chain verification: verify the claim transaction
        try {
            $solana = new \App\Services\SolanaListenerService();
            $verification = $this->verifyClaimTransaction(
                $solana,
                $request->claim_signature,
                $wallet
            );

            if (!$verification['valid']) {
                return response()->json([
                    'success' => false,
                    'error' => 'On-chain verification failed: ' . ($verification['error'] ?? 'Unknown'),
                ], 400);
            }
        } catch (\Exception $e) {
            \Log::error('Claim on-chain verification failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to verify claim transaction on-chain',
            ], 500);
        }

        // Mark as claimed
        $stake->update([
            'status' => 'claimed',
            'claimed_at' => now(),
            'claim_signature' => $request->claim_signature,
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

    /**
     * Verify a claim transaction on-chain
     * Checks that the transaction was successful and the wallet was a signer
     */
    private function verifyClaimTransaction(
        \App\Services\SolanaListenerService $solana,
        string $signature,
        string $wallet
    ): array {
        try {
            $http = \Illuminate\Support\Facades\Http::timeout(30);
            if (config('app.env') === 'local') {
                $http->withoutVerifying();
            }

            $rpcEndpoint = \App\Models\AppSetting::get('rpc_url', '')
                ?: config('solana.rpc_endpoint', 'https://api.mainnet-beta.solana.com');

            $response = $http->post($rpcEndpoint, [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'getTransaction',
                'params' => [
                    $signature,
                    [
                        'encoding' => 'jsonParsed',
                        'commitment' => 'confirmed',
                        'maxSupportedTransactionVersion' => 0
                    ]
                ]
            ]);

            if (!$response->successful()) {
                return ['valid' => false, 'error' => 'RPC request failed'];
            }

            $result = $response->json();

            if (isset($result['error'])) {
                return ['valid' => false, 'error' => $result['error']['message'] ?? 'RPC error'];
            }

            if (!isset($result['result'])) {
                return ['valid' => false, 'error' => 'Transaction not found'];
            }

            $tx = $result['result'];

            // Check transaction succeeded
            if (($tx['meta']['err'] ?? null) !== null) {
                return ['valid' => false, 'error' => 'Transaction failed on-chain'];
            }

            // Verify wallet was a signer
            $accountKeys = $tx['transaction']['message']['accountKeys'] ?? [];
            $walletSigned = false;
            foreach ($accountKeys as $account) {
                $pubkey = is_array($account) ? ($account['pubkey'] ?? '') : $account;
                $signer = is_array($account) ? ($account['signer'] ?? false) : false;
                if ($pubkey === $wallet && $signer) {
                    $walletSigned = true;
                    break;
                }
            }

            if (!$walletSigned) {
                return ['valid' => false, 'error' => 'Wallet was not a signer'];
            }

            return ['valid' => true];
        } catch (\Exception $e) {
            return ['valid' => false, 'error' => $e->getMessage()];
        }
    }

    // ========================================================================
    // ADMIN ENDPOINTS
    // ========================================================================

    /**
     * Get all stakes (admin)
     */
    public function adminList(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

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
    public function adminStats(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

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
