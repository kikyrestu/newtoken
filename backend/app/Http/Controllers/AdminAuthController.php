<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use App\Models\Admin;

class AdminAuthController extends Controller
{
    /**
     * Admin login endpoint
     * POST /api/admin/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $admin = Admin::where('username', $request->username)
            ->where('is_active', true)
            ->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            // Log failed attempt
            \Log::warning('Failed admin login attempt', [
                'username' => $request->username,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Invalid credentials'
            ], 401);
        }

        // Generate new token
        $token = $admin->generateToken();

        // Update login info
        $admin->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Log successful login
        $admin->logAction('login', [
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'token' => $token,
            'admin' => [
                'id' => $admin->id,
                'username' => $admin->username,
                'role' => $admin->role,
            ],
            'expires_at' => $admin->token_expires_at->toISOString(),
        ]);
    }

    /**
     * Admin logout endpoint
     * POST /api/admin/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->header('X-Admin-Token');
        
        if ($token) {
            $admin = Admin::findByToken($token);
            
            if ($admin) {
                $admin->logAction('logout');
                $admin->invalidateToken();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Verify if current token is still valid
     * GET /api/admin/auth/verify
     */
    public function verify(Request $request): JsonResponse
    {
        $token = $request->header('X-Admin-Token');
        
        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => 'No token provided'
            ], 401);
        }

        $admin = Admin::findByToken($token);
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or expired token'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'admin' => [
                'id' => $admin->id,
                'username' => $admin->username,
                'role' => $admin->role,
            ],
            'expires_at' => $admin->token_expires_at->toISOString(),
        ]);
    }
}
