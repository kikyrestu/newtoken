<?php

return [
    'rpc_endpoint' => env('SOLANA_RPC_ENDPOINT', 'https://api.devnet.solana.com'),
    'program_id' => env('SOLANA_PROGRAM_ID', ''),
    'token_mint' => env('TOKEN_MINT_ADDRESS', ''),
    'token_decimals' => env('TOKEN_DECIMALS', 9),
    'lock_duration_days' => env('LOCK_DURATION_DAYS', 30),
    'rate_limits' => [
        'verify_lock' => env('RATE_LIMIT_VERIFY', 10),
        'pricing' => env('RATE_LIMIT_PRICING', 60),
        'dashboard' => env('RATE_LIMIT_DASHBOARD', 30),
    ],
    'verification_timeout' => env('SOLANA_VERIFICATION_TIMEOUT', 30),
    'price_cache_ttl' => env('PRICE_CACHE_TTL', 30),
    'treasury_wallet' => env('TREASURY_WALLET_ADDRESS', ''),
    'dev_mode' => env('DEV_MODE', false),
];
