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

        $cacheTtl = (int) config('solana.price_cache_ttl', 30);
        $maxStale = (int) config('solana.price_max_stale_seconds', 3600);
        $useStale = (bool) config('solana.price_use_stale', true);
        $cacheKey = "token_price_{$this->tokenMint}";
        $lastGoodKey = "token_price_last_{$this->tokenMint}";

        $cached = Cache::get($cacheKey);
        if (is_numeric($cached)) {
            return (float) $cached;
        }

        try {
            $price = $this->fetchPriceFromRaydium();
            Cache::put($cacheKey, $price, $cacheTtl);
            Cache::put($lastGoodKey, ['price' => $price, 'timestamp' => time()], $maxStale);
            return $price;
        } catch (Exception $e) {
            if ($useStale) {
                $lastGood = Cache::get($lastGoodKey);
                if (is_array($lastGood) && isset($lastGood['price'])) {
                    return (float) $lastGood['price'];
                }
            }
            throw $e;
        }
    }

    /**
     * Fetch price from Raydium API
     */
    private function fetchPriceFromRaydium(): float
    {
        try {
            Log::info('Trying Raydium API...', ['mint' => $this->tokenMint]);
            
            // Raydium V3 API for token prices
            // Using withoutVerifying() to bypass SSL issues on Windows
            $response = Http::withoutVerifying()
                ->timeout(15)
                ->get('https://api-v3.raydium.io/mint/price', [
                    'mints' => $this->tokenMint
                ]);

            Log::info('Raydium response', [
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 500)
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
                    'mint' => $this->tokenMint,
                    'data_keys' => array_keys($data['data'] ?? [])
                ]);
                return $this->fetchPriceFromJupiter();
            }

            Log::info('Raydium price found: ' . $price);
            return (float) $price;

        } catch (Exception $e) {
            Log::error('Raydium price fetch exception', [
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
            Log::info('Trying Jupiter API...', ['mint' => $this->tokenMint]);
            
            // Try Jupiter v6 API first (newer)
            $response = Http::timeout(10)
                ->get('https://api.jup.ag/price/v2', [
                    'ids' => $this->tokenMint
                ]);

            Log::info('Jupiter v2 response', [
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 500)
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $tokenData = $data['data'][$this->tokenMint] ?? null;

                if ($tokenData && isset($tokenData['price'])) {
                    Log::info('Jupiter v2 price found: ' . $tokenData['price']);
                    return (float) $tokenData['price'];
                }
            }

            // Fallback to v4 API
            Log::info('Trying Jupiter v4 API...');
            $response = Http::timeout(10)
                ->get('https://price.jup.ag/v4/price', [
                    'ids' => $this->tokenMint
                ]);

            Log::info('Jupiter v4 response', [
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 500)
            ]);

            if (!$response->successful()) {
                throw new Exception('Jupiter API request failed: HTTP ' . $response->status());
            }

            $data = $response->json();
            $tokenData = $data['data'][$this->tokenMint] ?? null;

            if (!$tokenData || !isset($tokenData['price'])) {
                throw new Exception('Token price not found in Jupiter response');
            }

            Log::info('Jupiter v4 price found: ' . $tokenData['price']);
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
