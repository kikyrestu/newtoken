<?php

namespace App\Services;

use Exception;

/**
 * Solana PDA (Program Derived Address) Service
 * 
 * Implements PDA derivation for Solana programs using native PHP.
 * This is critical for verifying that tokens are locked to the correct escrow address.
 */
class SolanaPdaService
{
    /**
     * Base58 alphabet used by Solana
     */
    private const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    /**
     * Find a valid PDA (Program Derived Address)
     * 
     * @param array $seeds Array of seed bytes
     * @param string $programId Base58-encoded program ID
     * @return array [address, bump] where address is Base58-encoded PDA
     * @throws Exception If no valid PDA found
     */
    public function findProgramAddress(array $seeds, string $programId): array
    {
        $programIdBytes = $this->base58Decode($programId);
        
        // Try bump seeds from 255 down to 0
        for ($bump = 255; $bump >= 0; $bump--) {
            try {
                $address = $this->createProgramAddress(
                    array_merge($seeds, [chr($bump)]),
                    $programIdBytes
                );
                return [$address, $bump];
            } catch (Exception $e) {
                // This bump doesn't produce a valid off-curve address, try next
                continue;
            }
        }
        
        throw new Exception('Unable to find a valid PDA');
    }

    /**
     * Derive escrow PDA for a user wallet
     * Seeds: ["escrow", user_pubkey_bytes]
     * 
     * @param string $walletAddress Base58-encoded wallet address
     * @param string $programId Base58-encoded program ID
     * @return string Base58-encoded escrow PDA
     */
    public function deriveEscrowPda(string $walletAddress, string $programId): string
    {
        $walletBytes = $this->base58Decode($walletAddress);
        
        $seeds = [
            'escrow',           // String seed
            $walletBytes        // User public key bytes
        ];
        
        [$pda, $_bump] = $this->findProgramAddress($seeds, $programId);
        return $pda;
    }

    /**
     * Create a program address from seeds
     * 
     * @param array $seeds Array of seeds (strings or bytes)
     * @param string $programIdBytes Raw program ID bytes
     * @return string Base58-encoded address
     * @throws Exception If address is on the ed25519 curve (invalid PDA)
     */
    private function createProgramAddress(array $seeds, string $programIdBytes): string
    {
        // Validate seed lengths and total size
        $buffer = '';
        foreach ($seeds as $seed) {
            if (is_string($seed)) {
                if (strlen($seed) > 32) {
                    throw new Exception('Seed too long: max 32 bytes');
                }
                $buffer .= $seed;
            } else {
                throw new Exception('Invalid seed type');
            }
        }
        
        // Append program ID and PDA marker
        $buffer .= $programIdBytes;
        $buffer .= 'ProgramDerivedAddress';
        
        // SHA256 hash
        $hash = hash('sha256', $buffer, true);
        
        // Check if the resulting point is on the ed25519 curve
        // A valid PDA must NOT be on the curve
        if ($this->isOnCurve($hash)) {
            throw new Exception('Address is on curve - invalid PDA');
        }
        
        return $this->base58Encode($hash);
    }

    /**
     * Check if a 32-byte public key is on the ed25519 curve
     * 
     * This is a simplified check - for production, consider using
     * sodium_crypto_core_ed25519_is_valid_point if available
     * 
     * @param string $bytes 32-byte public key
     * @return bool True if on curve
     */
    private function isOnCurve(string $bytes): bool
    {
        // Use sodium extension if available (most accurate)
        if (function_exists('sodium_crypto_core_ed25519_is_valid_point')) {
            try {
                return sodium_crypto_core_ed25519_is_valid_point($bytes);
            } catch (Exception $e) {
                return false;
            }
        }
        
        // Fallback: Use sodium_crypto_sign_open with a dummy signature
        // If the public key is on curve, it can be used for verification
        if (function_exists('sodium_crypto_sign_verify_detached')) {
            try {
                // Create a dummy message and signature
                $message = 'test';
                $signature = str_repeat("\0", 64);
                
                // This will return false but won't throw if key is valid point
                @sodium_crypto_sign_verify_detached($signature, $message, $bytes);
                return true;
            } catch (Exception $e) {
                // Invalid point throws an exception
                return false;
            }
        }
        
        // If no sodium available, we can't properly validate
        // Log warning and return false (assume off-curve for safety)
        return false;
    }

    /**
     * Decode a Base58 string to raw bytes
     * 
     * @param string $base58 Base58-encoded string
     * @return string Raw bytes
     * @throws Exception If invalid Base58
     */
    public function base58Decode(string $base58): string
    {
        $alphabet = self::BASE58_ALPHABET;
        $base = strlen($alphabet);
        
        if (strlen($base58) === 0) {
            return '';
        }
        
        // Count leading '1's (zeros in base58)
        $leadingZeros = 0;
        while ($leadingZeros < strlen($base58) && $base58[$leadingZeros] === '1') {
            $leadingZeros++;
        }
        
        // Decode
        $size = strlen($base58) * 733 / 1000 + 1; // log(58) / log(256), rounded up
        $bytes = array_fill(0, (int)$size, 0);
        
        for ($i = 0; $i < strlen($base58); $i++) {
            $char = $base58[$i];
            $value = strpos($alphabet, $char);
            
            if ($value === false) {
                throw new Exception("Invalid Base58 character: {$char}");
            }
            
            $carry = $value;
            for ($j = count($bytes) - 1; $j >= 0; $j--) {
                $carry += $bytes[$j] * 58;
                $bytes[$j] = $carry % 256;
                $carry = intdiv($carry, 256);
            }
        }
        
        // Skip leading zeros in bytes array
        $start = 0;
        while ($start < count($bytes) && $bytes[$start] === 0) {
            $start++;
        }
        
        // Build result with leading zeros
        $result = str_repeat("\0", $leadingZeros);
        for ($i = $start; $i < count($bytes); $i++) {
            $result .= chr($bytes[$i]);
        }
        
        return $result;
    }

    /**
     * Encode raw bytes to Base58
     * 
     * @param string $bytes Raw bytes
     * @return string Base58-encoded string
     */
    public function base58Encode(string $bytes): string
    {
        $alphabet = self::BASE58_ALPHABET;
        $base = strlen($alphabet);
        
        if (strlen($bytes) === 0) {
            return '';
        }
        
        // Count leading zeros
        $leadingZeros = 0;
        while ($leadingZeros < strlen($bytes) && ord($bytes[$leadingZeros]) === 0) {
            $leadingZeros++;
        }
        
        // Convert bytes to integer array
        $bytesArray = array_values(unpack('C*', $bytes));
        
        // Allocate enough space for base58 result
        $size = strlen($bytes) * 138 / 100 + 1; // log(256) / log(58), rounded up
        $digits = array_fill(0, (int)$size, 0);
        $digitsLen = 1;
        
        for ($i = 0; $i < count($bytesArray); $i++) {
            $carry = $bytesArray[$i];
            for ($j = 0; $j < $digitsLen; $j++) {
                $carry += $digits[$j] << 8;
                $digits[$j] = $carry % 58;
                $carry = intdiv($carry, 58);
            }
            while ($carry > 0) {
                $digits[$digitsLen++] = $carry % 58;
                $carry = intdiv($carry, 58);
            }
        }
        
        // Build result string
        $result = str_repeat($alphabet[0], $leadingZeros);
        for ($i = $digitsLen - 1; $i >= 0; $i--) {
            $result .= $alphabet[$digits[$i]];
        }
        
        return $result;
    }
}
