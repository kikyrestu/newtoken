<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserWallet;
use App\Models\LockTransaction;
use App\Models\GlobalStats;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Get overview statistics for the dashboard
     */
    public function getOverview(Request $request)
    {
        // Simple security check (in production use Middleware)
        if ($request->header('X-Admin-Token') !== env('ADMIN_ACCESS_TOKEN', 'admin-secret-123')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Calculate Revenue (Approximation in USD)
        // In real app, you might sum 'usd_value_at_lock' from lock_transactions
        $totalRevenue = LockTransaction::sum('usd_value_at_lock');
        
        // Total Users
        $totalUsers = UserWallet::count();

        // Active Locks
        $activeLocks = LockTransaction::where('status', 'locked')
            ->where('unlock_timestamp', '>', now())
            ->count();
            
        // Recent activity trend (last 7 days locks)
        $last7Days = LockTransaction::where('created_at', '>=', now()->subDays(7))->count();

        return response()->json([
            'overview' => [
                'revenue_usd' => $totalRevenue,
                'total_users' => $totalUsers,
                'active_locks' => $activeLocks,
                'recent_activity' => $last7Days
            ]
        ]);
    }

    /**
     * Get list of all users
     */
    public function getUsers(Request $request)
    {
        if ($request->header('X-Admin-Token') !== env('ADMIN_ACCESS_TOKEN', 'admin-secret-123')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $users = UserWallet::withCount('lockTransactions')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($users);
    }

    /**
     * Get transaction history
     */
    public function getTransactions(Request $request)
    {
        if ($request->header('X-Admin-Token') !== env('ADMIN_ACCESS_TOKEN', 'admin-secret-123')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $transactions = LockTransaction::with('userWallet')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($transactions);
    }
}
