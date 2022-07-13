use {
    borsh::{BorshDeserialize, BorshSerialize},
};

pub use crate::processor::{
    MintNFTArgs,
    create_store::CreateStoreArgs,
};

/// Instructions supported by the Metadata program.
#[derive(BorshSerialize, BorshDeserialize, Clone)]
pub enum StoreInstruction {
    /// Create a new store account bound to a resource, initially in a pending state.
    ///   0. `[signer]` The account creating the store, which is authorised to make changes.
    ///   1. `[writable]` Uninitialized store account.
    ///   2. `[]` Rent sysvar
    ///   3. `[]` System account
    CreateStore(CreateStoreArgs),
    /// Mint new NFT.
    ///   0. `[signer]` The account creating the store, which is authorised to make changes.
    ///   1. `[writable]` Uninitialized store account.
    ///   2. `[]` Rent sysvar
    ///   3. `[]` System account
    MintNFT(MintNFTArgs),

    UpdateMint(MintNFTArgs),
}

