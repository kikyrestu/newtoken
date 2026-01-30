<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;

class SolanaListenerService
{
    private string $rpcEndpoint;
    private string $programId;
    private string $tokenMint;

    public function __construct()
    {
        $this->rpcEndpoint = config('solana.rpc_endpoint', 'https://api.mainnet-beta.solana.com');
        $this->programId = config('solana.program_id', '');
        $this->tokenMint = config('solana.token_mint', '');
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
        try {
            // 1. Fetch transaction from Solana RPC
            $response = Http::timeout(config('solana.verification_timeout', 30))
                ->withoutVerifying()
                ->post($this->rpcEndpoint, [
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
                    'status' => $response->status()
                ]);
                return ['valid' => false, 'error' => 'RPC request failed'];
            }

            $result = $response->json();

            // Check for RPC errors
            if (isset($result['error'])) {
                Log::error('Solana RPC error', [
                    'signature' => $signature,
                    'error' => $result['error']
                ]);
                return ['valid' => false, 'error' => $result['error']['message'] ?? 'Unknown RPC error'];
            }

            $tx = $result['result'] ?? null;

            if (!$tx) {
                return ['valid' => false, 'error' => 'Transaction not found'];
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

            // 5. Parse lock instruction data
            $lockData = $this->parseLockInstruction($tx);
            
            if (!$lockData) {
                return ['valid' => false, 'error' => 'Could not parse lock instruction'];
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
                'error' => $e->getMessage()
            ]);
            
            return ['valid' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Check if our program was invoked in the transaction
     */
    private function checkProgramInvocation(array $tx): bool
    {
        if (empty($this->programId)) {
            // If no program ID configured, skip this check (for development)
            Log::warning('Program ID not configured, skipping program verification');
            return true;
        }

        // DEV MODE: Allow SPL Token Program ID (for Transfer Fallback)
        $isDevMode = env('DEV_MODE', false);
        $splTokenProgram = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

        $instructions = $tx['transaction']['message']['instructions'] ?? [];
        
        foreach ($instructions as $instruction) {
            $programId = $instruction['programId'] ?? null;
            if ($programId === $this->programId) {
                return true;
            }
            if ($isDevMode && $programId === $splTokenProgram) {
                return true;
            }
        }

        // Also check inner instructions
        $innerInstructions = $tx['meta']['innerInstructions'] ?? [];
        foreach ($innerInstructions as $inner) {
            foreach ($inner['instructions'] ?? [] as $instruction) {
                $programId = $instruction['programId'] ?? null;
                if ($programId === $this->programId) {
                    return true;
                }
                if ($isDevMode && $programId === $splTokenProgram) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Parse the lock instruction to extract amount and escrow PDA
     */
    private function parseLockInstruction(array $tx): ?array
    {
        // For now, we'll extract transfer amount from token balances
        $preBalances = $tx['meta']['preTokenBalances'] ?? [];
        $postBalances = $tx['meta']['postTokenBalances'] ?? [];

        // Find the escrow account (the one that received tokens)
        foreach ($postBalances as $post) {
            $mint = $post['mint'] ?? null;
            
            // Skip if not our token
            if ($this->tokenMint && $mint !== $this->tokenMint) {
                continue;
            }

            $accountIndex = $post['accountIndex'];
            $postAmount = (int)($post['uiTokenAmount']['amount'] ?? 0);

            // Find corresponding pre-balance
            $preAmount = 0;
            foreach ($preBalances as $pre) {
                if ($pre['accountIndex'] === $accountIndex) {
                    $preAmount = (int)($pre['uiTokenAmount']['amount'] ?? 0);
                    break;
                }
            }

            // If this account received tokens, it might be the escrow
            $amountReceived = $postAmount - $preAmount;
            if ($amountReceived > 0) {
                // Get the account address from accountKeys
                $accountKeys = $tx['transaction']['message']['accountKeys'] ?? [];
                $escrowPda = '';
                
                if (isset($accountKeys[$accountIndex])) {
                    $key = $accountKeys[$accountIndex];
                    $escrowPda = is_array($key) ? ($key['pubkey'] ?? '') : $key;
                }

                // Parse unlock timestamp from instruction data if available
                // For now, default to 30 days from block time
                $blockTime = $tx['blockTime'] ?? time();
                $unlockTimestamp = $blockTime + (30 * 24 * 60 * 60);

                return [
                    'amount' => $amountReceived,
                    'escrow_pda' => $escrowPda,
                    'unlock_timestamp' => $unlockTimestamp,
                ];
            }
        }

        return null;
    }

    /**
     * Get current slot (for time synchronization)
     */
    public function getCurrentSlot(): ?int
    {
        try {
            $response = Http::withoutVerifying()->post($this->rpcEndpoint, [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'getSlot',
                'params' => [['commitment' => 'confirmed']]
            ]);

            return $response->json()['result'] ?? null;
        } catch (Exception $e) {
            Log::error('Failed to get current slot', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Get block time for a slot
     */
    public function getBlockTime(int $slot): ?int
    {
        try {
            $response = Http::withoutVerifying()->post($this->rpcEndpoint, [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'getBlockTime',
                'params' => [$slot]
            ]);

            return $response->json()['result'] ?? null;
        } catch (Exception $e) {
            Log::error('Failed to get block time', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Check transaction confirmation status
     */
    public function getTransactionStatus(string $signature): ?string
    {
        try {
            $response = Http::withoutVerifying()->post($this->rpcEndpoint, [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'getSignatureStatuses',
                'params' => [[$signature]]
            ]);

            $result = $response->json()['result']['value'][0] ?? null;
            
            if (!$result) {
                return null;
            }

            if ($result['err']) {
                return 'failed';
            }

            return $result['confirmationStatus'] ?? 'unknown';
        } catch (Exception $e) {
            return null;
        }
    }
}
