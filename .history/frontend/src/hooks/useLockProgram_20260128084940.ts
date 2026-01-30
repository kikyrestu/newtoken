import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    PublicKey,
    Transaction,
    TransactionInstruction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { useCallback, useState } from 'react';

// ============================================================================
// CONFIGURATION - Update these values with your actual addresses
// ============================================================================

// Demo Mode Configuration
// Set VITE_ENABLE_DEMO_MODE=true in .env to test UI without blockchain
const DEMO_MODE = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

// Your deployed Anchor program ID
const PROGRAM_ID = new PublicKey(
    import.meta.env.VITE_PROGRAM_ID || '11111111111111111111111111111111'
);

// Your token mint address
const TOKEN_MINT = new PublicKey(
    import.meta.env.VITE_TOKEN_MINT || '11111111111111111111111111111111'
);

// Backend API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export const TIERS = {
    spectator: { usd: 25, durationDays: 30, name: 'Spectator' },
    operator: { usd: 150, durationDays: 30, name: 'Mission Operator' },
    elite: { usd: 250, durationDays: 30, name: 'Elite Operator' }
} as const;

export type TierType = keyof typeof TIERS;

export interface LockResult {
    signature: string;
    escrowPda: string;
    unlockTimestamp: string;
}

export interface EscrowData {
    owner: PublicKey;
    amount: bigint;
    tier: string;
    lockTimestamp: number;
    unlockTimestamp: number;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useLockProgram() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, signTransaction } = useWallet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ========================================================================
    // PDA DERIVATION
    // ========================================================================

    /**
     * Derive the escrow PDA for a user
     * Seeds: ["escrow", user_pubkey]
     */
    const getEscrowPDA = useCallback((userPubkey: PublicKey): [PublicKey, number] => {
        return PublicKey.findProgramAddressSync(
            [Buffer.from('escrow'), userPubkey.toBuffer()],
            PROGRAM_ID
        );
    }, []);

    /**
     * Derive the escrow token account PDA
     * This is the ATA owned by the escrow PDA
     */
    const getEscrowTokenAccount = useCallback(async (escrowPDA: PublicKey): Promise<PublicKey> => {
        return await getAssociatedTokenAddress(
            TOKEN_MINT,
            escrowPDA,
            true // allowOwnerOffCurve - required for PDAs
        );
    }, []);

    // ========================================================================
    // TOKEN BALANCE
    // ========================================================================

    /**
     * Get user's token balance
     * @returns Balance in smallest unit (lamports)
     */
    const getTokenBalance = useCallback(async (): Promise<bigint> => {
        if (!publicKey) return BigInt(0);

        try {
            const tokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);
            const accountInfo = await connection.getAccountInfo(tokenAccount);

            if (!accountInfo) {
                return BigInt(0); // Token account doesn't exist
            }

            const balance = await connection.getTokenAccountBalance(tokenAccount);
            return BigInt(balance.value.amount);
        } catch (err) {
            console.error('Failed to get token balance:', err);
            return BigInt(0);
        }
    }, [publicKey, connection]);

    /**
     * Check if user has sufficient balance for a tier
     */
    const hasSufficientBalance = useCallback(async (requiredAmount: bigint): Promise<boolean> => {
        // In Demo Mode, always return true
        if (DEMO_MODE) return true;

        const balance = await getTokenBalance();
        return balance >= requiredAmount;
    }, [getTokenBalance]);

    // ========================================================================
    // LOCK TOKENS
    // ========================================================================

    /**
     * Lock tokens into escrow PDA
     * 
     * @param tier The tier to purchase
     * @param tokenAmount Amount in smallest unit (from price oracle)
     * @returns Lock result with signature and escrow PDA
     */
    const lockTokens = useCallback(async (
        tier: TierType,
        tokenAmount: bigint
    ): Promise<LockResult | null> => {
        if (!publicKey) {
            setError('Wallet not connected');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            // --- DEMO MODE BLOCK ---
            if (DEMO_MODE) {
                console.log('🔵 DEMO MODE: Simulating Lock Transaction...');
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

                // Simulate success
                const mockSignature = '5P3g...DEMO_MODE_SIGNATURE...' + Date.now();
                const [escrowPDA] = getEscrowPDA(publicKey);

                // Call backend mock verify if needed, or just return success (or could call backend if backend supports demo)

                console.log('🟢 DEMO MODE: Lock Successful!');
                return {
                    signature: mockSignature,
                    escrowPda: escrowPDA.toBase58(),
                    // Default 30 days unlock
                    unlockTimestamp: new Date(Date.now() + TIERS[tier].durationDays * 86400000).toISOString()
                };
            }
            // -----------------------

            if (!signTransaction) {
                throw new Error('Wallet does not support signing');
            }

            // 1. Check balance first
            const hasBalance = await hasSufficientBalance(tokenAmount);
            if (!hasBalance) {
                throw new Error('Insufficient token balance');
            }

            // 2. Get user's token account
            const userTokenAccount = await getAssociatedTokenAddress(
                TOKEN_MINT,
                publicKey
            );

            // 3. Derive escrow PDA and its token account
            const [escrowPDA, escrowBump] = getEscrowPDA(publicKey);
            const escrowTokenAccount = await getEscrowTokenAccount(escrowPDA);

            // 4. Build transaction
            const tx = new Transaction();

            // 5. Check if escrow token account needs creation
            const escrowTokenInfo = await connection.getAccountInfo(escrowTokenAccount);
            if (!escrowTokenInfo) {
                tx.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey, // payer
                        escrowTokenAccount, // ata
                        escrowPDA, // owner
                        TOKEN_MINT // mint
                    )
                );
            }

            // 6. Create lock instruction
            // NOTE: This creates a simplified instruction structure
            // In production, use @coral-xyz/anchor to properly serialize
            const lockDuration = TIERS[tier].durationDays * 24 * 60 * 60; // to seconds

            const lockInstruction = createLockInstruction(
                publicKey,
                escrowPDA,
                escrowBump,
                userTokenAccount,
                escrowTokenAccount,
                tokenAmount,
                lockDuration,
                tier
            );
            tx.add(lockInstruction);

            // 7. Get recent blockhash
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;

            // 8. Send transaction
            const signature = await sendTransaction(tx, connection, {
                skipPreflight: false,
                preflightCommitment: 'confirmed'
            });

            // 9. Wait for confirmation
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                throw new Error('Transaction failed on-chain');
            }

            // 10. Notify backend
            const backendResponse = await verifyLockWithBackend(signature, publicKey.toBase58(), tier);

            if (!backendResponse.success) {
                console.warn('Backend verification warning:', backendResponse.error);
                // Don't fail - transaction was successful on chain
            }

            console.log('Lock successful:', {
                signature,
                escrowPDA: escrowPDA.toBase58(),
                amount: tokenAmount.toString()
            });

            return {
                signature,
                escrowPda: escrowPDA.toBase58(),
                unlockTimestamp: backendResponse.data?.unlock_timestamp || ''
            };

        } catch (err: any) {
            console.error('Lock failed:', err);
            setError(err.message || 'Lock transaction failed');
            return null;
        } finally {
            setLoading(false);
        }
    }, [publicKey, signTransaction, connection, sendTransaction, getEscrowPDA, getEscrowTokenAccount, hasSufficientBalance]);

    // ========================================================================
    // UNLOCK TOKENS
    // ========================================================================

    /**
     * Unlock tokens from escrow after lock period
     */
    const unlockTokens = useCallback(async (): Promise<string | null> => {
        if (!publicKey) {
            setError('Wallet not connected');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Get escrow PDA
            const [escrowPDA, escrowBump] = getEscrowPDA(publicKey);
            const escrowTokenAccount = await getEscrowTokenAccount(escrowPDA);
            const userTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);

            // 2. Build unlock transaction
            const tx = new Transaction();

            const unlockInstruction = createUnlockInstruction(
                publicKey,
                escrowPDA,
                escrowBump,
                userTokenAccount,
                escrowTokenAccount
            );
            tx.add(unlockInstruction);

            // 3. Get recent blockhash
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;

            // 4. Send transaction
            const signature = await sendTransaction(tx, connection);

            // 5. Wait for confirmation
            await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            return signature;

        } catch (err: any) {
            console.error('Unlock failed:', err);
            setError(err.message || 'Unlock transaction failed');
            return null;
        } finally {
            setLoading(false);
        }
    }, [publicKey, signTransaction, connection, sendTransaction, getEscrowPDA, getEscrowTokenAccount]);

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    /**
     * Format token amount for display (9 decimals)
     */
    const formatTokenAmount = useCallback((amount: bigint | number): string => {
        const num = typeof amount === 'bigint' ? Number(amount) : amount;
        return (num / 1_000_000_000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        });
    }, []);

    /**
     * Get Solscan URL for a transaction
     */
    const getSolscanUrl = useCallback((signature: string): string => {
        const cluster = import.meta.env.VITE_SOLSCAN_CLUSTER || 'mainnet';
        const clusterParam = cluster === 'mainnet' ? '' : `?cluster=${cluster}`;
        return `https://solscan.io/tx/${signature}${clusterParam}`;
    }, []);

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        // Actions
        lockTokens,
        unlockTokens,
        getTokenBalance,
        hasSufficientBalance,

        // PDA helpers
        getEscrowPDA,
        getEscrowTokenAccount,

        // Utilities
        formatTokenAmount,
        getSolscanUrl,

        // State
        loading,
        error,
        connected: !!publicKey,

        // Config
        programId: PROGRAM_ID,
        tokenMint: TOKEN_MINT
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create the lock instruction
 * NOTE: This is a simplified version. In production, use @coral-xyz/anchor
 * to properly serialize instruction data according to your IDL.
 */
function createLockInstruction(
    user: PublicKey,
    escrowPda: PublicKey,
    _escrowBump: number, // Reserved for PDA signing if needed
    userTokenAccount: PublicKey,
    escrowTokenAccount: PublicKey,
    amount: bigint,
    lockDuration: number,
    tier: string
): TransactionInstruction {
    // Instruction discriminator for "lock_tokens" 
    // This should match your Anchor program's instruction discriminator
    const discriminator = Buffer.from([0x01]); // Placeholder - update with actual

    // Encode instruction data
    // Format: discriminator + amount (u64) + lock_duration (i64) + tier (string)
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(amount);

    const durationBuffer = Buffer.alloc(8);
    durationBuffer.writeBigInt64LE(BigInt(lockDuration));

    const tierBuffer = Buffer.from(tier);
    const tierLenBuffer = Buffer.alloc(4);
    tierLenBuffer.writeUInt32LE(tierBuffer.length);

    const data = Buffer.concat([
        discriminator,
        amountBuffer,
        durationBuffer,
        tierLenBuffer,
        tierBuffer
    ]);

    return new TransactionInstruction({
        keys: [
            { pubkey: user, isSigner: true, isWritable: true }, // user
            { pubkey: escrowPda, isSigner: false, isWritable: true }, // escrow_account
            { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // user_token_account
            { pubkey: escrowTokenAccount, isSigner: false, isWritable: true }, // escrow_token_account
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
        ],
        programId: PROGRAM_ID,
        data
    });
}

/**
 * Create the unlock instruction
 */
function createUnlockInstruction(
    user: PublicKey,
    escrowPda: PublicKey,
    _escrowBump: number, // Reserved for PDA signing if needed
    userTokenAccount: PublicKey,
    escrowTokenAccount: PublicKey
): TransactionInstruction {
    // Instruction discriminator for "unlock_tokens"
    const discriminator = Buffer.from([0x02]); // Placeholder - update with actual

    return new TransactionInstruction({
        keys: [
            { pubkey: user, isSigner: true, isWritable: true }, // user
            { pubkey: escrowPda, isSigner: false, isWritable: true }, // escrow_account
            { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // user_token_account
            { pubkey: escrowTokenAccount, isSigner: false, isWritable: true }, // escrow_token_account
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
        ],
        programId: PROGRAM_ID,
        data: discriminator
    });
}

/**
 * Verify lock transaction with backend
 */
async function verifyLockWithBackend(
    signature: string,
    wallet: string,
    tier: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/lock/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ signature, wallet, tier })
        });

        const data = await response.json();
        return {
            success: data.success ?? false,
            data: data.data,
            error: data.error
        };
    } catch (err: any) {
        console.error('Backend verification failed:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

export default useLockProgram;
