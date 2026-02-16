<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class AppSetting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['key', 'value', 'type', 'group', 'description'];

    /**
     * Cache duration in seconds
     */
    protected static int $cacheDuration = 300; // 5 minutes

    /**
     * Prefix for encrypted values
     */
    public const ENCRYPTED_PREFIX = 'ENC:';

    /**
     * Fields that support encryption
     */
    public static array $sensitiveFields = [
        'program_id',
        'token_mint',
        'rpc_url',
        'rpc_url_mainnet',
    ];

    /**
     * Get a setting value by key
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $cacheKey = "app_setting_{$key}";
        
        return Cache::remember($cacheKey, self::$cacheDuration, function () use ($key, $default) {
            $setting = self::find($key);
            
            if (!$setting) {
                return $default;
            }

            return self::castValue($setting->value, $setting->type);
        });
    }

    /**
     * Set a setting value
     */
    public static function set(string $key, mixed $value, ?string $type = null): bool
    {
        $setting = self::find($key);
        
        if (!$setting) {
            return false;
        }

        // Convert value to string for storage
        if (is_bool($value)) {
            $value = $value ? 'true' : 'false';
        } elseif (is_array($value)) {
            $value = json_encode($value);
        } else {
            $value = (string) $value;
        }

        $setting->value = $value;
        
        if ($type) {
            $setting->type = $type;
        }

        $result = $setting->save();

        // Clear cache
        Cache::forget("app_setting_{$key}");
        Cache::forget('app_settings_all');
        Cache::forget('app_settings_public');

        return $result;
    }

    /**
     * Set a setting value with encryption (for sensitive fields)
     */
    public static function setEncrypted(string $key, mixed $value): bool
    {
        if (!in_array($key, self::$sensitiveFields)) {
            Log::warning("Attempted to encrypt non-sensitive field: {$key}");
            return self::set($key, $value);
        }

        if (empty($value)) {
            return self::set($key, $value);
        }

        // Don't double-encrypt
        if (is_string($value) && str_starts_with($value, self::ENCRYPTED_PREFIX)) {
            return self::set($key, $value);
        }

        try {
            $encryptedValue = self::ENCRYPTED_PREFIX . Crypt::encryptString((string)$value);
            return self::set($key, $encryptedValue);
        } catch (\Exception $e) {
            Log::error("Failed to encrypt setting {$key}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if a setting value is encrypted
     */
    public static function isEncrypted(string $key): bool
    {
        $setting = self::find($key);
        if (!$setting || !$setting->value) {
            return false;
        }
        return str_starts_with($setting->value, self::ENCRYPTED_PREFIX);
    }

    /**
     * Get all settings grouped by category
     */
    public static function getAllGrouped(): array
    {
        return Cache::remember('app_settings_all', self::$cacheDuration, function () {
            $settings = self::all();
            $grouped = [];

            foreach ($settings as $setting) {
                $grouped[$setting->group][$setting->key] = [
                    'value' => self::castValue($setting->value, $setting->type),
                    'type' => $setting->type,
                    'description' => $setting->description,
                ];
            }

            return $grouped;
        });
    }

    /**
     * Get public settings (safe to expose to frontend)
     */
    public static function getPublic(): array
    {
        return Cache::remember('app_settings_public', self::$cacheDuration, function () {
            $publicKeys = [
                'network_mode',
                'rpc_url',
                'token_mint',
                'token_symbol',
                'token_decimals',
                'token_logo_url',
                'jupiter_enabled',
                'swap_enabled',
                'demo_mode',
                'program_id',
            ];

            $settings = self::whereIn('key', $publicKeys)->get();
            $result = [];

            foreach ($settings as $setting) {
                $result[$setting->key] = self::castValue($setting->value, $setting->type);
            }

            return $result;
        });
    }

    /**
     * Bulk update settings
     */
    public static function bulkUpdate(array $settings): int
    {
        $updated = 0;

        foreach ($settings as $key => $value) {
            if (self::set($key, $value)) {
                $updated++;
            }
        }

        return $updated;
    }

    /**
     * Cast value to appropriate PHP type
     */
    protected static function castValue(?string $value, string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        // Auto-decrypt if value has encryption prefix
        if (str_starts_with($value, self::ENCRYPTED_PREFIX)) {
            try {
                $encryptedPart = substr($value, strlen(self::ENCRYPTED_PREFIX));
                $value = Crypt::decryptString($encryptedPart);
            } catch (\Exception $e) {
                Log::error('Failed to decrypt setting value: ' . $e->getMessage());
                return null;
            }
        }

        return match ($type) {
            'boolean' => $value === 'true' || $value === '1',
            'integer' => (int) $value,
            'float' => (float) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Clear all settings cache
     */
    public static function clearCache(): void
    {
        $settings = self::all();
        
        foreach ($settings as $setting) {
            Cache::forget("app_setting_{$setting->key}");
        }
        
        Cache::forget('app_settings_all');
        Cache::forget('app_settings_public');
    }
}
