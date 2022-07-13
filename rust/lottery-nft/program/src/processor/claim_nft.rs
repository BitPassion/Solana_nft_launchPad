//! Claim bid winnings into a target SPL account, only the authorised key can do this, though the
//! target can be any SPL account.

use crate::{
    errors::LotteryError,
    processor::{LotteryData, Ticket, LotteryState, TicketState},
    utils::{
        assert_derivation, assert_initialized, assert_owned_by, assert_signer,
        assert_token_program_matches_package, create_or_allocate_account_raw, spl_token_transfer,
        TokenTransferParams,
    },
    PREFIX,
};
use lottery_store::{
    processor::{StoreData,NFTMeta}
};
use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        program::invoke_signed,
        program_error::ProgramError,
        program_pack::Pack,
        pubkey::Pubkey,
        system_instruction,
        sysvar::{clock::Clock, Sysvar},
    },
    spl_token::state::Account,
};

struct Accounts<'a, 'b: 'a> {
    lottery: &'a AccountInfo<'b>,
    lottery_store_id: &'a AccountInfo<'b>,
    claimer: &'a AccountInfo<'b>,
    ticket: &'a AccountInfo<'b>,
    nft_meta: &'a AccountInfo<'b>,
    nft_mint: &'a AccountInfo<'b>,
    nft_pool_account: &'a AccountInfo<'b>,
    user_nft_account: &'a AccountInfo<'b>,
    token_program: &'a AccountInfo<'b>,
}

fn parse_accounts<'a, 'b: 'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'b>],
) -> Result<Accounts<'a, 'b>, ProgramError> {
    let account_iter = &mut accounts.iter();
    let accounts = Accounts {
        lottery: next_account_info(account_iter)?,
        lottery_store_id: next_account_info(account_iter)?,
        claimer: next_account_info(account_iter)?,
        ticket: next_account_info(account_iter)?,
        nft_meta: next_account_info(account_iter)?,
        nft_mint: next_account_info(account_iter)?,
        nft_pool_account: next_account_info(account_iter)?,
        user_nft_account: next_account_info(account_iter)?,
        token_program: next_account_info(account_iter)?,
    };

    assert_owned_by(accounts.lottery, program_id)?;
    assert_token_program_matches_package(accounts.token_program)?;

    if *accounts.token_program.key != spl_token::id() {
        return Err(LotteryError::InvalidTokenProgram.into());
    }

    Ok(accounts)
}

pub fn claim_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult { 
    msg!("+ Processing Claim");
    let accounts = parse_accounts(program_id, accounts)?;

    let lottery_seeds = [
        PREFIX.as_bytes(),
        program_id.as_ref(),
        &(*accounts.lottery_store_id.key).to_bytes(),
    ];

    // Derive the address we'll store the lottery in, and confirm it matches what we expected the
    // user to provide.
    let (lottery_key, bump) = Pubkey::find_program_address(&lottery_seeds, program_id);
    if lottery_key != *accounts.lottery.key {
        return Err(LotteryError::InvalidLotteryAccount.into());
    }

    let mut lottery = LotteryData::from_account_info(accounts.lottery)?;
    let mut lottery_store = StoreData::from_account_info(accounts.lottery_store_id)?;
    let mut ticket = Ticket::from_account_info(accounts.ticket)?;

    if ticket.state == TicketState::Claimed {
        return Err(LotteryError::AlreadyClaimed.into());
    }
    
    // Transfer amount of SPL token
    spl_token_transfer(TokenTransferParams {
        source: accounts.nft_pool_account.clone(),
        destination: accounts.user_nft_account.clone(),
        authority: accounts.lottery.clone(),
        authority_signer_seeds: &[
            PREFIX.as_bytes(),
            program_id.as_ref(),
            &(*accounts.lottery_store_id.key).to_bytes(),
            &[bump],
        ],
        token_program: accounts.token_program.clone(),
        amount: 1,
    })?;

    Ticket{
        state:ticket.state.claim()?,
        ..ticket
    }
    .serialize(&mut *accounts.ticket.data.borrow_mut())?;

    Ok(())
}
