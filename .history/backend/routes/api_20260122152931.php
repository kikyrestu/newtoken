<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BurnController;
use App\Http\Controllers\LockController;
use App\Http\Controllers\StatsController;

/*
|--------------------------------------------------------------------------
| API Routes - Mission Launchpad
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', [StatsController::class, 'healthCheck']);

// Public routes
Route::get('/pricing', [LockController::class, 'getPricing']);
Route::get('/stats', [StatsController::class, 'getGlobalStats']);
Route::get('/stats/leaderboard', [StatsController::class, 'getLeaderboard']);
Route::get('/stats/tiers', [StatsController::class, 'getTierDistribution']);

// Lock verification (rate limited)
Route::post('/lock/verify', [LockController::class, 'verifyLock'])
    ->middleware('throttle:' . config('solana.rate_limits.verify_lock', 10) . ',1');

// User dashboard
Route::get('/user/{wallet}/dashboard', [LockController::class, 'getUserDashboard']);
Route::get('/user/{wallet}/next-unlock', [LockController::class, 'getNextUnlock']);

// Auth protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Legacy burn callback (existing)
Route::post('/burn-callback', [BurnController::class, 'burnCallback']);

