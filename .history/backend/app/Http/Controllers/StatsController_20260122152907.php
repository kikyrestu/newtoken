<?php

namespace App\Http\Controllers;

use App\Models\GlobalStat;
use App\Models\UserWallet;
use App\Models\LockTransaction;
use App\Services\PriceOracleService;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    public function __construct(
        private PriceOracleService $priceService
    ) {}

    /**
     * Get global platform statistics
     * GET /api/stats
     */
    public function getGlobalStats(): JsonResponse
    {
        $stats = GlobalStat::getAllStats();

        // Get active locks count from database for accuracy
        $activeLocks = LockTransaction::active()->count();
        
        // Get recent activity
        $recentLocks = LockTransaction::with('userWallet')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($tx) => [
                'wallet' => $this->maskWallet($tx->userWallet->wallet_address),
                'tier' => $tx->tier,
                'amount_formatted' => $tx->formatted_amount,
                'usd_value' => $tx->usd_value_at_lock,
                'locked_at' => $tx->lock_timestamp->diffForHumans(),
            ]);

        // Format total locked tokens
        $totalLockedFormatted = number_format(
            ($stats[GlobalStat::KEY_TOTAL_LOCKED_TOKENS] ?? 0) / 1_000_000_000,
            0
        );

        return response()->json([
            'success' => true,
            'data' => [
                'total_locked_tokens' => $stats[GlobalStat::KEY_TOTAL_LOCKED_TOKENS] ?? 0,
                'total_locked_formatted' => $totalLockedFormatted,
                'total_locked_usd' => $stats[GlobalStat::KEY_TOTAL_LOCKED_USD] ?? 0,
                'active_locks' => $activeLocks,
                'total_participants' => $stats[GlobalStat::KEY_TOTAL_PARTICIPANTS] ?? 0,
                'tier_breakdown' => [
                    'spectators' => $stats[GlobalStat::KEY_TOTAL_SPECTATORS] ?? 0,
                    'operators' => $stats[GlobalStat::KEY_TOTAL_OPERATORS] ?? 0,
                    'elite' => $stats[GlobalStat::KEY_TOTAL_ELITE] ?? 0,
                ],
                'recent_activity' => $recentLocks,
                'updated_at' => now()->toISOString()
            ]
        ]);
    }

    /**
     * Get leaderboard data
     * GET /api/stats/leaderboard
     */
    public function getLeaderboard(): JsonResponse
    {
        $topLockers = UserWallet::orderByDesc('total_locked_amount')
            ->limit(20)
            ->get()
            ->map(fn($wallet, $index) => [
                'rank' => $index + 1,
                'wallet' => $this->maskWallet($wallet->wallet_address),
                'tier' => $wallet->current_tier,
                'total_locked' => $wallet->total_locked_amount,
                'total_locked_formatted' => $wallet->formatted_locked_amount,
                'missions_completed' => $wallet->missions_completed,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'leaderboard' => $topLockers,
                'updated_at' => now()->toISOString()
            ]
        ]);
    }

    /**
     * Get tier distribution
     * GET /api/stats/tiers
     */
    public function getTierDistribution(): JsonResponse
    {
        $distribution = LockTransaction::active()
            ->selectRaw('tier, COUNT(*) as count, SUM(amount) as total_amount')
            ->groupBy('tier')
            ->get()
            ->mapWithKeys(fn($item) => [
                $item->tier => [
                    'count' => $item->count,
                    'total_amount' => $item->total_amount,
                    'total_amount_formatted' => number_format($item->total_amount / 1_000_000_000, 2),
                ]
            ]);

        // Ensure all tiers are present
        $allTiers = ['spectator', 'operator', 'elite'];
        foreach ($allTiers as $tier) {
            if (!isset($distribution[$tier])) {
                $distribution[$tier] = [
                    'count' => 0,
                    'total_amount' => 0,
                    'total_amount_formatted' => '0',
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'distribution' => $distribution,
                'updated_at' => now()->toISOString()
            ]
        ]);
    }

    /**
     * Health check endpoint
     * GET /api/health
     */
    public function healthCheck(): JsonResponse
    {
        $priceHealth = $this->priceService->healthCheck();
        
        $dbHealth = true;
        try {
            UserWallet::count();
        } catch (\Exception $e) {
            $dbHealth = false;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $dbHealth && $priceHealth['healthy'] ? 'healthy' : 'degraded',
                'database' => $dbHealth ? 'ok' : 'error',
                'price_oracle' => $priceHealth,
                'timestamp' => now()->toISOString()
            ]
        ]);
    }

    /**
     * Mask wallet address for public display
     */
    private function maskWallet(string $wallet): string
    {
        if (strlen($wallet) < 10) {
            return $wallet;
        }
        
        return substr($wallet, 0, 4) . '...' . substr($wallet, -4);
    }
}
