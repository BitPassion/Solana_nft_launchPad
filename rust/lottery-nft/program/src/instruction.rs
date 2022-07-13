use crate::{PREFIX};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    sysvar,
};

pub use crate::processor::{
    create_lottery::CreateLotteryArgs,
};

#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq)]
pub enum LotteryInstruction {
    /// Create a new lottery account bound to a resource, initially in a pending state.
    ///   0. `[signer]` The account creating the lottery, which is authorised to make changes.
    ///   1. `[writable]` Uninitialized lottery account.
    ///   2. `[]` Rent sysvar
    ///   3. `[]` System account
    CreateLottery(CreateLotteryArgs),

    /// Update the authority for an lottery account.
    SetAuthority,

    /// Start an inactive lottery.
    /// Start an lottery, regardless of start timing conditions
    ///   0. `[signer]` The creator/authorised account.
    ///   1. `[writable]` Initialized lottery account.
    ///   2. `[]` Clock sysvar
    StartLottery,

    /// Place a bid on a running lottery.
    ///   0. `[signer]` The bidders primary account, for PDA calculation/transit auth.
    ///   1. `[writable]` The bidders token account they'll pay with
    ///   2. `[writable]` The pot, containing a reference to the stored SPL token account.
    ///   3. `[writable]` The pot SPL account, where the tokens will be deposited.
    ///   4. `[writable]` The metadata account, storing information about the bidders actions.
    ///   5. `[writable]` Lottery account, containing data about the lottery and item being bid on.
    ///   6. `[writable]` Token mint, for transfer instructions and verification.
    ///   7. `[signer]` Transfer authority, for moving tokens into the bid pot.
    ///   8. `[signer]` Payer
    ///   9. `[]` Clock sysvar
    ///   10. `[]` Rent sysvar
    ///   11. `[]` System program
    ///   12. `[]` SPL Token Program
    GetTicket,

    /// Ends an lottery, regardless of end timing conditions
    EndLottery,

    /// Move NFT from winning bid to the destination account.
    ///   0. `[writable]` The destination account
    ///   1. `[writable]` The bidder pot token account
    ///   2. `[]` The bidder pot pda account [seed of ['lottery', program_id, lottery key, bidder key]]
    ///   3. `[signer]` The authority on the lottery
    ///   4. `[]` The lottery
    ///   5. `[]` The bidder wallet
    ///   6. `[]` Token mint of the lottery
    ///   7. `[]` Clock sysvar
    ///   8. `[]` Token program
    ClaimNFT,

    /// Move SOL from not winning bid to the destination account.
    ///   0. `[writable]` The destination account
    ///   1. `[writable]` The bidder pot token account
    ///   2. `[]` The bidder pot pda account [seed of ['lottery', program_id, lottery key, bidder key]]
    ///   3. `[signer]` The authority on the lottery
    ///   4. `[]` The lottery
    ///   5. `[]` The bidder wallet
    ///   6. `[]` Token mint of the lottery
    ///   7. `[]` Clock sysvar
    ///   8. `[]` Token program
    ClaimToken,
}
