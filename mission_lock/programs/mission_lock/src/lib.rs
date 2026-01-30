use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("CCWcSMHxXzuEKzpX6KHDrwST28pPqvxwkvZmM1b1Pt8Q");

#[program]
pub mod mission_lock {
    use super::*;

    /// Lock tokens into escrow for a specified duration
    pub fn lock_tokens(
        ctx: Context<LockTokens>,
        amount: u64,
        lock_duration_seconds: i64,
        tier: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Validate
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(lock_duration_seconds > 0, ErrorCode::InvalidDuration);
        require!(tier.len() <= 32, ErrorCode::TierTooLong);

        // Initialize escrow
        escrow.owner = ctx.accounts.user.key();
        escrow.amount = amount;
        escrow.tier = tier;
        escrow.lock_timestamp = clock.unix_timestamp;
        escrow.unlock_timestamp = clock.unix_timestamp + lock_duration_seconds;
        escrow.is_locked = true;
        escrow.bump = ctx.bumps.escrow_account;

        // Transfer tokens from user to escrow token account
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        msg!("Locked {} tokens for {} until {}", amount, escrow.tier, escrow.unlock_timestamp);
        Ok(())
    }

    /// Unlock tokens after lock period expires
    pub fn unlock_tokens(ctx: Context<UnlockTokens>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Validate
        require!(escrow.is_locked, ErrorCode::NotLocked);
        require!(clock.unix_timestamp >= escrow.unlock_timestamp, ErrorCode::LockPeriodNotExpired);

        let amount = escrow.amount;
        let bump = escrow.bump;
        let user_key = ctx.accounts.user.key();

        // Transfer tokens back to user using PDA signature
        let seeds = &[
            b"escrow".as_ref(),
            user_key.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.escrow_account.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, amount)?;

        // Mark as unlocked
        escrow.is_locked = false;
        escrow.amount = 0;

        msg!("Unlocked {} tokens for user", amount);
        Ok(())
    }

    /// Get escrow info (for testing)
    pub fn get_escrow_info(ctx: Context<GetEscrowInfo>) -> Result<()> {
        let escrow = &ctx.accounts.escrow_account;
        msg!("Owner: {}", escrow.owner);
        msg!("Amount: {}", escrow.amount);
        msg!("Tier: {}", escrow.tier);
        msg!("Lock timestamp: {}", escrow.lock_timestamp);
        msg!("Unlock timestamp: {}", escrow.unlock_timestamp);
        msg!("Is locked: {}", escrow.is_locked);
        Ok(())
    }
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
pub struct LockTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [b"escrow", user.key().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnlockTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", user.key().as_ref()],
        bump = escrow_account.bump,
        constraint = escrow_account.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetEscrowInfo<'info> {
    pub escrow_account: Account<'info, EscrowAccount>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    pub owner: Pubkey,          // 32 bytes
    pub amount: u64,            // 8 bytes
    #[max_len(32)]
    pub tier: String,           // 4 + 32 bytes
    pub lock_timestamp: i64,    // 8 bytes
    pub unlock_timestamp: i64,  // 8 bytes
    pub is_locked: bool,        // 1 byte
    pub bump: u8,               // 1 byte
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount - must be greater than 0")]
    InvalidAmount,
    #[msg("Invalid duration - must be greater than 0")]
    InvalidDuration,
    #[msg("Tier name too long - max 32 characters")]
    TierTooLong,
    #[msg("Tokens are not locked")]
    NotLocked,
    #[msg("Lock period has not expired yet")]
    LockPeriodNotExpired,
    #[msg("Unauthorized - not the owner")]
    Unauthorized,
}
