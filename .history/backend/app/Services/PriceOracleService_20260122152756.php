<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Exception;

class PriceOracleService
{
    private string $tokenMint;
    private int $tokenDecimals;
    
    /**
     * Tier USD prices
     */
    public const TIER_PRICES = [
        'spectator' => 20.00,
        'operator' => 150.00,
        'elite' => 250.00,
    ];

    public function __construct()
    {
        $this->tokenMint = config('solana.token_mint', '');
        $this->tokenDecimals = config('solana.token_decimals', 9);
    }

    /**
     * Get token price in USD from Raydium API
     *
     * @return float Price per token in USD
     * @throws Exception
     */
    public function getTokenPriceUSD(): float
    {
        if (empty($this->tokenMint)) {
            throw new Exception('Token mint address not configured');
        }

        // Cache price for 30 seconds to avoid rate limiting
        return Cache::remember("token_price_{$this->tokenMint}", 30, function () {
            return $this->fetchPriceFromRaydium();
        });
    }

    /**
     * Fetch price from Raydium API
     */
    private function fetchPriceFromRaydium(): float
    {
        try {
            // Raydium V3 API for token prices
            $response = Http::timeout(10)
                ->get('https://api-v3.raydium.io/mint/price', [
                    'mints' => $this->tokenMint
                ]);

            if (!$response->successful()) {
                Log::warning('Raydium API request failed', [
                    'status' => $response->status(),
                    'mint' => $this->tokenMint
                ]);
                
                // Fallback to Jupiter if Raydium fails
                return $this->fetchPriceFromJupiter();
            }

            $data = $response->json();
            $price = $data['data'][$this->tokenMint] ?? null;

            if ($price === null) {
                Log::warning('Token price not found in Raydium response', [
                    'mint' => $this->tokenMint
                ]);
                return $this->fetchPriceFromJupiter();
            }

            return (float) $price;

        } catch (Exception $e) {
            Log::error('Raydium price fetch failed', [
                'error' => $e->getMessage(),
                'mint' => $this->tokenMint
            ]);
            
            return $this->fetchPriceFromJupiter();
        }
    }

    /**
     * Fallback: Fetch price from Jupiter API
     */
    private function fetchPriceFromJupiter(): float
    {
        try {
            $response = Http::timeout(10)
                ->get('https://price.jup.ag/v4/price', [
                    'ids' => $this->tokenMint
                ]);

            if (!$response->successful()) {
                throw new Exception('Jupiter API request failed');
            }

            $data = $response->json();
            $tokenData = $data['data'][$this->tokenMint] ?? null;

            if (!$tokenData || !isset($tokenData['price'])) {
                throw new Exception('Token price not found in Jupiter response');
            }

            return (float) $tokenData['price'];

        } catch (Exception $e) {
            Log::error('Jupiter price fetch failed', [
                'error' => $e->getMessage(),
                'mint' => $this->tokenMint
            ]);
            
            throw new Exception('Unable to fetch token price from any source');
        }
    }

    /**
     * Calculate token amount needed for a USD value
     *
     * @param float $usdAmount USD amount
     * @return int Token amount in smallest unit (lamports)
     */
    public function calculateTokensForUSD(float $usdAmount): int
    {
        $pricePerToken = $this->getTokenPriceUSD();

        if ($pricePerToken <= 0) {
            throw new Exception('Invalid token price');
        }

        $tokenAmount = $usdAmount / $pricePerToken;
        
        // Convert to smallest unit (e.g., lamports for 9 decimals)
        return (int) ($tokenAmount * pow(10, $this->tokenDecimals));
    }

    /**
     * Format token amount from smallest unit to display format
     *
     * @param int $amount Amount in smallest unit
     * @return string Formatted amount
     */
    public function formatTokenAmount(int $amount): string
    {
        $tokenAmount = $amount / pow(10, $this->tokenDecimals);
        return number_format($tokenAmount, 4);
    }

    /**
     * Get pricing for all tiers
     *
     * @return array{spectator: array, operator: array, elite: array}
     */
    public function getTierPricing(): array
    {
        try {
            $tokenPrice = $this->getTokenPriceUSD();
            
            $pricing = [];
            foreach (self::TIER_PRICES as $tier => $usdPrice) {
                $tokensNeeded = $this->calculateTokensForUSD($usdPrice);
                
                $pricing[$tier] = [
                    'usd' => $usdPrice,
                    'tokens' => $tokensNeeded,
                    'tokens_formatted' => $this->formatTokenAmount($tokensNeeded),
                    'token_price' => $tokenPrice,
                ];
            }

            return $pricing;

        } catch (Exception $e) {
            Log::error('Failed to get tier pricing', ['error' => $e->getMessage()]);
            
            // Return static fallback prices (should be updated manually if this happens)
            return $this->getFallbackPricing();
        }
    }

    /**
     * Get specific tier pricing
     *
     * @param string $tier Tier name (spectator, operator, elite)
     * @return array{usd: float, tokens: int, tokens_formatted: string}
     */
    public function getTierPrice(string $tier): array
    {
        $pricing = $this->getTierPricing();
        
        if (!isset($pricing[$tier])) {
            throw new Exception("Invalid tier: {$tier}");
        }

        return $pricing[$tier];
    }

    /**
     * Get USD price for a tier
     */
    public function getTierUsdPrice(string $tier): float
    {
        return self::TIER_PRICES[$tier] ?? throw new Exception("Invalid tier: {$tier}");
    }

    /**
     * Fallback pricing when API fails
     */
    private function getFallbackPricing(): array
    {
        // These should be manually set as fallback
        // In production, you might want to use cached last-known-good values
        return [
            'spectator' => [
                'usd' => 20.00,
                'tokens' => 0,
                'tokens_formatted' => 'Price unavailable',
                'token_price' => 0,
                'error' => 'Price feed unavailable'
            ],
            'operator' => [
                'usd' => 150.00,
                'tokens' => 0,
                'tokens_formatted' => 'Price unavailable',
                'token_price' => 0,
                'error' => 'Price feed unavailable'
            ],
            'elite' => [
                'usd' => 250.00,
                'tokens' => 0,
                'tokens_formatted' => 'Price unavailable',
                'token_price' => 0,
                'error' => 'Price feed unavailable'
            ],
        ];
    }

    /**
     * Clear price cache
     */
    public function clearCache(): void
    {
        Cache::forget("token_price_{$this->tokenMint}");
    }

    /**
     * Check if price feed is healthy
     */
    public function healthCheck(): array
    {
        try {
            $price = $this->getTokenPriceUSD();
            
            return [
                'healthy' => true,
                'price' => $price,
                'source' => 'raydium/jupiter',
                'mint' => $this->tokenMint,
                'timestamp' => now()->toISOString()
            ];
        } catch (Exception $e) {
            return [
                'healthy' => false,
                'error' => $e->getMessage(),
                'mint' => $this->tokenMint,
                'timestamp' => now()->toISOString()
            ];
        }
    }
}
