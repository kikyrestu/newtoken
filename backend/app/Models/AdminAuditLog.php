<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminAuditLog extends Model
{
    protected $fillable = [
        'admin_id',
        'action',
        'target_type',
        'target_id',
        'old_value',
        'new_value',
        'ip_address',
        'user_agent',
        'notes',
    ];

    protected $casts = [
        'old_value' => 'json',
        'new_value' => 'json',
    ];

    /**
     * Get the admin who performed this action
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    /**
     * Scope for filtering by action type
     */
    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Get human-readable description
     */
    public function getDescriptionAttribute(): string
    {
        $admin = $this->admin->username ?? 'Unknown';
        
        return match($this->action) {
            'login' => "{$admin} logged in",
            'logout' => "{$admin} logged out",
            'force_unlock' => "{$admin} force unlocked transaction #{$this->target_id}",
            'update_tier_config' => "{$admin} updated tier configuration",
            'update_settings' => "{$admin} updated site settings",
            default => "{$admin} performed {$this->action}",
        };
    }
}
