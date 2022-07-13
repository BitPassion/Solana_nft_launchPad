//! Buy a ticket on a running lottery

use borsh::try_to_vec_with_schema;

use crate::{
    errors::LotteryError,
    processor::{
        LotteryData, LotteryState, Ticket,TicketState
    },
    utils::{
        assert_derivation, assert_initialized, assert_owned_by, assert_signer,
        assert_token_program_matches_package, create_or_allocate_account_raw, spl_token_transfer,
        carryout_lotter,
        TokenTransferParams,
    },
    PREFIX,
};

use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        program::{invoke, invoke_signed},
        program_error::ProgramError,
        program_option::COption,
        program_pack::Pack,
        pubkey::Pubkey,
        rent::Rent,
        system_instruction,
        system_instruction::create_account,
        sysvar::{clock::Clock, Sysvar},
    },
    spl_token::state::Account,
    std::mem,
};

struct Accounts<'a, 'b: 'a> {
    lottery: &'a AccountInfo<'b>,
    ticket: &'a AccountInfo<'b>,
    bidder: &'a AccountInfo<'b>,
    bidder_token: &'a AccountInfo<'b>,
    pool_token: &'a AccountInfo<'b>,
    mint: &'a AccountInfo<'b>,
    transfer_authority: &'a AccountInfo<'b>,
    token_program: &'a AccountInfo<'b>,
    rent: &'a AccountInfo<'b>,
    system: &'a AccountInfo<'b>,
    clock_sysvar: &'a AccountInfo<'b>,
}

fn parse_accounts<'a, 'b: 'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'b>],
) -> Result<Accounts<'a, 'b>, ProgramError> {
    let account_iter = &mut accounts.iter();
    let accounts = Accounts {
        lottery: next_account_info(account_iter)?,
        ticket: next_account_info(account_iter)?,
        bidder: next_account_info(account_iter)?,
        bidder_token: next_account_info(account_iter)?,
        pool_token: next_account_info(account_iter)?,
        mint: next_account_info(account_iter)?,
        transfer_authority: next_account_info(account_iter)?,
        token_program: next_account_info(account_iter)?,
        rent: next_account_info(account_iter)?,
        system: next_account_info(account_iter)?,
        clock_sysvar: next_account_info(account_iter)?,
    };

    assert_owned_by(accounts.lottery, program_id)?;
    assert_owned_by(accounts.bidder_token, &spl_token::id())?;

    assert_owned_by(accounts.mint, &spl_token::id())?;
    assert_signer(accounts.bidder)?;
    assert_signer(accounts.transfer_authority)?;
    assert_token_program_matches_package(accounts.token_program)?;

    if *accounts.token_program.key != spl_token::id() {
        return Err(LotteryError::InvalidTokenProgram.into());
    }

    Ok(accounts)
}

#[allow(clippy::absurd_extreme_comparisons)]
pub fn get_ticket<'r, 'b: 'r>(
    program_id: &Pubkey,
    accounts: &'r [AccountInfo<'b>],
) -> ProgramResult {
    msg!("+ Processing GetTicket");
    let accounts = parse_accounts(program_id, accounts)?;

    // Load the clock, used for various lottery timing.
    let clock = Clock::from_account_info(accounts.clock_sysvar)?;

    // Load the lottery and verify this bid is valid.
    let mut lottery = LotteryData::from_account_info(accounts.lottery)?;

    if lottery.sold_amount >= lottery.ticket_amount {
        return Err(LotteryError::ExceedTiketAmount.into());
    }
    
    // Can't buy a ticket on an lottery that isn't running.
    if lottery.state != LotteryState::Started {
        return Err(LotteryError::InvalidState.into());
    }
    let token_authority_seeds = &[
        PREFIX.as_bytes(),
        program_id.as_ref(),
        accounts.lottery.key.as_ref(),
        accounts.bidder.key.as_ref(),
    ];

    let (token_authority, token_bump) = Pubkey::find_program_address(token_authority_seeds, program_id);

    // Transfer amount of SPL token
    spl_token_transfer(TokenTransferParams {
        source: accounts.bidder_token.clone(),
        destination: accounts.pool_token.clone(),
        authority: accounts.transfer_authority.clone(),
        authority_signer_seeds: &[
            PREFIX.as_bytes(),
            program_id.as_ref(),
            accounts.lottery.key.as_ref(),
            accounts.bidder.key.as_ref(),
            &[token_bump],
        ],
        token_program: accounts.token_program.clone(),
        amount: lottery.ticket_price,
    })?;

    let winned_nft_num = carryout_lotter(&mut lottery, clock.unix_timestamp as u64, *accounts.ticket.key);
    let mut ticket_state = TicketState::buy();

    if winned_nft_num == 0 {
        ticket_state = ticket_state.fail()?;
    }
    else {
        ticket_state = ticket_state.win()?;
    }
    
    let ticket_seeds = [
        PREFIX.as_bytes(),
        program_id.as_ref(),
        &(*accounts.ticket.key).to_bytes(),
    ];

    // Derive the address we'll store the lottery in, and confirm it matches what we expected the
    // user to provide.
    let (ticket_authority, ticket_bump) = Pubkey::find_program_address(&ticket_seeds, program_id);
    
    if accounts.ticket.data_is_empty() {
        // Create lottery account with enough space for a tickets tracking.
        create_or_allocate_account_raw(
            *program_id,
            accounts.ticket,
            accounts.rent,
            accounts.system,
            accounts.bidder,
            mem::size_of::<Ticket>(),
            &[
                PREFIX.as_bytes(),
                program_id.as_ref(),
                &(*accounts.ticket.key).to_bytes(),
                &[ticket_bump],
            ],
        )?;
        Ticket{
            owner:*accounts.bidder.key,
            lottery_id:*accounts.lottery.key,
            state:ticket_state,
            winned_nft_number:winned_nft_num
        }
        .serialize(&mut *accounts.ticket.data.borrow_mut())?;
    }
    lottery.sold_amount += 1;
    lottery.serialize(&mut *accounts.lottery.data.borrow_mut())?;

    Ok(())
}
