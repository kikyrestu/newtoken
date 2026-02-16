<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Admin;

/**
 * Middleware to authenticate admin requests via X-Admin-Token header.
 * 
 * Validates the token against the database using Admin::findByToken().
 * Rejects requests at the middleware level before they reach the controller,
 * reducing resource waste and providing consistent auth across all admin routes.
 */
class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Admin-Token');

        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => 'No admin token provided',
            ], 401);
        }

        $admin = Admin::findByToken($token);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or expired admin token',
            ], 401);
        }

        // Attach admin to request so controllers can access it without re-querying
        $request->merge(['_admin' => $admin]);

        return $next($request);
    }
}
