//! A Token Metadata program for the Solana blockchain.

pub mod entrypoint;
pub mod errors;
pub mod instruction;
pub mod processor;
pub mod utils;
// Export current sdk types for downstream users building with a different sdk version
pub use solana_program;

pub const PREFIX: &str = "store";

solana_program::declare_id!("C5qPBBJfLWRgwc1TfagihB6kuMnQDZt6S7mTDXHj2umR");
