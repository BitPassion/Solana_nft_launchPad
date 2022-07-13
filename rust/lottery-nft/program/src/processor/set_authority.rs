//! Resets authority on an lottery account.

use crate::{
    errors::LotteryError,
    processor::{LotteryData},
    utils::assert_owned_by,
    PREFIX,
};

use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        pubkey::Pubkey,
    },
};

pub fn set_authority(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    msg!("+ Processing SetAuthority");
    let account_iter = &mut accounts.iter();
    let lottery_act = next_account_info(account_iter)?;
    let current_authority = next_account_info(account_iter)?;
    let new_authority = next_account_info(account_iter)?;

    let mut lottery = LotteryData::from_account_info(lottery_act)?;
    assert_owned_by(lottery_act, program_id)?;

    if lottery.authority != *current_authority.key {
        return Err(LotteryError::InvalidAuthority.into());
    }

    if !current_authority.is_signer {
        return Err(LotteryError::InvalidAuthority.into());
    }

    // Make sure new authority actually exists in some form.
    if new_authority.data_is_empty() || new_authority.lamports() == 0 {
        msg!("Disallowing new authority because it does not exist.");
        return Err(LotteryError::InvalidAuthority.into());
    }

    lottery.authority = *new_authority.key;
    lottery.serialize(&mut *lottery_act.data.borrow_mut())?;
    Ok(())
}
