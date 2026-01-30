<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TierCounter extends Model
{
    protected $primaryKey = 'tier';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['tier', 'purchase_count'];

    /**
     * Increment counter for a tier atomically
     */
    public static function incrementTier(string $tier): int
    {
        $counter = self::lockForUpdate()->find($tier);
        if ($counter) {
            $counter->increment('purchase_count');
            return $counter->purchase_count;
        }
        return 0;
    }

    /**
     * Get current count for a tier
     */
    public static function getCount(string $tier): int
    {
        return self::where('tier', $tier)->value('purchase_count') ?? 0;
    }
}
