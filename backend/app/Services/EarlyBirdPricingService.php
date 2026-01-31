<?php

namespace App\Services;

use App\Models\LockTransaction;

class EarlyBirdPricingService
{
    private const DEFAULT_TIERS = [
        'spectator' => [
            'base_price' => 25.00,
            'brackets' => [
                ['max' => 200, 'discount_percent' => 20],
                ['max' => 400, 'discount_percent' => 10],
                ['max' => null, 'discount_percent' => 0],
            ],
        ],
        'operator' => [
            'base_price' => 150.00,
            'brackets' => [
                ['max' => 100, 'discount_percent' => 20],
                ['max' => 200, 'discount_percent' => 10],
                ['max' => null, 'discount_percent' => 0],
            ],
        ],
        'elite' => [
            'base_price' => 250.00,
            'brackets' => [
                ['max' => 50, 'discount_percent' => 20],
                ['max' => 100, 'discount_percent' => 10],
                ['max' => null, 'discount_percent' => 0],
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

        $discountPercent = (int) $activeBracket['discount_percent'];
        $currentPrice = $this->applyDiscount($basePrice, $discountPercent);

        $remainingSlots = null;
        if ($activeBracket['max'] !== null) {
            $remainingSlots = max(0, (int) $activeBracket['max'] - $lockedCount);
        }

        $nextPrice = $currentPrice;
        $nextIndex = $activeIndex + 1;
        if (isset($brackets[$nextIndex])) {
            $nextPrice = $this->applyDiscount($basePrice, (int) $brackets[$nextIndex]['discount_percent']);
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

