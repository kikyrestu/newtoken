<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Admin;
use App\Models\AdminAuditLog;
use App\Models\UserWallet;
use App\Models\LockTransaction;
use App\Models\GlobalStats;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Get admin from token or return 401
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

    /**
     * Get overview statistics for the dashboard
     */
    public function getOverview(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

        // Calculate Revenue
        $totalRevenue = LockTransaction::sum('usd_value_at_lock') ?? 0;
        
        // Total Users
        $totalUsers = UserWallet::count();

        // Active Locks
        $activeLocks = LockTransaction::where('status', 'locked')
            ->where('unlock_timestamp', '>', now())
            ->count();
            
        // Recent activity trend (last 7 days locks)
        $last7Days = LockTransaction::where('created_at', '>=', now()->subDays(7))->count();

        // Total tokens locked
        $totalTokensLocked = LockTransaction::where('status', 'locked')->sum('amount') ?? 0;

        // Tier breakdown
        $tierBreakdown = LockTransaction::where('status', 'locked')
            ->select('tier', DB::raw('count(*) as count'), DB::raw('sum(amount) as total_amount'))
            ->groupBy('tier')
            ->get()
            ->keyBy('tier');

        return response()->json([
            'success' => true,
            'overview' => [
                'revenue_usd' => round($totalRevenue, 2),
                'total_users' => $totalUsers,
                'active_locks' => $activeLocks,
                'recent_activity' => $last7Days,
                'total_tokens_locked' => $totalTokensLocked,
                'tier_breakdown' => [
                    'spectator' => $tierBreakdown['spectator'] ?? ['count' => 0, 'total_amount' => 0],
                    'operator' => $tierBreakdown['operator'] ?? ['count' => 0, 'total_amount' => 0],
                    'elite' => $tierBreakdown['elite'] ?? ['count' => 0, 'total_amount' => 0],
                ]
            ]
        ]);
    }

    /**
     * Get detailed stats for charts (last 30 days)
     */
    public function getDetailedStats(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

        // Daily locks for last 30 days
        $dailyLocks = LockTransaction::where('created_at', '>=', now()->subDays(30))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'), DB::raw('sum(usd_value_at_lock) as revenue'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Daily new users
        $dailyUsers = UserWallet::where('created_at', '>=', now()->subDays(30))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'daily_locks' => $dailyLocks,
            'daily_users' => $dailyUsers
        ]);
    }

    /**
     * Get list of all users with pagination
     */
    public function getUsers(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

        $search = $request->query('search', '');
        $perPage = min($request->query('per_page', 20), 100);

        $query = UserWallet::withCount('lockTransactions')
            ->withSum(['lockTransactions as total_locked' => function($q) {
                $q->where('status', 'locked');
            }], 'amount');

        if ($search) {
            $query->where('wallet_address', 'like', "%{$search}%");
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Get transaction history with filters
     */
    public function getTransactions(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

        $status = $request->query('status');
        $tier = $request->query('tier');
        $search = $request->query('search');
        $perPage = min($request->query('per_page', 20), 100);

        $query = LockTransaction::with('userWallet');

        if ($status) {
            $query->where('status', $status);
        }

        if ($tier) {
            $query->where('tier', $tier);
        }

        if ($search) {
            $query->whereHas('userWallet', function($q) use ($search) {
                $q->where('wallet_address', 'like', "%{$search}%");
            });
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Force unlock a transaction (admin override)
     */
    public function forceUnlock(Request $request, $transactionId): JsonResponse
    {
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        $transaction = LockTransaction::find($transactionId);

        if (!$transaction) {
            return response()->json(['success' => false, 'error' => 'Transaction not found'], 404);
        }

        if ($transaction->status !== 'locked') {
            return response()->json(['success' => false, 'error' => 'Transaction is not locked'], 400);
        }

        // Store old values for audit
        $oldValues = $transaction->only(['status', 'unlock_timestamp', 'unlocked_at']);

        // Update transaction status
        $transaction->update([
            'status' => 'unlocked',
            'unlock_timestamp' => now(),
            'unlocked_at' => now(),
            'admin_unlocked' => true
        ]);

        // Log this action for audit trail
        $admin->logAction('force_unlock', [
            'target_type' => 'LockTransaction',
            'target_id' => $transaction->id,
            'old_value' => $oldValues,
            'new_value' => [
                'status' => 'unlocked',
                'admin_unlocked' => true,
            ],
            'notes' => $request->input('reason', 'Admin force unlock'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transaction force unlocked successfully',
            'transaction' => $transaction->fresh()
        ]);
    }

    /**
     * Get tier configuration
     */
    public function getTierConfig(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

        $config = SiteSetting::get('tier_config', [
            'spectator' => [
                'name' => 'Observer',
                'price_usd' => 20,
                'reward_percent' => 3,
                'token_amount' => 2000000,
                'active' => true
            ],
            'operator' => [
                'name' => 'Mission',
                'price_usd' => 120,
                'reward_percent' => 5,
                'token_amount' => 12000000,
                'active' => true
            ],
            'elite' => [
                'name' => 'Mission 1+2',
                'price_usd' => 200,
                'reward_percent' => 8,
                'token_amount' => 20000000,
                'active' => true
            ]
        ]);

        return response()->json([
            'success' => true,
            'tier_config' => $config
        ]);
    }

    /**
     * Update tier configuration
     */
    public function updateTierConfig(Request $request): JsonResponse
    {
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        $config = $request->input('tier_config');

        if (!$config || !is_array($config)) {
            return response()->json(['success' => false, 'error' => 'Invalid tier config'], 400);
        }

        // Get old config for audit
        $oldConfig = SiteSetting::get('tier_config');

        SiteSetting::set('tier_config', $config);

        // Log this action
        $admin->logAction('update_tier_config', [
            'target_type' => 'SiteSetting',
            'target_id' => null,
            'old_value' => $oldConfig,
            'new_value' => $config,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tier configuration updated',
            'tier_config' => $config
        ]);
    }

    /**
     * Get all site settings for admin
     */
    public function getAllSettings(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

        $settings = SiteSetting::all()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }

    /**
     * Get audit logs with pagination
     */
    public function getAuditLogs(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

        $perPage = min($request->query('per_page', 50), 100);
        $action = $request->query('action');

        $query = AdminAuditLog::with('admin:id,username')
            ->orderBy('created_at', 'desc');

        if ($action) {
            $query->where('action', $action);
        }

        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }
}
