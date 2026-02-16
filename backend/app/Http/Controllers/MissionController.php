<?php

namespace App\Http\Controllers;

use App\Models\Mission;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MissionController extends Controller
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
     * Get all visible missions (public endpoint for frontend)
     */
    public function index(): JsonResponse
    {
        $missions = Mission::visible()
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($mission) => $mission->toApiArray());

        return response()->json([
            'success' => true,
            'missions' => $missions,
        ]);
    }

    /**
     * Get missions for admin (includes hidden)
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $adminOrError = $this->getAdminOrFail($request);
        if ($adminOrError instanceof JsonResponse) return $adminOrError;

        $missions = Mission::orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'missions' => $missions,
        ]);
    }

    /**
     * Store a new mission (admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'difficulty' => 'required|in:Easy,Medium,Hard',
            'rewards' => 'nullable|string|max:50',
            'mission_points' => 'nullable|string|max:100',
            'participants_limit' => 'nullable|integer|min:0',
            'start_in' => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'description' => 'nullable|string',
            'objectives' => 'nullable|array',
            'requirements' => 'nullable|string|max:255',
            'status' => 'nullable|in:draft,upcoming,active,completed',
            'sort_order' => 'nullable|integer',
            'is_visible' => 'nullable|boolean',
        ]);

        $mission = Mission::create($validated);

        // Log action
        $admin->logAction('create_mission', [
            'target_type' => 'Mission',
            'target_id' => $mission->id,
            'new_value' => $validated,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Mission created successfully',
            'mission' => $mission,
        ], 201);
    }

    /**
     * Get a single mission
     */
    public function show(int $id): JsonResponse
    {
        $mission = Mission::find($id);

        if (!$mission) {
            return response()->json(['error' => 'Mission not found'], 404);
        }

        return response()->json([
            'success' => true,
            'mission' => $mission->toApiArray(),
        ]);
    }

    /**
     * Update a mission (admin only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        $mission = Mission::find($id);

        if (!$mission) {
            return response()->json(['error' => 'Mission not found'], 404);
        }

        $oldValue = $mission->toArray();

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'difficulty' => 'sometimes|in:Easy,Medium,Hard',
            'rewards' => 'nullable|string|max:50',
            'mission_points' => 'nullable|string|max:100',
            'participants_limit' => 'nullable|integer|min:0',
            'current_participants' => 'nullable|integer|min:0',
            'start_in' => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'description' => 'nullable|string',
            'objectives' => 'nullable|array',
            'requirements' => 'nullable|string|max:255',
            'status' => 'nullable|in:draft,upcoming,active,completed',
            'sort_order' => 'nullable|integer',
            'is_visible' => 'nullable|boolean',
        ]);

        $mission->update($validated);

        // Log action
        $admin->logAction('update_mission', [
            'target_type' => 'Mission',
            'target_id' => $mission->id,
            'old_value' => $oldValue,
            'new_value' => $validated,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Mission updated successfully',
            'mission' => $mission->fresh(),
        ]);
    }

    /**
     * Delete a mission (admin only)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        $mission = Mission::find($id);

        if (!$mission) {
            return response()->json(['error' => 'Mission not found'], 404);
        }

        $oldValue = $mission->toArray();
        $mission->delete();

        // Log action
        $admin->logAction('delete_mission', [
            'target_type' => 'Mission',
            'target_id' => $id,
            'old_value' => $oldValue,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Mission deleted successfully',
        ]);
    }

    /**
     * Reorder missions (admin only)
     */
    public function reorder(Request $request): JsonResponse
    {
        $admin = $this->getAdminOrFail($request);
        if ($admin instanceof JsonResponse) return $admin;

        $validated = $request->validate([
            'order' => 'required|array',
            'order.*.id' => 'required|integer|exists:missions,id',
            'order.*.sort_order' => 'required|integer',
        ]);

        foreach ($validated['order'] as $item) {
            Mission::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        // Log action
        $admin->logAction('reorder_missions', [
            'new_value' => $validated['order'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Missions reordered successfully',
        ]);
    }
}
