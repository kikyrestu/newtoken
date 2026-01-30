<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tier_counters', function (Blueprint $table) {
            $table->string('tier', 20)->primary();
            $table->unsignedInteger('purchase_count')->default(0);
            $table->timestamps();
        });

        // Seed initial data
        DB::table('tier_counters')->insert([
            ['tier' => 'spectator', 'purchase_count' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['tier' => 'operator', 'purchase_count' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['tier' => 'elite', 'purchase_count' => 0, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tier_counters');
    }
};
