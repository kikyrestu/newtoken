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
        Schema::create('global_stats', function (Blueprint $table) {
            $table->id();
            $table->string('key', 64)->unique();
            $table->text('value');
            $table->string('type', 20)->default('string')->comment('string, integer, float, json');
            $table->timestamps();
            
            $table->index('key');
        });

        // Seed initial stats
        $initialStats = [
            ['key' => 'total_locked_tokens', 'value' => '0', 'type' => 'integer'],
            ['key' => 'total_locked_usd', 'value' => '0', 'type' => 'float'],
            ['key' => 'total_spectators', 'value' => '0', 'type' => 'integer'],
            ['key' => 'total_operators', 'value' => '0', 'type' => 'integer'],
            ['key' => 'total_elite', 'value' => '0', 'type' => 'integer'],
            ['key' => 'active_locks', 'value' => '0', 'type' => 'integer'],
            ['key' => 'total_participants', 'value' => '0', 'type' => 'integer'],
        ];

        foreach ($initialStats as $stat) {
            DB::table('global_stats')->insert(array_merge($stat, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('global_stats');
    }
};
