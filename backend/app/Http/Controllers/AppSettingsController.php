<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AppSettingsController extends Controller
{
    /**
     * Get all settings (admin only)
     */
    public function index(): JsonResponse
    {
        $settings = AppSetting::getAllGrouped();

        return response()->json([
            'success' => true,
            'settings' => $settings,
        ]);
    }

    /**
     * Get public settings (for frontend)
     */
    public function public(): JsonResponse
    {
        $settings = AppSetting::getPublic();

        return response()->json([
            'success' => true,
            'settings' => $settings,
        ]);
    }

    /**
     * Update settings (admin only)
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable',
        ]);

        $updated = AppSetting::bulkUpdate($validated['settings']);

        return response()->json([
            'success' => true,
            'message' => "Updated {$updated} settings",
            'updated_count' => $updated,
        ]);
    }

    /**
     * Update a single setting (admin only)
     */
    public function updateSingle(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'nullable',
        ]);

        $success = AppSetting::set($key, $validated['value']);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => "Setting '{$key}' not found",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => "Updated setting '{$key}'",
        ]);
    }

    /**
     * Clear settings cache
     */
    public function clearCache(): JsonResponse
    {
        AppSetting::clearCache();

        return response()->json([
            'success' => true,
            'message' => 'Settings cache cleared',
        ]);
    }

    /**
     * Get current network configuration
     */
    public function networkConfig(): JsonResponse
    {
        $config = [
            'network' => AppSetting::get('network_mode', 'devnet'),
            'rpc_url' => AppSetting::get('rpc_url'),
            'token' => [
                'mint' => AppSetting::get('token_mint'),
                'symbol' => AppSetting::get('token_symbol', 'TOKEN'),
                'decimals' => AppSetting::get('token_decimals', 9),
                'logo' => AppSetting::get('token_logo_url'),
            ],
            'program_id' => AppSetting::get('program_id'),
        ];

        return response()->json([
            'success' => true,
            'config' => $config,
        ]);
    }

    /**
     * Switch between devnet and mainnet
     */
    public function switchNetwork(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'network' => 'required|in:devnet,mainnet-beta',
        ]);

        $network = $validated['network'];

        // Update network mode
        AppSetting::set('network_mode', $network);

        // Update RPC URL based on network
        if ($network === 'devnet') {
            AppSetting::set('rpc_url', 'https://api.devnet.solana.com');
            AppSetting::set('jupiter_enabled', false);
            AppSetting::set('swap_enabled', false);
        } else {
            // Use mainnet RPC if configured
            $mainnetRpc = AppSetting::get('rpc_url_mainnet');
            if ($mainnetRpc) {
                AppSetting::set('rpc_url', $mainnetRpc);
            } else {
                AppSetting::set('rpc_url', 'https://api.mainnet-beta.solana.com');
            }
            AppSetting::set('jupiter_enabled', true);
            AppSetting::set('swap_enabled', true);
        }

        return response()->json([
            'success' => true,
            'message' => "Switched to {$network}",
            'network' => $network,
        ]);
    }
}
