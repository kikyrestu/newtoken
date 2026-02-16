<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BurnController;
use App\Http\Controllers\LockController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\SettingsController;

/*
|--------------------------------------------------------------------------
| API Routes - Mission Launchpad
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', [StatsController::class, 'healthCheck']);

// Site Settings (public read ONLY)
Route::get('/settings', [SettingsController::class, 'getMultiple']);
Route::get('/settings/{key}', [SettingsController::class, 'get']);
// SECURITY FIX [API-1]: PUT/DELETE moved to admin group below (were previously public)

// Public routes
Route::get('/pricing', [LockController::class, 'getPricing']);
Route::get('/pricing/tiers', [LockController::class, 'getTierPricing']); // Early buyer discounts
Route::get('/stats', [StatsController::class, 'getGlobalStats']);
Route::get('/stats/leaderboard', [StatsController::class, 'getLeaderboard']);
Route::get('/stats/tiers', [StatsController::class, 'getTierDistribution']);

// Lock verification (rate limited)
Route::post('/lock/verify', [LockController::class, 'verifyLock'])
    ->middleware('throttle:' . config('solana.rate_limits.verify_lock', 10) . ',1');

// Unlock verification (rate limited)
Route::post('/unlock/verify', [LockController::class, 'verifyUnlock'])
    ->middleware('throttle:' . config('solana.rate_limits.verify_lock', 10) . ',1');

// User dashboard
Route::get('/user/{wallet}/dashboard', [LockController::class, 'getUserDashboard']);
Route::get('/user/{wallet}/next-unlock', [LockController::class, 'getNextUnlock']);

// Lightweight endpoint for polling - returns hash of latest unlock data
Route::get('/countdown-version', [StatsController::class, 'getCountdownVersion']);

// Auth protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Legacy burn callback (existing)
Route::post('/burn-callback', [BurnController::class, 'burnCallback']);

// Admin Authentication Routes (no auth middleware — these are login/logout/verify)
Route::prefix('admin/auth')->group(function () {
    Route::post('/login', [\App\Http\Controllers\AdminAuthController::class, 'login'])
        ->middleware('throttle:5,1'); // 5 attempts per minute
    Route::post('/logout', [\App\Http\Controllers\AdminAuthController::class, 'logout']);
    Route::get('/verify', [\App\Http\Controllers\AdminAuthController::class, 'verify']);
});

// SECURITY FIX [API-2]: All admin routes now protected by admin.auth middleware at route level
Route::prefix('admin')->middleware(['admin.auth', 'throttle:60,1'])->group(function () {
    // Dashboard & Stats
    Route::get('/overview', [\App\Http\Controllers\AdminController::class, 'getOverview']);
    Route::get('/stats/detailed', [\App\Http\Controllers\AdminController::class, 'getDetailedStats']);
    Route::get('/users', [\App\Http\Controllers\AdminController::class, 'getUsers']);
    Route::get('/transactions', [\App\Http\Controllers\AdminController::class, 'getTransactions']);
    Route::post('/transactions/{id}/force-unlock', [\App\Http\Controllers\AdminController::class, 'forceUnlock']);
    Route::get('/tier-config', [\App\Http\Controllers\AdminController::class, 'getTierConfig']);
    Route::put('/tier-config', [\App\Http\Controllers\AdminController::class, 'updateTierConfig']);
    Route::get('/all-settings', [\App\Http\Controllers\AdminController::class, 'getAllSettings']);

    // Site Settings (write operations — FIX for [API-1])
    Route::put('/settings/{key}', [SettingsController::class, 'update']);
    Route::delete('/settings/{key}', [SettingsController::class, 'delete']);

    // App Settings (Network, Token, Features)
    Route::get('/app-settings', [\App\Http\Controllers\AppSettingsController::class, 'index']);
    Route::post('/app-settings', [\App\Http\Controllers\AppSettingsController::class, 'update']);
    Route::put('/app-settings/{key}', [\App\Http\Controllers\AppSettingsController::class, 'updateSingle']);
    Route::post('/app-settings/clear-cache', [\App\Http\Controllers\AppSettingsController::class, 'clearCache']);
    Route::post('/app-settings/switch-network', [\App\Http\Controllers\AppSettingsController::class, 'switchNetwork']);

    // Encryption endpoints for sensitive config fields
    Route::post('/app-settings/{key}/encrypt', [\App\Http\Controllers\AppSettingsController::class, 'encryptField']);
    Route::get('/app-settings/{key}/encrypted', [\App\Http\Controllers\AppSettingsController::class, 'isEncrypted']);

    // Mission Management (Admin CRUD)
    Route::get('/missions', [\App\Http\Controllers\MissionController::class, 'adminIndex']);
    Route::post('/missions', [\App\Http\Controllers\MissionController::class, 'store']);
    Route::put('/missions/{id}', [\App\Http\Controllers\MissionController::class, 'update']);
    Route::delete('/missions/{id}', [\App\Http\Controllers\MissionController::class, 'destroy']);
    Route::post('/missions/reorder', [\App\Http\Controllers\MissionController::class, 'reorder']);

    // Staking admin routes (deduplicated — FIX for [SK-3])
    Route::get('/staking', [\App\Http\Controllers\StakingController::class, 'adminList']);
    Route::get('/staking/stats', [\App\Http\Controllers\StakingController::class, 'adminStats']);

    // Audit logs
    Route::get('/audit-logs', [\App\Http\Controllers\AdminController::class, 'getAuditLogs']);
});

// Public app settings (for frontend)
Route::get('/app-config', [\App\Http\Controllers\AppSettingsController::class, 'public']);
Route::get('/network-config', [\App\Http\Controllers\AppSettingsController::class, 'networkConfig']);

// Public missions (for user dashboard)
Route::get('/missions', [\App\Http\Controllers\MissionController::class, 'index']);
Route::get('/missions/{id}', [\App\Http\Controllers\MissionController::class, 'show']);

// ============================================================================
// STAKING ROUTES
// ============================================================================

// Public staking info
Route::get('/staking/tiers', [\App\Http\Controllers\StakingController::class, 'getTiers']);
Route::post('/staking/calculate', [\App\Http\Controllers\StakingController::class, 'calculateReward']);

// User staking endpoints
Route::get('/staking/my-stakes', [\App\Http\Controllers\StakingController::class, 'getMyStakes']);
Route::post('/staking/stake', [\App\Http\Controllers\StakingController::class, 'stake'])
    ->middleware('throttle:10,1');
Route::post('/staking/{id}/claim', [\App\Http\Controllers\StakingController::class, 'claim'])
    ->middleware('throttle:10,1');
