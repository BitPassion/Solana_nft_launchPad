use crate::errors::LotteryError;
use arrayref::array_ref;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::AccountInfo, borsh::try_from_slice_unchecked, clock::UnixTimestamp,
    entrypoint::ProgramResult, hash::Hash, msg, program_error::ProgramError, pubkey::Pubkey,
};
use std::{cell::Ref, cmp, mem};

// Declare submodules, each contains a single handler for each instruction variant in the program.
pub mod claim_nft;
pub mod claim_token;
pub mod create_lottery;
pub mod end_lottery;
pub mod get_ticket;
pub mod set_authority;
pub mod start_lottery;

// Re-export submodules handlers + associated types for other programs to consume.
pub use claim_nft::*;
pub use claim_token::*;
pub use create_lottery::*;
pub use end_lottery::*;
pub use get_ticket::*;
pub use set_authority::*;
pub use start_lottery::*;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    use crate::instruction::LotteryInstruction;
    match LotteryInstruction::try_from_slice(input)? {
        LotteryInstruction::ClaimNFT => claim_nft(program_id, accounts),
        LotteryInstruction::ClaimToken => claim_token(program_id, accounts),
        LotteryInstruction::CreateLottery(args) => create_lottery(program_id, accounts, args),
        LotteryInstruction::EndLottery => end_lottery(program_id, accounts),
        LotteryInstruction::GetTicket => get_ticket(program_id, accounts),
        LotteryInstruction::SetAuthority => set_authority(program_id, accounts),
        LotteryInstruction::StartLottery => start_lottery(program_id, accounts),
    }
}

/// Ticket
#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq, Debug)]
pub struct Ticket {
    pub owner: Pubkey,
    pub lottery_id: Pubkey,
    pub state: TicketState, 
    pub winned_nft_number: u64
}

impl Ticket {
    pub fn from_account_info(a: &AccountInfo) -> Result<Ticket, ProgramError> {
        let ticket: Ticket = try_from_slice_unchecked(&a.data.borrow_mut())?;

        Ok(ticket)
    }
}

#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq, Debug)]
pub struct LotteryData {
    /// Pubkey of the authority with permission to modify this lottery.
    pub authority: Pubkey,
    /// Token mint for the SPL token being used to bid
    pub token_mint: Pubkey,
    /// Token account to store all bids
    pub token_pool: Pubkey,
    /// lottery store id
    pub lottery_store_id: Pubkey,
    /// Slot time the lottery was officially ended by.
    pub ended_at: u64,
    /// End time is the cut-off point that the lottery is forced to end by.
    pub end_lottery_at: u64,
    /// The state the lottery is in, whether it has started or ended.
    pub state: LotteryState,
    /// total NFT amount for this lottery
    pub nft_amount: u64,
    /// ticket price
    pub ticket_price: u64,
    /// ticket amount for this lottery
    pub ticket_amount: u64,
    /// current sold ticket count
    pub sold_amount: u64,
}

impl LotteryData {
    pub fn from_account_info(a: &AccountInfo) -> Result<LotteryData, ProgramError> {
        let lottery: LotteryData = try_from_slice_unchecked(&a.data.borrow_mut())?;

        Ok(lottery)
    }
}

/// Define valid ticket state transitions.
#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq, Debug)]
pub enum TicketState {
    Bought,
    Winned,
    NotWinned,
    Claimed,
}

impl TicketState {
    pub fn buy() -> Self {
        TicketState::Bought
    }
    #[inline(always)]
    pub fn win(self) -> Result<Self, ProgramError> {
        match self {
            TicketState::Bought => Ok(TicketState::Winned),
            _ => Err(LotteryError::TicketTransitionInvalid.into()),
        }
    }
    #[inline(always)]
    pub fn fail(self) -> Result<Self, ProgramError> {
        match self {
            TicketState::Bought => Ok(TicketState::NotWinned),
            _ => Err(LotteryError::TicketTransitionInvalid.into()),
        }
    }
    #[inline(always)]
    pub fn claim(self) -> Result<Self, ProgramError> {
        match self {
            TicketState::Winned => Ok(TicketState::Claimed),
            TicketState::NotWinned => Ok(TicketState::Claimed),
            _ => Err(LotteryError::TicketTransitionInvalid.into()),
        }
    }
}

/// Define valid lottery state transitions.
#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq, Debug)]
pub enum LotteryState {
    Created,
    Started,
    Ended,
}

impl LotteryState {
    pub fn create() -> Self {
        LotteryState::Created
    }

    #[inline(always)]
    pub fn start(self) -> Result<Self, ProgramError> {
        match self {
            LotteryState::Created => Ok(LotteryState::Started),
            _ => Err(LotteryError::LotteryTransitionInvalid.into()),
        }
    }

    #[inline(always)]
    pub fn end(self) -> Result<Self, ProgramError> {
        match self {
            LotteryState::Started => Ok(LotteryState::Ended),
            LotteryState::Created => Ok(LotteryState::Ended),
            _ => Err(LotteryError::LotteryTransitionInvalid.into()),
        }
    }
}
