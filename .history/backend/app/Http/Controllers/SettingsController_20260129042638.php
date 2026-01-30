<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Get a setting by key
     * GET /api/settings/{key}
     * 
     * Public endpoint - all users can read settings
     */
    public function get(string $key): JsonResponse
    {
        $value = SiteSetting::get($key);

        return response()->json([
            'success' => true,
            'key' => $key,
            'value' => $value
        ]);
    }

    /**
     * Get multiple settings at once
     * GET /api/settings?keys=key1,key2,key3
     * 
     * Public endpoint - all users can read settings
     */
    public function getMultiple(Request $request): JsonResponse
    {
        $keys = explode(',', $request->query('keys', ''));
        $keys = array_filter(array_map('trim', $keys));

        if (empty($keys)) {
            return response()->json([
                'success' => false,
                'error' => 'No keys provided'
            ], 400);
        }

        $values = SiteSetting::getMultiple($keys);

        return response()->json([
            'success' => true,
            'settings' => $values
        ]);
    }

    /**
     * Update a setting
     * PUT /api/settings/{key}
     * 
     * Admin-only endpoint
     */
    public function update(Request $request, string $key): JsonResponse
    {
        // Simple admin auth check - validate frontend nexus tokens
        // Token format: nexus_{timestamp}_{random}
        $token = $request->header('X-Admin-Token');
        if (!$token || !str_starts_with($token, 'nexus_') || strlen($token) < 20) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized'
            ], 401);
        }

        $value = $request->input('value');

        if ($value === null) {
            return response()->json([
                'success' => false,
                'error' => 'Value is required'
            ], 400);
        }

        SiteSetting::set($key, $value);

        return response()->json([
            'success' => true,
            'key' => $key,
            'value' => $value,
            'message' => 'Setting updated successfully'
        ]);
    }

    /**
     * Delete a setting
     * DELETE /api/settings/{key}
     * 
     * Admin-only endpoint
     */
    public function delete(Request $request, string $key): JsonResponse
    {
        // Simple admin auth check
        if ($request->header('X-Admin-Token') !== env('ADMIN_ACCESS_TOKEN', 'admin-secret-123')) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized'
            ], 401);
        }

        $deleted = SiteSetting::where('key', $key)->delete();

        return response()->json([
            'success' => true,
            'deleted' => $deleted > 0
        ]);
    }
}
