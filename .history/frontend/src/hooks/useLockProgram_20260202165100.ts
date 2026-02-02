import { Buffer } from 'buffer';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    PublicKey,
    Transaction,
    TransactionInstruction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    ComputeBudgetProgram
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { useCallback, useState } from 'react';

// ============================================================================
// CONFIGURATION - Dynamic from Admin Dashboard
// ============================================================================

// Backend API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Default values from env (used as fallback)
const DEFAULT_PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID || '';
const DEFAULT_TOKEN_MINT = import.meta.env.VITE_TOKEN_MINT || '';
const DEFAULT_TREASURY = import.meta.env.VITE_TREASURY_WALLET || '';

// Cache for dynamic config
let cachedConfig: { programId: string; tokenMint: string; decimals: number; treasuryWallet: string } | null = null;
let configLastFetched = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute

// Unlock availability - Enabled for Production/Testing
export const UNLOCK_ENABLED = true;

/**
 * Fetch blockchain config from backend
 */
async function fetchBlockchainConfig(): Promise<{ programId: string; tokenMint: string; decimals: number; treasuryWallet: string }> {
    const now = Date.now();

    // Return cached if still valid
    if (cachedConfig && (now - configLastFetched) < CONFIG_CACHE_TTL) {
        return cachedConfig;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/settings/blockchain_config`, {
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.value) {
                cachedConfig = {
                    programId: data.value.program_id || DEFAULT_PROGRAM_ID,
                    tokenMint: data.value.token_mint || DEFAULT_TOKEN_MINT,
                    decimals: data.value.token_decimals || 9,
                    treasuryWallet: data.value.treasury_wallet || DEFAULT_TREASURY
                };
                configLastFetched = now;
                return cachedConfig;
            }
        }
    } catch (err) {
        console.debug('[useLockProgram] Failed to fetch config, using env defaults');
    }

    // Return defaults from environment
    return {
        programId: DEFAULT_PROGRAM_ID,
        tokenMint: DEFAULT_TOKEN_MINT,
        decimals: 9,
        treasuryWallet: DEFAULT_TREASURY
    };
}

// Initialize with System Program (will be updated dynamically)
let PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
let TOKEN_MINT = new PublicKey('11111111111111111111111111111111');
let TREASURY_WALLET = new PublicKey('11111111111111111111111111111111');
export let TOKEN_DECIMALS = 9;

// Fetch config on module load (non-blocking)
fetchBlockchainConfig().then(config => {
    try {
        if (config.programId) PROGRAM_ID = new PublicKey(config.programId);
        if (config.tokenMint) TOKEN_MINT = new PublicKey(config.tokenMint);
        if (config.treasuryWallet) TREASURY_WALLET = new PublicKey(config.treasuryWallet);
        TOKEN_DECIMALS = config.decimals;
    } catch (err) {
        console.error('[useLockProgram] Invalid config addresses:', err);
    }
}).catch(() => { });


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

            // 5. Determine destination - Treasury (transfer mode) or Escrow PDA (program mode)
            let destinationTokenAccount;
            const isPlaceholderProgram = PROGRAM_ID.toBase58() === '11111111111111111111111111111111';

            // Use Treasury wallet from config (fetched from API)
            if (isPlaceholderProgram || !PROGRAM_ID) {
                // --- TRANSFER MODE ---
                // Lock = Transfer tokens to Treasury wallet
                // Unlock = Manual admin transfer back (via backend)
                console.log('📦 TRANSFER MODE: Locking tokens to Treasury wallet');

                // Get Treasury ATA
                destinationTokenAccount = await getAssociatedTokenAddress(
                    TOKEN_MINT,
                    TREASURY_WALLET
                );

                // Create Transfer Instruction
                const transferIx = createTransferInstruction(
                    userTokenAccount,      // source
                    destinationTokenAccount, // destination
                    publicKey,             // owner
                    tokenAmount            // amount
                );
                tx.add(transferIx);

            } else {
                // --- REAL ANCHOR LOCK MODE ---
                destinationTokenAccount = escrowTokenAccount;

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
            }

            // 7. Get recent blockhash
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;

            // Add Priority Fee (Fix for "Block height exceeded" errors)
            const PRIORITY_FEE_IX = ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 5000
            });
            const COMPUTE_LIMIT_IX = ComputeBudgetProgram.setComputeUnitLimit({
                units: 200000
            });
            tx.add(PRIORITY_FEE_IX, COMPUTE_LIMIT_IX);

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
     * @param lockId - The database lock transaction ID to unlock
     */
    const unlockTokens = useCallback(async (lockId: number): Promise<string | null> => {
        if (!publicKey) {
            setError('Wallet not connected');
            return null;
        }

        if (!lockId) {
            setError('Lock ID is required');
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

            // Add Priority Fee
            const PRIORITY_FEE_IX = ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 5000 // 0.005 lamports per CU priority fee
            });
            const COMPUTE_LIMIT_IX = ComputeBudgetProgram.setComputeUnitLimit({
                units: 200000
            });
            tx.add(PRIORITY_FEE_IX, COMPUTE_LIMIT_IX);

            // 4. Send transaction
            const signature = await sendTransaction(tx, connection);

            // 5. Wait for confirmation
            await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            console.log('[Unlock] On-chain transaction confirmed:', signature);

            // 6. Verify with backend to update database
            const backendResult = await verifyUnlockWithBackend(signature, publicKey.toBase58(), lockId);

            if (!backendResult.success) {
                console.warn('[Unlock] Backend verification failed but on-chain succeeded:', backendResult.error);
                // Still return signature since on-chain succeeded
            } else {
                console.log('[Unlock] Backend verification successful');
            }

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

/**
 * Verify unlock transaction with backend
 */
async function verifyUnlockWithBackend(
    signature: string,
    wallet: string,
    lockId: number
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/unlock/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ signature, wallet, lock_id: lockId })
        });

        const data = await response.json();
        return {
            success: data.success ?? false,
            data: data.data,
            error: data.error
        };
    } catch (err: any) {
        console.error('Backend unlock verification failed:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

export default useLockProgram;

