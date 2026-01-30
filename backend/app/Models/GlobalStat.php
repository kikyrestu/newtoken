<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class GlobalStat extends Model
{
    protected $table = 'global_stats';

    protected $fillable = [
        'key',
        'value',
        'type',
    ];

    /**
     * Type constants
     */
    public const TYPE_STRING = 'string';
    public const TYPE_INTEGER = 'integer';
    public const TYPE_FLOAT = 'float';
    public const TYPE_JSON = 'json';

    /**
     * Stat key constants
     */
    public const KEY_TOTAL_LOCKED_TOKENS = 'total_locked_tokens';
    public const KEY_TOTAL_LOCKED_USD = 'total_locked_usd';
    public const KEY_TOTAL_SPECTATORS = 'total_spectators';
    public const KEY_TOTAL_OPERATORS = 'total_operators';
    public const KEY_TOTAL_ELITE = 'total_elite';
    public const KEY_ACTIVE_LOCKS = 'active_locks';
    public const KEY_TOTAL_PARTICIPANTS = 'total_participants';

    /**
     * Get a stat value by key with caching
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        return Cache::remember("global_stat_{$key}", 60, function () use ($key, $default) {
            $stat = static::where('key', $key)->first();
            
            if (!$stat) {
                return $default;
            }

            return $stat->getCastedValue();
        });
    }

    /**
     * Set a stat value by key
     */
    public static function setValue(string $key, mixed $value, string $type = self::TYPE_STRING): void
    {
        $stringValue = match ($type) {
            self::TYPE_JSON => json_encode($value),
            default => (string) $value,
        };

        static::updateOrCreate(
            ['key' => $key],
            ['value' => $stringValue, 'type' => $type]
        );

        // Clear cache
        Cache::forget("global_stat_{$key}");
    }

    /**
     * Increment a numeric stat
     */
    public static function incrementStat(string $key, int|float $amount = 1): void
    {
        $current = static::getValue($key, 0);
        $stat = static::where('key', $key)->first();
        $type = $stat?->type ?? self::TYPE_INTEGER;
        
        static::setValue($key, $current + $amount, $type);
    }

    /**
     * Decrement a numeric stat
     */
    public static function decrementStat(string $key, int|float $amount = 1): void
    {
        $current = static::getValue($key, 0);
        $stat = static::where('key', $key)->first();
        $type = $stat?->type ?? self::TYPE_INTEGER;
        
        static::setValue($key, max(0, $current - $amount), $type);
    }

    /**
     * Get the casted value based on type
     */
    public function getCastedValue(): mixed
    {
        return match ($this->type) {
            self::TYPE_INTEGER => (int) $this->value,
            self::TYPE_FLOAT => (float) $this->value,
            self::TYPE_JSON => json_decode($this->value, true),
            default => $this->value,
        };
    }

    /**
     * Get all stats as an array
     */
    public static function getAllStats(): array
    {
        return Cache::remember('global_stats_all', 60, function () {
            $stats = static::all();
            $result = [];
            
            foreach ($stats as $stat) {
                $result[$stat->key] = $stat->getCastedValue();
            }
            
            return $result;
        });
    }

    /**
     * Clear all stats cache
     */
    public static function clearCache(): void
    {
        $keys = static::pluck('key')->toArray();
        
        foreach ($keys as $key) {
            Cache::forget("global_stat_{$key}");
        }
        
        Cache::forget('global_stats_all');
    }
}
