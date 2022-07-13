use mem::size_of;

use crate::{
    errors::LotteryError,
    processor::{
        LotteryData, LotteryState, Ticket, TicketState
    },
    utils::{assert_derivation, assert_owned_by, create_or_allocate_account_raw, spl_token_create_account,TokenCreateAccount},
    PREFIX,
    
};

use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        clock::UnixTimestamp,
        entrypoint::ProgramResult,
        msg,
        program_error::ProgramError,
        pubkey::Pubkey,
    },
    std::mem,
};

#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq)]
pub struct CreateLotteryArgs {
    /// End time is the cut-off point that the lottery is forced to end by. See LotteryData.
    pub end_lottery_at: u64,
    /// ticket price
    pub ticket_price: u64,
    /// ticket amount for this lottery
    pub ticket_amount: u32,
    /// ticket amount for this lottery
    pub nft_amount: u32,
}

struct Accounts<'a, 'b: 'a> {
    payer: &'a AccountInfo<'b>,
    lottery: &'a AccountInfo<'b>,
    lottery_store: &'a AccountInfo<'b>,
    token_mint: &'a AccountInfo<'b>,
    token_pool: &'a AccountInfo<'b>,
    authority: &'a AccountInfo<'b>,
    token_program: &'a AccountInfo<'b>,
    rent: &'a AccountInfo<'b>,
    system: &'a AccountInfo<'b>,
}

fn parse_accounts<'a, 'b: 'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'b>],
) -> Result<Accounts<'a, 'b>, ProgramError> {
    let account_iter = &mut accounts.iter();
    let accounts = Accounts {
        payer: next_account_info(account_iter)?,
        lottery: next_account_info(account_iter)?,
        lottery_store: next_account_info(account_iter)?,
        token_mint: next_account_info(account_iter)?,
        token_pool: next_account_info(account_iter)?,
        authority: next_account_info(account_iter)?,
        token_program: next_account_info(account_iter)?,
        rent: next_account_info(account_iter)?,
        system: next_account_info(account_iter)?,
    };
    Ok(accounts)
}
pub fn create_lottery(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    args: CreateLotteryArgs,
) -> ProgramResult {
    msg!("+ Processing CreateLottery");
    let accounts = parse_accounts(program_id, accounts)?;

    let lottery_seeds = [
        PREFIX.as_bytes(),
        program_id.as_ref(),
        &(*accounts.lottery_store.key).to_bytes(),
    ];

    // Derive the address we'll store the lottery in, and confirm it matches what we expected the
    // user to provide.
    let (lottery_key, bump) = Pubkey::find_program_address(&lottery_seeds, program_id);
    if lottery_key != *accounts.lottery.key {
        return Err(LotteryError::InvalidLotteryAccount.into());
    }
    
    // The data must be large enough to hold at least the number of winners.
    let lottery_size = mem::size_of::<LotteryData>();

    if accounts.lottery.data_is_empty() {
        // Create lottery account with enough space for a tickets tracking.
        create_or_allocate_account_raw(
            *program_id,
            accounts.lottery,
            accounts.rent,
            accounts.system,
            accounts.payer,
            lottery_size,
            &[
                PREFIX.as_bytes(),
                program_id.as_ref(),
                &(*accounts.lottery_store.key).to_bytes(),
                &[bump],
            ],
        )?;
    }
    
    // Configure Lottery.
    LotteryData {
        authority: *accounts.authority.key,
        token_mint: *accounts.token_mint.key,
        token_pool: *accounts.token_pool.key,
        lottery_store_id: *accounts.lottery_store.key,
        ended_at: 0,
        end_lottery_at: args.end_lottery_at,
        state: LotteryState::create(),
        nft_amount: args.nft_amount as u64,
        ticket_price: args.ticket_price,
        ticket_amount: args.ticket_amount as u64,
        sold_amount: 0
    }
    .serialize(&mut *accounts.lottery.data.borrow_mut())?;
    
    Ok(())
}
