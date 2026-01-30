<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Solana RPC Endpoint
    |--------------------------------------------------------------------------
    |
    | The Solana RPC endpoint to use for blockchain queries.
    | For mainnet: https://api.mainnet-beta.solana.com
    | For devnet: https://api.devnet.solana.com
    |
    */
    'rpc_endpoint' => env('SOLANA_RPC_ENDPOINT', 'https://api.mainnet-beta.solana.com'),

    /*
    |--------------------------------------------------------------------------
    | Program ID
    |--------------------------------------------------------------------------
    |
    | The deployed Anchor program ID for the mission lock contract.
    |
    */
    'program_id' => env('SOLANA_PROGRAM_ID', ''),

    /*
    |--------------------------------------------------------------------------
    | Token Configuration
    |--------------------------------------------------------------------------
    |
    | The token mint address and decimals for the mission token.
    |
    */
    'token_mint' => env('TOKEN_MINT_ADDRESS', ''),
    'token_decimals' => env('TOKEN_DECIMALS', 9),

    /*
    |--------------------------------------------------------------------------
    | Lock Configuration
    |--------------------------------------------------------------------------
    |
    | Default lock duration and other lock-related settings.
    |
    */
    'default_lock_duration_days' => env('LOCK_DURATION_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Rate limits for various API endpoints (requests per minute).
    |
    */
    'rate_limits' => [
        'verify_lock' => env('RATE_LIMIT_VERIFY', 10),
        'pricing' => env('RATE_LIMIT_PRICING', 60),
        'dashboard' => env('RATE_LIMIT_DASHBOARD', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Verification Timeout
    |--------------------------------------------------------------------------
    |
    | Timeout in seconds for transaction verification requests.
    |
    */
    'verification_timeout' => env('SOLANA_VERIFICATION_TIMEOUT', 30),

    /*
    |--------------------------------------------------------------------------
    | Price Oracle Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for the price oracle service.
    |
    */
    'price_cache_ttl' => env('PRICE_CACHE_TTL', 30), // seconds

    /*
    |--------------------------------------------------------------------------
    | Treasury Wallet (SECURITY CRITICAL)
    |--------------------------------------------------------------------------
    |
    | The treasury wallet for cashback operations.
    | WARNING: Never commit the actual private key!
    |
    */
    'treasury_wallet' => env('TREASURY_WALLET_ADDRESS', ''),
];
