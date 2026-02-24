<?php

namespace App\Services;

use App\Models\LockTransaction;

class EarlyBirdPricingService
{
    private const DEFAULT_TIERS = [
        'spectator' => [
            'base_price' => 25.00,
            'brackets' => [
                ['max' => 200, 'fixed_price' => 20.00],
                ['max' => 400, 'fixed_price' => 22.50],
                ['max' => null, 'fixed_price' => null],
            ],
        ],
        'operator' => [
            'base_price' => 150.00,
            'brackets' => [
                ['max' => 100, 'fixed_price' => 100.00],
                ['max' => 200, 'fixed_price' => 125.00],
                ['max' => null, 'fixed_price' => null],
            ],
        ],
        'elite' => [
            'base_price' => 250.00,
            'brackets' => [
                ['max' => 50, 'fixed_price' => 175.00],
                ['max' => 100, 'fixed_price' => 212.50],
                ['max' => null, 'fixed_price' => null],
            ],
        ],
    ];

    /**
     * Get configuration for a tier (from DB or default)
     */
    private function getTierConfig(string $tier): array
    {
        $default = self::DEFAULT_TIERS[$tier] ?? null;
        if (!$default) return [];

        try {
            // Attempt to fetch dynamic price from SiteSettings
            // Key format: tier_price_{tier}
            $dynamicPrice = \App\Models\SiteSetting::get("tier_price_{$tier}");
            
            if ($dynamicPrice !== null && is_numeric($dynamicPrice)) {
                $default['base_price'] = (float) $dynamicPrice;
            }
        } catch (\Exception $e) {
            // Fallback to default if DB fails
        }

        return $default;
    }

    /**
     * @return array{current_price: float, original_price: float, discount_percent: int, remaining_slots_in_tier: ?int, next_price: float, locked_count: int}
     */
    public function getTierPricingDetails(string $tier): array
    {
        $tierConfig = $this->getTierConfig($tier);
        if (!$tierConfig) {
            throw new \InvalidArgumentException("Invalid tier: {$tier}");
        }

        $lockedCount = LockTransaction::query()
            ->where('tier', $tier)
            ->where('status', LockTransaction::STATUS_LOCKED)
            ->count();

        $basePrice = (float) $tierConfig['base_price'];
        $brackets = $tierConfig['brackets'];

        $activeIndex = $this->resolveBracketIndex($lockedCount, $brackets);
        $activeBracket = $brackets[$activeIndex];

        // Use fixed_price if set, otherwise fall back to base_price
        $currentPrice = $activeBracket['fixed_price'] !== null
            ? (float) $activeBracket['fixed_price']
            : $basePrice;

        $discountPercent = $basePrice > 0 ? (int) round((1 - $currentPrice / $basePrice) * 100) : 0;

        $remainingSlots = null;
        if ($activeBracket['max'] !== null) {
            $remainingSlots = max(0, (int) $activeBracket['max'] - $lockedCount);
        }

        $nextPrice = $currentPrice;
        $nextIndex = $activeIndex + 1;
        if (isset($brackets[$nextIndex])) {
            $nextPrice = $brackets[$nextIndex]['fixed_price'] !== null
                ? (float) $brackets[$nextIndex]['fixed_price']
                : $basePrice;
        }

        return [
            'current_price' => $currentPrice,
            'original_price' => $basePrice,
            'discount_percent' => $discountPercent,
            'remaining_slots_in_tier' => $remainingSlots,
            'next_price' => $nextPrice,
            'locked_count' => $lockedCount,
        ];
    }

    public function getTierCurrentUsdPrice(string $tier): float
    {
        $details = $this->getTierPricingDetails($tier);
        return (float) $details['current_price'];
    }

    /**
     * @return array{spectator: array, operator: array, elite: array}
     */
    public function getAllTierPricingDetails(): array
    {
        return [
            'spectator' => $this->getTierPricingDetails('spectator'),
            'operator' => $this->getTierPricingDetails('operator'),
            'elite' => $this->getTierPricingDetails('elite'),
        ];
    }

    /**
     * @param array<int, array{max: ?int, discount_percent: int}> $brackets
     */
    private function resolveBracketIndex(int $lockedCount, array $brackets): int
    {
        foreach ($brackets as $index => $bracket) {
            $max = $bracket['max'];
            if ($max === null) {
                return $index;
            }
            if ($lockedCount < (int) $max) {
                return $index;
            }
            if ($lockedCount === (int) $max) {
                return min($index + 1, count($brackets) - 1);
            }
        }

        return max(0, count($brackets) - 1);
    }

    private function applyDiscount(float $basePrice, int $discountPercent): float
    {
        $multiplier = 1 - ($discountPercent / 100);
        return round($basePrice * $multiplier, 2);
    }
}

