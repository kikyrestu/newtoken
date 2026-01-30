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

// Site Settings (public read, admin write)
Route::get('/settings', [SettingsController::class, 'getMultiple']);
Route::get('/settings/{key}', [SettingsController::class, 'get']);
Route::put('/settings/{key}', [SettingsController::class, 'update']);
Route::delete('/settings/{key}', [SettingsController::class, 'delete']);

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

// Admin Routes
Route::prefix('admin')->group(function () {
    Route::get('/overview', [\App\Http\Controllers\AdminController::class, 'getOverview']);
    Route::get('/users', [\App\Http\Controllers\AdminController::class, 'getUsers']);
    Route::get('/transactions', [\App\Http\Controllers\AdminController::class, 'getTransactions']);
});

