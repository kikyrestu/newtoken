<?php

namespace App\Http\Controllers;

use App\Models\Mission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MissionController extends Controller
{
    /**
     * Verify admin token
     */
    private function verifyAdmin(Request $request): bool
    {
        $token = $request->header('X-Admin-Token');
        $validToken = env('ADMIN_TOKEN', 'V4n7An3w70|<3n');
        return $token === $validToken;
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
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

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
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

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
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $mission = Mission::find($id);

        if (!$mission) {
            return response()->json(['error' => 'Mission not found'], 404);
        }

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
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $mission = Mission::find($id);

        if (!$mission) {
            return response()->json(['error' => 'Mission not found'], 404);
        }

        $mission->delete();

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
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'order' => 'required|array',
            'order.*.id' => 'required|integer|exists:missions,id',
            'order.*.sort_order' => 'required|integer',
        ]);

        foreach ($validated['order'] as $item) {
            Mission::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Missions reordered successfully',
        ]);
    }
}
