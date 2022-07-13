import { Connection, Keypair, TransactionInstruction } from '@solana/web3.js';
import {
  StringPublicKey,
  WalletSigner,
  sendTransactionWithRetry,
  createTokenAccountIfNotExist,
  claimNFT,
  LotteryData,
  NFTMeta,
} from '@oyster/common';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { AccountLayout } from '@solana/spl-token';

// This command makes an Lottery
export async function claimGainedNft(
  connection: Connection,
  wallet: WalletSigner,
  lottery: StringPublicKey,
  ticket: StringPublicKey,
  nftTokenAccount: StringPublicKey | undefined | null,
  nftMetaId: StringPublicKey,
  nftMeta: NFTMeta,
  lotteryData: LotteryData,
): Promise<{
  txid: string;
  slot: number;
}> {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  const instructions: TransactionInstruction[] = [];

  const signers: Keypair[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const userNftTokenAccount = await createTokenAccountIfNotExist(
    connection,
    nftTokenAccount,
    wallet.publicKey,
    nftMeta.mint,
    accountRentExempt,
    instructions,
    signers,
  );

  claimNFT(
    lottery,
    lotteryData.lotteryStoreId,
    wallet.publicKey.toBase58(),
    ticket,
    nftMetaId,
    nftMeta.mint,
    nftMeta.tokenPool,
    userNftTokenAccount.toBase58(),
    instructions,
  );

  const { txid, slot } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructions,
    signers,
    'single',
  );

  return { txid, slot };
}
