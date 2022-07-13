use {
    num_derive::FromPrimitive,
    solana_program::{
        decode_error::DecodeError,
        msg,
        program_error::{PrintProgramError, ProgramError},
    },
    thiserror::Error,
};

/// Errors that may be returned by the Lottery program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum LotteryError {
    /// Account does not have correct owner
    #[error("Account does not have correct owner")]
    IncorrectOwner,

    /// Lamport balance below rent-exempt threshold.
    #[error("Lamport balance below rent-exempt threshold")]
    NotRentExempt,

    /// Bid account provided does not match the derived address.
    #[error("Bid account provided does not match the derived address.")]
    InvalidBidAccount,

    /// Lottery account specified is invalid.
    #[error("Lottery account specified is invalid.")]
    InvalidLotteryAccount,

    /// Balance too low to make bid.
    #[error("Balance too low to make bid.")]
    BalanceTooLow,

    /// Lottery is not currently running.
    #[error("Lottery is not currently running.")]
    InvalidState,

    /// Bid is too small.
    #[error("Bid is too small.")]
    BidTooSmall,

    /// Invalid transition, lottery state may only transition: Created -> Started -> Stopped
    #[error("Invalid lottery state transition.")]
    LotteryTransitionInvalid,

    /// Invalid transition, ticket state may only transition: Bought -> Winned/NotWinned ->Claimed
    #[error("Invalid ticket state transition.")]
    TicketTransitionInvalid,

    /// Failed to derive an account from seeds.
    #[error("Failed to derive an account from seeds.")]
    DerivedKeyInvalid,

    /// Token transfer failed
    #[error("Token transfer failed")]
    TokenTransferFailed,

    /// Token mint to failed
    #[error("Token mint to failed")]
    TokenMintToFailed,

    /// Token burn failed
    #[error("Token burn failed")]
    TokenBurnFailed,

    /// Invalid authority
    #[error("Invalid authority")]
    InvalidAuthority,

    /// Authority not signer
    #[error("Authority not signer")]
    AuthorityNotSigner,

    /// Numerical overflow
    #[error("Numerical overflow")]
    NumericalOverflowError,

    /// Bidder pot token account does not match
    #[error("Bidder pot token account does not match")]
    BidderPotTokenAccountOwnerMismatch,

    /// Uninitialized
    #[error("Uninitialized")]
    Uninitialized,

    /// Metadata account is missing or invalid.
    #[error("Metadata account is missing or invalid.")]
    MetadataInvalid,

    /// Bidder pot is missing, and required for SPL trades.
    #[error("Bidder pot is missing, and required for SPL trades.")]
    BidderPotDoesNotExist,

    /// Existing Bid is already active.
    #[error("Existing Bid is already active.")]
    BidAlreadyActive,

    /// Incorrect mint specified, must match lottery.
    #[error("Incorrect mint specified, must match lottery.")]
    IncorrectMint,

    /// Must reveal price when ending a blinded lottery.
    #[error("Must reveal price when ending a blinded lottery.")]
    MustReveal,

    /// The revealing hash is invalid.
    #[error("The revealing hash is invalid.")]
    InvalidReveal,

    /// The pot for this bid is already empty.
    #[error("The pot for this bid is already empty.")]
    BidderPotEmpty,

    /// This is not a valid token program
    #[error(" This is not a valid token program")]
    InvalidTokenProgram,

    /// Accept payment delegate should be none
    #[error("Accept payment delegate should be none")]
    DelegateShouldBeNone,

    /// Accept payment close authority should be none
    #[error("Accept payment close authority should be none")]
    CloseAuthorityShouldBeNone,

    /// Data type mismatch
    #[error("Data type mismatch")]
    DataTypeMismatch,

    /// Bid must be multiple of tick size
    #[error("Bid must be multiple of tick size")]
    BidMustBeMultipleOfTickSize,

    /// During the gap window, gap between next lowest bid must be of a certain percentage
    #[error("During the gap window, gap between next lowest bid must be of a certain percentage")]
    GapBetweenBidsTooSmall,

    /// Gap tick size percentage must be between 0 and 100
    #[error("Gap tick size percentage must be between 0 and 100")]
    InvalidGapTickSizePercentage,

    /// Already ended
    #[error("Already over end time")]
    AlreadyOverEndDate,

    /// Exceed available ticket amount
    #[error("Exceed available ticket amount")]
    ExceedTiketAmount,

    /// Invalid token pool address
    #[error("Invalid token pool address")]
    InvalidTokenPool,

    /// This lottery already ended
    #[error("This lottery already ended")]
    AlreadyEnded,

    /// already claimed
    #[error("Already Claimed")]
    AlreadyClaimed,
}

impl PrintProgramError for LotteryError {
    fn print<E>(&self) {
        msg!(&self.to_string());
    }
}

impl From<LotteryError> for ProgramError {
    fn from(e: LotteryError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for LotteryError {
    fn type_of() -> &'static str {
        "Vault Error"
    }
}
