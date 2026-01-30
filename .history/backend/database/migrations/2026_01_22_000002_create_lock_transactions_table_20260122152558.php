<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lock_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_wallet_id')->constrained('user_wallets')->cascadeOnDelete();
            $table->string('signature', 128)->unique()->comment('Solana transaction signature');
            $table->string('escrow_pda', 64)->comment('Program Derived Address for escrow');
            $table->unsignedBigInteger('amount')->comment('Token amount in smallest unit (lamports)');
            $table->string('tier', 20)->comment('spectator, operator, elite');
            $table->unsignedInteger('lock_duration_days')->default(30);
            $table->timestamp('lock_timestamp')->comment('When tokens were locked');
            $table->timestamp('unlock_timestamp')->comment('When tokens can be unlocked');
            $table->string('status', 20)->default('locked')->comment('locked, unlocked, expired, cancelled');
            $table->decimal('usd_value_at_lock', 12, 2)->comment('USD value at time of lock');
            $table->decimal('token_price_at_lock', 18, 10)->nullable()->comment('Token price in USD when locked');
            $table->timestamps();
            
            $table->index(['user_wallet_id', 'status']);
            $table->index('signature');
            $table->index('unlock_timestamp');
            $table->index('tier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lock_transactions');
    }
};
