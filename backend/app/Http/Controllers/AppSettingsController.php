<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AppSettingsController extends Controller
{
    /**
     * Verify admin token from database
     */
    private function getAdminOrFail(Request $request): Admin|JsonResponse
    {
        $token = $request->header('X-Admin-Token');
        
        if (!$token) {
            return response()->json(['error' => 'No token provided'], 401);
        }

        $admin = Admin::findByToken($token);
        
        if (!$admin) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        return $admin;
    }

    /**
     * Get all settings (admin only)
     */
    public function index(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

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
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable',
        ]);

        $oldSettings = AppSetting::getAllGrouped();
        $updated = AppSetting::bulkUpdate($validated['settings']);

        // Log action
        $admin->logAction('update_app_settings', [
            'target_type' => 'AppSetting',
            'old_value' => $oldSettings,
            'new_value' => $validated['settings'],
            'notes' => "Updated {$updated} settings",
        ]);

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
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        $validated = $request->validate([
            'value' => 'nullable',
        ]);

        $oldValue = AppSetting::get($key);
        $success = AppSetting::set($key, $validated['value']);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => "Setting '{$key}' not found",
            ], 404);
        }

        // Log action
        $admin->logAction('update_app_setting', [
            'target_type' => 'AppSetting',
            'old_value' => [$key => $oldValue],
            'new_value' => [$key => $validated['value']],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Updated setting '{$key}'",
        ]);
    }

    /**
     * Clear settings cache (admin only)
     */
    public function clearCache(Request $request): JsonResponse
    {
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        AppSetting::clearCache();

        // Log action
        $admin->logAction('clear_settings_cache');

        return response()->json([
            'success' => true,
            'message' => 'Settings cache cleared',
        ]);
    }

    /**
     * Get current network configuration (public)
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
     * Switch between devnet and mainnet (admin only)
     */
    public function switchNetwork(Request $request): JsonResponse
    {
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        $validated = $request->validate([
            'network' => 'required|in:devnet,mainnet-beta',
        ]);

        $network = $validated['network'];
        $oldNetwork = AppSetting::get('network_mode');

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

        // Log action
        $admin->logAction('switch_network', [
            'old_value' => ['network' => $oldNetwork],
            'new_value' => ['network' => $network],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Switched to {$network}",
            'network' => $network,
        ]);
    }

    /**
     * Encrypt a sensitive setting field (admin only)
     */
    public function encryptField(Request $request, string $key): JsonResponse
    {
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        // Check if field is in sensitive list
        if (!in_array($key, AppSetting::$sensitiveFields)) {
            return response()->json([
                'success' => false,
                'error' => "Field '{$key}' cannot be encrypted"
            ], 400);
        }

        // Check if already encrypted
        if (AppSetting::isEncrypted($key)) {
            return response()->json([
                'success' => false,
                'error' => "Field '{$key}' is already encrypted"
            ], 400);
        }

        // Get current value and encrypt it
        $currentValue = AppSetting::get($key);
        if (empty($currentValue)) {
            return response()->json([
                'success' => false,
                'error' => "Field '{$key}' is empty, no need to encrypt"
            ], 400);
        }

        $success = AppSetting::setEncrypted($key, $currentValue);

        if ($success) {
            // Log action
            $admin->logAction('encrypt_setting', [
                'target_type' => 'AppSetting',
                'field' => $key,
                'notes' => 'Field encrypted for security'
            ]);
        }

        return response()->json([
            'success' => $success,
            'message' => $success ? "Field '{$key}' successfully encrypted" : "Failed to encrypt field"
        ]);
    }

    /**
     * Check if a setting field is encrypted (admin only)
     */
    public function isEncrypted(Request $request, string $key): JsonResponse
    {
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        $encrypted = AppSetting::isEncrypted($key);
        $isSensitive = in_array($key, AppSetting::$sensitiveFields);

        return response()->json([
            'success' => true,
            'encrypted' => $encrypted,
            'is_sensitive' => $isSensitive,
            'can_encrypt' => $isSensitive && !$encrypted
        ]);
    }
}
