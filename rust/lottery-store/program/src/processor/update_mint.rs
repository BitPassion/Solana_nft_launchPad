use crate::{
  processor::{
      NFTMeta, MintNFTArgs, MAX_URI_LENGTH
  },
};

use {
  borsh::{BorshDeserialize, BorshSerialize},
  solana_program::{
      account_info::{next_account_info, AccountInfo},
      entrypoint::ProgramResult,
      program_error::ProgramError,
      pubkey::Pubkey,msg,
  },
};

struct Accounts<'a, 'b: 'a> {
payer: &'a AccountInfo<'b>,
nftmeta: &'a AccountInfo<'b>,
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
    nftmeta: next_account_info(account_iter)?,
    rent: next_account_info(account_iter)?,
    system: next_account_info(account_iter)?,
};
Ok(accounts)
}

pub fn update_mint(
program_id: &Pubkey,
accounts: &[AccountInfo],
args: MintNFTArgs,
) -> ProgramResult {
let accounts = parse_accounts(program_id, accounts)?;

// Load the store and verify this bid is valid.
let mut nft = NFTMeta::from_account_info(accounts.nftmeta)?;
let mut array_of_zeroes = vec![];
while array_of_zeroes.len() < MAX_URI_LENGTH - args.uri.len() {
    array_of_zeroes.push(0u8);
}
nft.uri = args.uri.clone() + std::str::from_utf8(&array_of_zeroes).unwrap();

nft.serialize(&mut *accounts.nftmeta.data.borrow_mut())?;

Ok(())
}