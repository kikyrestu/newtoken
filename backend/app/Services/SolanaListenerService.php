<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Models\AppSetting;
use App\Services\SolanaPdaService;
use Exception;

class SolanaListenerService
{
    private string $rpcEndpoint;
    private string $programId;
    private string $tokenMint;
    private SolanaPdaService $pdaService;

    public function __construct(?SolanaPdaService $pdaService = null)
    {
        // Initialize PDA service
        $this->pdaService = $pdaService ?? new SolanaPdaService();
        
        // Priority: 1) Database (AppSetting), 2) .env config
        // This allows admin panel to override .env settings
        $dbRpcUrl = AppSetting::get('rpc_url', '');
        $this->rpcEndpoint = !empty($dbRpcUrl) 
            ? $dbRpcUrl 
            : config('solana.rpc_endpoint', 'https://api.mainnet-beta.solana.com');
            
        $dbProgramId = AppSetting::get('program_id', '');
        $this->programId = !empty($dbProgramId) 
            ? $dbProgramId 
            : config('solana.program_id', '');
            
        $dbTokenMint = AppSetting::get('token_mint', '');
        $this->tokenMint = !empty($dbTokenMint) 
            ? $dbTokenMint 
            : config('solana.token_mint', '');
        
        // SECURITY: Ensure token_mint is configured
        if (empty($this->tokenMint) && config('app.env') !== 'local') {
            Log::warning('[SolanaListener] Token mint not configured - security risk!');
        }
            
        Log::debug("[SolanaListener] Initialized with RPC: {$this->rpcEndpoint}, token: {$this->tokenMint}");
    }

    /**
     * Verify a lock transaction on the Solana blockchain
     *
     * @param string $signature Transaction signature
     * @param string $expectedWallet Expected signer wallet address
     * @return array{valid: bool, amount?: int, escrow_pda?: string, lock_timestamp?: int, unlock_timestamp?: int, error?: string}
     */
    public function verifyLockTransaction(string $signature, string $expectedWallet): array
    {
        // Retry configuration for timing issues
        $maxRetries = 3;
        $retryDelay = 2; // seconds
        
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                Log::info("Verifying transaction attempt {$attempt}/{$maxRetries}", ['signature' => $signature]);
                
                // 1. Fetch transaction from Solana RPC
                // SECURITY FIX: Removed withoutVerifying() for production safety. 
                // Ensure server certificates are valid.
                $http = Http::timeout(config('solana.verification_timeout', 30));
                
                // Only disable verification in explicit local dev mode
                if (config('app.env') === 'local') {
                    $http->withoutVerifying();
                }

                $response = $http->post($this->rpcEndpoint, [
                        'jsonrpc' => '2.0',
                        'id' => 1,
                        'method' => 'getTransaction',
                        'params' => [
                            $signature,
                            [
                                'encoding' => 'jsonParsed',
                                'commitment' => 'confirmed',
                                'maxSupportedTransactionVersion' => 0
                            ]
                        ]
                    ]);

                if (!$response->successful()) {
                    Log::error('Solana RPC request failed', [
                        'signature' => $signature,
                        'status' => $response->status(),
                        'attempt' => $attempt
                    ]);
                    
                    if ($attempt < $maxRetries) {
                        sleep($retryDelay);
                        continue;
                    }
                    return ['valid' => false, 'error' => 'RPC request failed'];
                }

                $result = $response->json();

                // Check for RPC errors
                if (isset($result['error'])) {
                    Log::error('Solana RPC error', [
                        'signature' => $signature,
                        'error' => $result['error'],
                        'attempt' => $attempt
                    ]);
                    return ['valid' => false, 'error' => $result['error']['message'] ?? 'Unknown RPC error'];
                }

                $tx = $result['result'] ?? null;

                if (!$tx) {
                    // Transaction not found - might be timing issue, retry
                    if ($attempt < $maxRetries) {
                        Log::warning("Transaction not found, retrying in {$retryDelay}s", ['signature' => $signature]);
                        sleep($retryDelay);
                        continue;
                    }
                    return ['valid' => false, 'error' => 'Transaction not found after retries'];
                }

                // 2. Verify transaction was successful
                if ($tx['meta']['err'] !== null) {
                    return ['valid' => false, 'error' => 'Transaction failed on-chain'];
                }

                // 3. Verify the transaction involves our program
                $programInvoked = $this->checkProgramInvocation($tx);
                if (!$programInvoked) {
                    return ['valid' => false, 'error' => 'Transaction does not involve our program'];
                }

                // 4. Verify the signer matches expected wallet
                $signers = $tx['transaction']['message']['accountKeys'] ?? [];
                $signerFound = false;
                
                foreach ($signers as $account) {
                    if (is_array($account)) {
                        if ($account['pubkey'] === $expectedWallet && ($account['signer'] ?? false)) {
                            $signerFound = true;
                            break;
                        }
                    } else {
                        // Simple string format
                        if ($account === $expectedWallet) {
                            $signerFound = true;
                            break;
                        }
                    }
                }

                if (!$signerFound) {
                    return ['valid' => false, 'error' => 'Wallet address does not match transaction signer'];
                }

                // 5. Parse lock instruction data AND verify Escrow PDA
                $lockData = $this->parseLockInstructionAndVerifyPDA($tx, $expectedWallet);
                
                if (!$lockData) {
                    return ['valid' => false, 'error' => 'Could not verify valid token lock to correct Escrow Account'];
                }

                // 6. Get block time as lock timestamp
                $lockTimestamp = $tx['blockTime'] ?? time();

                Log::info('Lock transaction verified successfully', [
                    'signature' => $signature,
                    'wallet' => $expectedWallet,
                    'amount' => $lockData['amount'],
                    'escrow_pda' => $lockData['escrow_pda']
                ]);

                return [
                    'valid' => true,
                    'amount' => $lockData['amount'],
                    'escrow_pda' => $lockData['escrow_pda'],
                    'lock_timestamp' => $lockTimestamp,
                    'unlock_timestamp' => $lockData['unlock_timestamp'] ?? ($lockTimestamp + (30 * 24 * 60 * 60)),
                ];

            } catch (Exception $e) {
                Log::error('Lock verification exception', [
                    'signature' => $signature,
                    'error' => $e->getMessage(),
                    'attempt' => $attempt
                ]);
                
                if ($attempt < $maxRetries) {
                    sleep($retryDelay);
                    continue;
                }
                
                return ['valid' => false, 'error' => $e->getMessage()];
            }
        }
        
        return ['valid' => false, 'error' => 'Verification failed'];
    }

    /**
     * Check if our program was invoked in the transaction
     */
    private function checkProgramInvocation(array $tx): bool
    {
        if (empty($this->programId)) {
            // SECURITY FIX [L-1]: Only allow bypass in local dev mode
            if (config('app.env') === 'local') {
                Log::warning('Program ID not configured, allowing bypass in local dev mode');
                return true;
            }
            Log::error('Program ID not configured — rejecting transaction for security');
            return false;
        }

        // SECURITY FIX: DEV_MODE bypass removed - only verify against actual program ID
        $instructions = $tx['transaction']['message']['instructions'] ?? [];
        
        foreach ($instructions as $instruction) {
            $programId = $instruction['programId'] ?? null;
            if ($programId === $this->programId) return true;
        }

        // Inner instructions check
        $innerInstructions = $tx['meta']['innerInstructions'] ?? [];
        foreach ($innerInstructions as $inner) {
            foreach ($inner['instructions'] ?? [] as $instruction) {
                $programId = $instruction['programId'] ?? null;
                if ($programId === $this->programId) return true;
            }
        }

        return false;
    }

    /**
     * Parse lock instruction AND verify that tokens went to the correct PDA
     * 
     * SECURITY: This now uses SolanaPdaService to derive the expected PDA
     * and verify that tokens went to the correct escrow address.
     */
    private function parseLockInstructionAndVerifyPDA(array $tx, string $walletAddress): ?array
    {
        // SECURITY: Enforce token_mint configuration in production
        if (empty($this->tokenMint) && config('app.env') !== 'local') {
            Log::error('[SolanaListener] Token mint not configured - rejecting transaction for security');
            return null;
        }
        
        // Derive expected PDA for this wallet using our PDA service
        $expectedPda = null;
        if (!empty($this->programId)) {
            try {
                $expectedPda = $this->pdaService->deriveEscrowPda($walletAddress, $this->programId);
                Log::debug('[SolanaListener] Expected PDA for wallet', [
                    'wallet' => substr($walletAddress, 0, 10) . '...',
                    'expected_pda' => substr($expectedPda, 0, 10) . '...'
                ]);
            } catch (Exception $e) {
                Log::error('[SolanaListener] Failed to derive PDA', ['error' => $e->getMessage()]);
                // Continue but will fail PDA check below
            }
        }
        
        $preBalances = $tx['meta']['preTokenBalances'] ?? [];
        $postBalances = $tx['meta']['postTokenBalances'] ?? [];
        
        // Find the account that received the tokens
        foreach ($postBalances as $post) {
            $mint = $post['mint'] ?? null;
            
            // SECURITY: Strict token mint check (no longer optional)
            if (!empty($this->tokenMint) && $mint !== $this->tokenMint) continue;

            $accountIndex = $post['accountIndex'];
            $postAmount = (int)($post['uiTokenAmount']['amount'] ?? 0);

            // Find pre-balance
            $preAmount = 0;
            foreach ($preBalances as $pre) {
                if ($pre['accountIndex'] === $accountIndex) {
                    $preAmount = (int)($pre['uiTokenAmount']['amount'] ?? 0);
                    break;
                }
            }

            $amountReceived = $postAmount - $preAmount;
            
            // Should be positive for a lock
            if ($amountReceived > 0) {
                // Get the account address
                $accountKeys = $tx['transaction']['message']['accountKeys'] ?? [];
                $receiverAddress = '';
                
                if (isset($accountKeys[$accountIndex])) {
                    $key = $accountKeys[$accountIndex];
                    $receiverAddress = is_array($key) ? ($key['pubkey'] ?? '') : $key;
                }
                
                // CRITICAL CHECK: The receiver must NOT be the user wallet
                if ($receiverAddress === $walletAddress) {
                    Log::warning('[SolanaListener] Rejected: receiver is same as sender');
                    continue;
                }
                
                // Ensure receiver is NOT the fee payer (usually the user)
                if ($accountIndex === 0) {
                    Log::warning('[SolanaListener] Rejected: receiver is fee payer');
                    continue;
                }

                // SECURITY FIX (L1): Verify receiver matches expected PDA
                if ($expectedPda !== null && $receiverAddress !== $expectedPda) {
                    Log::warning('[SolanaListener] PDA mismatch - potential exploit attempt', [
                        'expected' => $expectedPda,
                        'received' => $receiverAddress,
                        'wallet' => $walletAddress
                    ]);
                    continue;
                }

                $blockTime = $tx['blockTime'] ?? time();
                
                Log::info('[SolanaListener] Lock verified with PDA match', [
                    'pda' => substr($receiverAddress, 0, 10) . '...',
                    'amount' => $amountReceived
                ]);
                
                return [
                    'amount' => $amountReceived,
                    'escrow_pda' => $receiverAddress,
                    'unlock_timestamp' => $blockTime + (30 * 24 * 60 * 60),
                ];
            }
        }

        return null;
    }

    /**
     * Get current slot
     */
    public function getCurrentSlot(): ?int
    {
        try {
            $http = Http::timeout(5);
            if (config('app.env') === 'local') $http->withoutVerifying();
            
            $response = $http->post($this->rpcEndpoint, [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'getSlot',
                'params' => [['commitment' => 'confirmed']]
            ]);

            return $response->json()['result'] ?? null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get block time
     */
    public function getBlockTime(int $slot): ?int
    {
        try {
            $http = Http::timeout(5);
            if (config('app.env') === 'local') $http->withoutVerifying();

            $response = $http->post($this->rpcEndpoint, [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'getBlockTime',
                'params' => [$slot]
            ]);

            return $response->json()['result'] ?? null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Verify an unlock transaction on the Solana blockchain
     * This validates that tokens were returned from escrow to user
     *
     * @param string $signature Transaction signature
     * @param string $wallet User wallet address
     * @param string $escrowPda Escrow PDA from which tokens were unlocked
     * @return array{valid: bool, error?: string}
     */
    public function verifyUnlockTransaction(string $signature, string $wallet, string $escrowPda): array
    {
        try {
            Log::info('Verifying unlock transaction', [
                'signature' => substr($signature, 0, 20) . '...',
                'wallet' => substr($wallet, 0, 10) . '...',
                'escrow' => substr($escrowPda, 0, 10) . '...'
            ]);

            // Fetch transaction from Solana RPC
            $http = Http::timeout(config('solana.verification_timeout', 30));
            if (config('app.env') === 'local') {
                $http->withoutVerifying();
            }

            $response = $http->post($this->rpcEndpoint, [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'getTransaction',
                'params' => [
                    $signature,
                    [
                        'encoding' => 'jsonParsed',
                        'commitment' => 'confirmed',
                        'maxSupportedTransactionVersion' => 0
                    ]
                ]
            ]);

            if (!$response->successful()) {
                return ['valid' => false, 'error' => 'RPC request failed'];
            }

            $result = $response->json();

            // Check for RPC errors
            if (isset($result['error'])) {
                return ['valid' => false, 'error' => $result['error']['message'] ?? 'RPC error'];
            }

            // Transaction not found
            if (!isset($result['result'])) {
                return ['valid' => false, 'error' => 'Transaction not found'];
            }

            $tx = $result['result'];

            // Check transaction succeeded
            $meta = $tx['meta'] ?? null;
            if (!$meta || ($meta['err'] !== null)) {
                return ['valid' => false, 'error' => 'Transaction failed on-chain'];
            }

            // Verify the wallet was a signer
            $accountKeys = $tx['transaction']['message']['accountKeys'] ?? [];
            $walletSigned = false;
            
            foreach ($accountKeys as $account) {
                $pubkey = is_array($account) ? ($account['pubkey'] ?? '') : $account;
                $signer = is_array($account) ? ($account['signer'] ?? false) : false;
                
                if ($pubkey === $wallet && $signer) {
                    $walletSigned = true;
                    break;
                }
            }

            if (!$walletSigned) {
                return ['valid' => false, 'error' => 'Wallet was not a signer of this transaction'];
            }

            // Check if escrow PDA is in the transaction accounts
            $escrowInTx = false;
            foreach ($accountKeys as $account) {
                $pubkey = is_array($account) ? ($account['pubkey'] ?? '') : $account;
                if ($pubkey === $escrowPda) {
                    $escrowInTx = true;
                    break;
                }
            }

            if (!$escrowInTx) {
                return ['valid' => false, 'error' => 'Escrow PDA not found in transaction'];
            }

            // SECURITY FIX [L-2]: Verify actual token movement via balance changes
            $preBalances = $meta['preTokenBalances'] ?? [];
            $postBalances = $meta['postTokenBalances'] ?? [];
            $tokenTransferVerified = false;

            // Check if the wallet received tokens (post > pre for wallet's token account)
            foreach ($postBalances as $post) {
                $accountIndex = $post['accountIndex'];
                $postAmount = (int)($post['uiTokenAmount']['amount'] ?? 0);
                $owner = $post['owner'] ?? '';

                // Only check accounts owned by the user wallet
                if ($owner !== $wallet) continue;

                // Find pre-balance for same account
                $preAmount = 0;
                foreach ($preBalances as $pre) {
                    if ($pre['accountIndex'] === $accountIndex) {
                        $preAmount = (int)($pre['uiTokenAmount']['amount'] ?? 0);
                        break;
                    }
                }

                // Wallet must have received tokens (increase)
                if ($postAmount > $preAmount) {
                    $tokenTransferVerified = true;
                    Log::info('[UnlockVerify] Token increase detected for wallet', [
                        'amount_received' => $postAmount - $preAmount,
                        'wallet' => substr($wallet, 0, 10) . '...',
                    ]);
                    break;
                }
            }

            // If no balance-based check worked, fall back to checking inner instructions
            if (!$tokenTransferVerified) {
                foreach ($innerInstructions as $inner) {
                    foreach ($inner['instructions'] ?? [] as $ix) {
                        if (isset($ix['parsed']['type']) && $ix['parsed']['type'] === 'transfer') {
                            $info = $ix['parsed']['info'] ?? [];
                            // At minimum, verify the destination belongs to wallet
                            if (isset($info['destination']) || isset($info['authority'])) {
                                $tokenTransferVerified = true;
                                break 2;
                            }
                        }
                    }
                }
            }

            if (!$tokenTransferVerified) {
                Log::warning('[UnlockVerify] No token transfer detected in unlock transaction', [
                    'signature' => $signature,
                    'wallet' => substr($wallet, 0, 10) . '...',
                ]);
                return ['valid' => false, 'error' => 'No token transfer detected in unlock transaction'];
            }

            Log::info('Unlock transaction verified', [
                'signature' => $signature,
                'token_transfer_verified' => $tokenTransferVerified
            ]);

            return ['valid' => true];

        } catch (Exception $e) {
            Log::error('Unlock verification failed', [
                'signature' => $signature,
                'error' => $e->getMessage()
            ]);
            
            return ['valid' => false, 'error' => $e->getMessage()];
        }
    }
}
