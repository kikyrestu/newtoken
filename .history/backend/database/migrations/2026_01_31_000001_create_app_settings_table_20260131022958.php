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
        Schema::create('app_settings', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->text('value')->nullable();
            $table->string('type', 20)->default('string'); // string, boolean, integer, float, json
            $table->string('group', 50)->default('general'); // network, token, features, pricing
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Seed default settings
        $this->seedDefaults();
    }

    /**
     * Seed default settings for devnet
     */
    private function seedDefaults(): void
    {
        $defaults = [
            // Network Configuration
            ['key' => 'network_mode', 'value' => 'devnet', 'type' => 'string', 'group' => 'network', 'description' => 'Solana network (devnet/mainnet-beta)'],
            ['key' => 'rpc_url', 'value' => 'https://api.devnet.solana.com', 'type' => 'string', 'group' => 'network', 'description' => 'Solana RPC endpoint'],
            ['key' => 'rpc_url_mainnet', 'value' => '', 'type' => 'string', 'group' => 'network', 'description' => 'Mainnet RPC endpoint (Helius/Quicknode)'],
            
            // Token Configuration
            ['key' => 'token_mint', 'value' => '', 'type' => 'string', 'group' => 'token', 'description' => 'SPL Token mint address'],
            ['key' => 'token_symbol', 'value' => 'TEST', 'type' => 'string', 'group' => 'token', 'description' => 'Token symbol for display'],
            ['key' => 'token_decimals', 'value' => '9', 'type' => 'integer', 'group' => 'token', 'description' => 'Token decimal places'],
            ['key' => 'token_logo_url', 'value' => '', 'type' => 'string', 'group' => 'token', 'description' => 'Token logo image URL'],
            
            // Pricing Configuration
            ['key' => 'jupiter_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'pricing', 'description' => 'Enable Jupiter price oracle'],
            ['key' => 'fallback_price_usd', 'value' => '0.000025', 'type' => 'float', 'group' => 'pricing', 'description' => 'Fallback token price in USD when Jupiter is disabled'],
            ['key' => 'price_refresh_seconds', 'value' => '60', 'type' => 'integer', 'group' => 'pricing', 'description' => 'How often to refresh price from Jupiter'],
            
            // Feature Toggles
            ['key' => 'swap_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'features', 'description' => 'Enable Jupiter swap feature'],
            ['key' => 'demo_mode', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'description' => 'Demo mode - uses simulated transactions'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'group' => 'features', 'description' => 'Put site in maintenance mode'],
            
            // Program Configuration
            ['key' => 'program_id', 'value' => '', 'type' => 'string', 'group' => 'program', 'description' => 'Deployed Anchor program ID'],
            ['key' => 'lock_vault_address', 'value' => '', 'type' => 'string', 'group' => 'program', 'description' => 'Token vault address for locked tokens'],
        ];

        foreach ($defaults as $setting) {
            DB::table('app_settings')->insert(array_merge($setting, [
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
        Schema::dropIfExists('app_settings');
    }
};
