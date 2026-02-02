<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'difficulty',
        'rewards',
        'mission_points',
        'participants_limit',
        'current_participants',
        'start_in',
        'start_date',
        'description',
        'objectives',
        'requirements',
        'status',
        'sort_order',
        'is_visible',
    ];

    protected $casts = [
        'objectives' => 'array',
        'start_date' => 'datetime',
        'is_visible' => 'boolean',
        'participants_limit' => 'integer',
        'current_participants' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * Get difficulty color for frontend
     */
    public function getDifficultyColorAttribute(): string
    {
        return match ($this->difficulty) {
            'Easy' => 'text-green-400',
            'Medium' => 'text-yellow-400',
            'Hard' => 'text-red-400',
            default => 'text-gray-400',
        };
    }

    /**
     * Scope to get visible missions
     */
    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    /**
     * Scope to get upcoming missions (for user view)
     */
    public function scopeUpcoming($query)
    {
        return $query->where('status', 'upcoming')->visible()->orderBy('sort_order');
    }

    /**
     * Scope for active missions
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')->visible()->orderBy('sort_order');
    }

    /**
     * Format for API response
     */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'difficulty' => $this->difficulty,
            'difficulty_color' => $this->difficulty_color,
            'rewards' => $this->rewards,
            'mission_points' => $this->mission_points,
            'participants' => $this->current_participants . '/' . $this->participants_limit,
            'participants_count' => $this->current_participants,
            'participants_limit' => $this->participants_limit,
            'start_in' => $this->start_in,
            'start_date' => $this->start_date?->toIso8601String(),
            'description' => $this->description,
            'objectives' => $this->objectives ?? [],
            'requirements' => $this->requirements,
            'status' => $this->status,
        ];
    }
}
