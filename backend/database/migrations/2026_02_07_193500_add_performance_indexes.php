<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds indexes for performance optimization as identified in audit
     */
    public function up(): void
    {
        // Lock transactions indexes
        Schema::table('lock_transactions', function (Blueprint $table) {
            $table->index('signature', 'idx_lock_signature');
            $table->index(['user_wallet_id', 'status'], 'idx_lock_wallet_status');
        });

        // Staking transactions indexes  
        Schema::table('staking_transactions', function (Blueprint $table) {
            $table->index('signature', 'idx_staking_signature');
            $table->index(['wallet_address', 'status'], 'idx_staking_wallet_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lock_transactions', function (Blueprint $table) {
            $table->dropIndex('idx_lock_signature');
            $table->dropIndex('idx_lock_wallet_status');
        });

        Schema::table('staking_transactions', function (Blueprint $table) {
            $table->dropIndex('idx_staking_signature');
            $table->dropIndex('idx_staking_wallet_status');
        });
    }
};
