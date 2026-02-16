<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds stats fields that were missing from UserWallet model
     */
    public function up(): void
    {
        Schema::table('user_wallets', function (Blueprint $table) {
            $table->integer('mission_points')->default(0)->after('missions_completed');
            $table->decimal('total_earned', 18, 0)->default(0)->after('mission_points');
            $table->decimal('total_burned', 18, 0)->default(0)->after('total_earned');
            $table->integer('missions_canceled')->default(0)->after('total_burned');
            $table->integer('missions_failed')->default(0)->after('missions_canceled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_wallets', function (Blueprint $table) {
            $table->dropColumn([
                'mission_points',
                'total_earned',
                'total_burned',
                'missions_canceled',
                'missions_failed',
            ]);
        });
    }
};
