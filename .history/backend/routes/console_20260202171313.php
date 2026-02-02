<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\AutoUnlockService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Auto-Unlock Command
 * 
 * Processes all matured locks and marks them as pending_unlock.
 * Run manually: php artisan unlock:process
 * Scheduled: Every minute via Laravel Scheduler
 */
Artisan::command('unlock:process', function () {
    $this->info('🔓 Processing auto-unlocks...');
    
    $service = new AutoUnlockService();
    $result = $service->processMaturedLocks();
    
    $this->info("Processed: {$result['processed']}");
    $this->info("Success: {$result['success']}");
    $this->info("Failed: {$result['failed']}");
    
    if (!empty($result['errors'])) {
        $this->warn('Errors:');
        foreach ($result['errors'] as $error) {
            $this->warn("  - {$error}");
        }
    }
    
    $this->info('✅ Auto-unlock processing complete');
})->purpose('Process automatic unlocks for matured token locks');

/**
 * Schedule the auto-unlock command to run every minute
 */
Schedule::command('unlock:process')->everyMinute();
