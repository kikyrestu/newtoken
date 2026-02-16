<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Admin extends Model
{
    protected $fillable = [
        'username',
        'password',
        'api_token',
        'token_expires_at',
        'role',
        'is_active',
        'last_login_at',
        'last_login_ip',
    ];

    protected $hidden = [
        'password',
        'api_token',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Generate a new API token for this admin
     */
    public function generateToken(): string
    {
        $token = 'nexus_' . Str::random(60);
        
        $this->update([
            'api_token' => hash('sha256', $token),
            'token_expires_at' => now()->addHours(24),
        ]);
        
        return $token;
    }

    /**
     * Invalidate current token
     */
    public function invalidateToken(): void
    {
        $this->update([
            'api_token' => null,
            'token_expires_at' => null,
        ]);
    }

    /**
     * Find admin by valid token
     */
    public static function findByToken(string $token): ?self
    {
        return static::where('api_token', hash('sha256', $token))
            ->where('is_active', true)
            ->where('token_expires_at', '>', now())
            ->first();
    }

    /**
     * Get audit logs for this admin
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AdminAuditLog::class);
    }

    /**
     * Log an action performed by this admin
     */
    public function logAction(string $action, array $data = []): AdminAuditLog
    {
        return $this->auditLogs()->create([
            'action' => $action,
            'target_type' => $data['target_type'] ?? null,
            'target_id' => $data['target_id'] ?? null,
            'old_value' => $data['old_value'] ?? null,
            'new_value' => $data['new_value'] ?? null,
            'ip_address' => $data['ip_address'] ?? request()->ip(),
            'user_agent' => $data['user_agent'] ?? request()->userAgent(),
            'notes' => $data['notes'] ?? null,
        ]);
    }
}
