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
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('difficulty', ['Easy', 'Medium', 'Hard'])->default('Easy');
            $table->string('rewards')->default('0%'); // e.g., "3%"
            $table->string('mission_points')->default('0'); // e.g., "10 - 60 - 100" or "50"
            $table->integer('participants_limit')->default(1000);
            $table->integer('current_participants')->default(0);
            $table->string('start_in')->nullable(); // e.g., "30 days"
            $table->dateTime('start_date')->nullable();
            $table->text('description')->nullable();
            $table->json('objectives')->nullable(); // Array of objectives
            $table->string('requirements')->nullable();
            $table->enum('status', ['draft', 'upcoming', 'active', 'completed'])->default('upcoming');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};
