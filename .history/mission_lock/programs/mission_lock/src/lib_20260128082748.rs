use anchor_lang::prelude::*;

declare_id!("CCWcSMHxXzuEKzpX6KHDrwST28pPqvxwkvZmM1b1Pt8Q");

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
