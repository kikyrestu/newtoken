<?php

namespace App\Services;

use App\Models\TierCounter;

class DiscountService
{
    /**
     * Discount tiers configuration
     * 
     * Format: [tier => [base_price, [discount_tier_1, discount_tier_2, ...]]]
     * Each discount_tier: [max_count, discount_percent]
     */
    private array $config = [
        'spectator' => [
            'base_price' => 25.00,
            'tiers' => [
                ['max' => 200, 'discount' => 20],  // First 200: 20% off
                ['max' => 400, 'discount' => 10],  // 201-400: 10% off
            ],
        ],
        'operator' => [
            'base_price' => 150.00,
            'tiers' => [
                ['max' => 100, 'discount' => 20],  // First 100: 20% off
                ['max' => 200, 'discount' => 10],  // 101-200: 10% off
            ],
        ],
        'elite' => [
            'base_price' => 250.00,
            'tiers' => [
                ['max' => 50, 'discount' => 20],   // First 50: 20% off
                ['max' => 100, 'discount' => 10],  // 51-100: 10% off
            ],
        ],
    ];

    /**
     * Get pricing info for a tier
     */
    public function getTierPricing(string $tier): array
    {
        $tier = strtolower($tier);
        
        if (!isset($this->config[$tier])) {
            return [
                'error' => 'Invalid tier',
                'tier' => $tier,
            ];
        }

        $config = $this->config[$tier];
        $currentCount = TierCounter::getCount($tier);
        $basePrice = $config['base_price'];
        
        // Calculate current discount
        $discountPercent = 0;
        $spotsLeftAtCurrentDiscount = 0;
        $nextDiscountThreshold = 0;

        foreach ($config['tiers'] as $discountTier) {
            if ($currentCount < $discountTier['max']) {
                $discountPercent = $discountTier['discount'];
                $spotsLeftAtCurrentDiscount = $discountTier['max'] - $currentCount;
                $nextDiscountThreshold = $discountTier['max'];
                break;
            }
        }

        // Calculate final price
        $finalPrice = $basePrice * (1 - ($discountPercent / 100));

        return [
            'tier' => $tier,
            'base_price' => $basePrice,
            'discount_percent' => $discountPercent,
            'final_price' => round($finalPrice, 2),
            'current_buyers' => $currentCount,
            'spots_left_at_discount' => $spotsLeftAtCurrentDiscount,
            'next_threshold' => $nextDiscountThreshold,
            'has_discount' => $discountPercent > 0,
        ];
    }

    /**
     * Get pricing for all tiers
     */
    public function getAllTiersPricing(): array
    {
        return [
            'spectator' => $this->getTierPricing('spectator'),
            'operator' => $this->getTierPricing('operator'),
            'elite' => $this->getTierPricing('elite'),
        ];
    }

    /**
     * Process a purchase - increment counter and return final price
     */
    public function processPurchase(string $tier): array
    {
        $pricing = $this->getTierPricing($tier);
        
        // Increment counter
        TierCounter::incrementTier($tier);
        
        return [
            'tier' => $tier,
            'price_paid' => $pricing['final_price'],
            'discount_applied' => $pricing['discount_percent'],
            'buyer_number' => $pricing['current_buyers'] + 1,
        ];
    }
}
