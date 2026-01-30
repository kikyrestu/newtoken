use anchor_lang::prelude::*;

declare_id!("Aog8ekMpcFNBd68BUyLyhb7qft1ofJRygoDPPvcC3XKv");

#[program]
pub mod mission_lock {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
