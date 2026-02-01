<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductionDataSeeder extends Seeder
{
    /**
     * Seed production data exported from SQLite
     */
    public function run(): void
    {
        // Site Settings
        DB::table('site_settings')->insertOrIgnore([
            [
                'id' => 1,
                'key' => 'timer-device-position',
                'value' => '{"x":0,"y":-8.5,"scale":1.1,"digitOffsetX":0,"digitOffsetY":6,"digitScale":1.1}',
                'created_at' => '2026-01-28 21:31:02',
                'updated_at' => '2026-01-29 20:11:11'
            ]
        ]);

        // App Settings
        $appSettings = [
            ['key' => 'network_mode', 'value' => 'devnet', 'type' => 'string', 'group' => 'network', 'description' => 'Solana network (devnet/mainnet-beta)'],
            ['key' => 'rpc_url', 'value' => 'https://api.devnet.solana.com', 'type' => 'string', 'group' => 'network', 'description' => 'Solana RPC endpoint'],
            ['key' => 'rpc_url_mainnet', 'value' => '', 'type' => 'string', 'group' => 'network', 'description' => 'Mainnet RPC endpoint (Helius/Quicknode)'],
            ['key' => 'token_mint', 'value' => '', 'type' => 'string', 'group' => 'token', 'description' => 'SPL Token mint address'],
            ['key' => 'token_symbol', 'value' => 'TEST', 'type' => 'string', 'group' => 'token', 'description' => 'Token symbol for display'],
            ['key' => 'token_decimals', 'value' => '9', 'type' => 'integer', 'group' => 'token', 'description' => 'Token decimal places'],
            ['key' => 'token_logo_url', 'value' => '', 'type' => 'string', 'group' => 'token', 'description' => 'Token logo image URL'],
            ['key' => 'jupiter_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'pricing', 'description' => 'Enable Jupiter price oracle'],
            ['key' => 'fallback_price_usd', 'value' => '0.000025', 'type' => 'float', 'group' => 'pricing', 'description' => 'Fallback token price in USD when Jupiter is disabled'],
            ['key' => 'price_refresh_seconds', 'value' => '60', 'type' => 'integer', 'group' => 'pricing', 'description' => 'How often to refresh price from Jupiter'],
            ['key' => 'swap_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'features', 'description' => 'Enable Jupiter swap feature'],
            ['key' => 'demo_mode', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'description' => 'Demo mode - uses simulated transactions'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'group' => 'features', 'description' => 'Put site in maintenance mode'],
            ['key' => 'program_id', 'value' => '', 'type' => 'string', 'group' => 'program', 'description' => 'Deployed Anchor program ID'],
            ['key' => 'lock_vault_address', 'value' => '', 'type' => 'string', 'group' => 'program', 'description' => 'Token vault address for locked tokens'],
        ];
        
        foreach ($appSettings as $setting) {
            $setting['created_at'] = now();
            $setting['updated_at'] = now();
            DB::table('app_settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }

        // Tier Counters
        $tiers = ['spectator', 'operator', 'elite'];
        foreach ($tiers as $tier) {
            DB::table('tier_counters')->updateOrInsert(
                ['tier' => $tier],
                ['purchase_count' => 0, 'created_at' => now(), 'updated_at' => now()]
            );
        }

        // Global Stats
        $globalStats = [
            ['key' => 'total_locked_tokens', 'value' => '0', 'type' => 'integer'],
            ['key' => 'total_locked_usd', 'value' => '0', 'type' => 'float'],
            ['key' => 'total_spectators', 'value' => '0', 'type' => 'integer'],
            ['key' => 'total_operators', 'value' => '0', 'type' => 'integer'],
            ['key' => 'total_elite', 'value' => '0', 'type' => 'integer'],
            ['key' => 'active_locks', 'value' => '0', 'type' => 'integer'],
            ['key' => 'total_participants', 'value' => '0', 'type' => 'integer'],
        ];
        
        foreach ($globalStats as $stat) {
            DB::table('global_stats')->updateOrInsert(
                ['key' => $stat['key']],
                array_merge($stat, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        $this->command->info('Production data seeded successfully!');
    }
}
