<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates admin users table for secure authentication
     */
    public function up(): void
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique();
            $table->string('password'); // Bcrypt hashed
            $table->string('api_token', 80)->nullable()->unique();
            $table->timestamp('token_expires_at')->nullable();
            $table->string('role')->default('admin'); // For future RBAC
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->timestamps();
        });

        // Create default admin user with hashed password
        \DB::table('admins')->insert([
            'username' => 'adminDev',
            'password' => Hash::make('V4n7An3w70|<3n'),
            'role' => 'super_admin',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admins');
    }
};
