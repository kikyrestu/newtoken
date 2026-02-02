<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Staking Tiers:
     * - Tier 1: Up to $20, 2 weeks, 20% APR
     * - Tier 2: Up to $50, 4 weeks, 30% APR
     * - Tier 3: Up to $100, 8 weeks, 50% APR
     */
    public function up(): void
    {
        Schema::create('staking_transactions', function (Blueprint $table) {
            $table->id();
            
            // Wallet info
            $table->string('wallet_address', 64)->index();
            $table->string('signature', 128)->unique()->nullable(); // Transaction signature
            
            // Staking tier (1, 2, or 3)
            $table->tinyInteger('tier')->index();
            
            // Amount info
            $table->decimal('amount', 20, 6); // Token amount staked (in lamports / smallest unit)
            $table->decimal('usd_value', 12, 2)->nullable(); // USD value at stake time
            
            // Duration & Interest
            $table->integer('lock_days'); // 14, 28, or 56 days
            $table->decimal('apr_percent', 5, 2); // 20, 30, or 50
            $table->decimal('reward_amount', 20, 6)->nullable(); // Calculated reward
            
            // Timestamps
            $table->timestamp('staked_at');
            $table->timestamp('unlocks_at');
            $table->timestamp('claimed_at')->nullable();
            
            // Status: pending, active, claimable, claimed, canceled
            $table->enum('status', ['pending', 'active', 'claimable', 'claimed', 'canceled'])->default('pending');
            
            $table->timestamps();
            
            // Indexes
            $table->index(['wallet_address', 'status']);
            $table->index('unlocks_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staking_transactions');
    }
};
