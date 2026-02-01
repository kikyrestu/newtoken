<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds fields needed for unlock tracking
     */
    public function up(): void
    {
        Schema::table('lock_transactions', function (Blueprint $table) {
            $table->timestamp('unlocked_at')->nullable()->after('unlock_timestamp');
            $table->string('unlock_signature', 100)->nullable()->after('unlocked_at');
            $table->boolean('admin_unlocked')->default(false)->after('unlock_signature');
            
            // Index for faster queries
            $table->index(['status', 'unlock_timestamp']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lock_transactions', function (Blueprint $table) {
            $table->dropIndex(['status', 'unlock_timestamp']);
            $table->dropColumn(['unlocked_at', 'unlock_signature', 'admin_unlocked']);
        });
    }
};
