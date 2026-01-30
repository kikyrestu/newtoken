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
        Schema::create('user_wallets', function (Blueprint $table) {
            $table->id();
            $table->string('wallet_address', 64)->unique();
            $table->string('current_tier')->nullable()->comment('spectator, operator, elite');
            $table->unsignedBigInteger('total_locked_amount')->default(0)->comment('Total tokens locked in lamports');
            $table->unsignedInteger('missions_completed')->default(0);
            $table->timestamp('first_lock_at')->nullable();
            $table->timestamps();
            
            $table->index('wallet_address');
            $table->index('current_tier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_wallets');
    }
};
