use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::AccountInfo, borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult, program_error::ProgramError, pubkey::Pubkey,
};

// Declare submodules, each contains a single handler for each instruction variant in the program.
pub mod create_store;
pub mod mint_nft;
pub mod update_mint;

// Re-export submodules handlers + associated types for other programs to consume.
pub use create_store::*;
pub use mint_nft::*;
pub use update_mint::*;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    use crate::instruction::StoreInstruction;
    match StoreInstruction::try_from_slice(input)? {
        StoreInstruction::CreateStore(args) => create_store(program_id, accounts, args),
        StoreInstruction::MintNFT(args) => mint_nft(program_id, accounts, args),
        StoreInstruction::UpdateMint(args) => update_mint(program_id, accounts, args)
    }
}


#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq, Debug)]
pub struct StoreData {
    pub owner: Pubkey,
    /// Pubkey of the authority with permission to modify this store.
    pub authority: Pubkey,
    /// current nft amount
    pub nft_amount: u64,
    pub bump: u8,
}

#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq, Debug)]
pub struct NFTMeta {
    /// Pubkey of the authority with permission to modify this store.
    pub store_id: Pubkey,
    pub nft_number: u64,
    /// The name of the asset
    pub name: String,
    /// The symbol for the asset
    pub symbol: String,
    /// URI pointing to JSON representing the asset
    pub uri: String,
    /// Pubkey for mint address
    pub mint: Pubkey,
    /// token pool to store current nft
    pub token_pool: Pubkey,
    /// Pubkey of the authority with permission to modify this store.
    pub authority: Pubkey,
    /// flag of current nft is sold or not
    pub exist_nft: u8,
    pub bump: u8,
}
pub const MAX_NAME_LENGTH: usize = 32;
pub const MAX_SYMBOL_LENGTH: usize = 10;
pub const MAX_URI_LENGTH: usize = 200;
pub const MAX_NFTMETA_LEN: usize = 32 + 8 + 4 + MAX_NAME_LENGTH + 4 + MAX_SYMBOL_LENGTH + 4 + MAX_URI_LENGTH + 32 + 32 + 32 + 1 + 1;


#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq)]
pub struct MintNFTArgs {
  /// The name of the asset
  pub name: String,
  /// The symbol for the asset
  pub symbol: String,
  /// URI pointing to JSON representing the asset
  pub uri: String,
  /// Pubkey for mint address
  pub bump: u8,
}

impl StoreData {
    pub fn from_account_info(a: &AccountInfo) -> Result<StoreData, ProgramError> {
        let store: StoreData = try_from_slice_unchecked(&a.data.borrow_mut())?;
        Ok(store)
    }
}


impl NFTMeta {
    pub fn from_account_info(a: &AccountInfo) -> Result<NFTMeta, ProgramError> {
        let nftmeta: NFTMeta = try_from_slice_unchecked(&a.data.borrow_mut())?;
        Ok(nftmeta)
    }
}
