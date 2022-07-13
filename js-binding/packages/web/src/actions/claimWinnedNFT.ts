import { Connection, Keypair, TransactionInstruction } from '@solana/web3.js';
import {
  StringPublicKey,
  WalletSigner,
  sendTransactionWithRetry,
  NFTMeta,
  claimNFT,
  createTokenAccountIfNotExist2,
} from '@oyster/common';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { AccountLayout } from '@solana/spl-token';

// This command makes an Lottery
export async function claimWinnedNFT(
  connection: Connection,
  wallet: WalletSigner,
  lottery: StringPublicKey,
  lotteryStore: StringPublicKey,
  ticket: StringPublicKey,
  nftMetaAccount: StringPublicKey,
  nftMetaData: NFTMeta,
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

  const nftTokenKeypair = new Keypair();
  await createTokenAccountIfNotExist2(
    connection,
    nftTokenKeypair,
    wallet.publicKey,
    nftMetaData.mint,
    accountRentExempt,
    instructions,
  );
  signers.push(nftTokenKeypair);

  claimNFT(
    lottery,
    lotteryStore,
    wallet.publicKey.toBase58(),
    ticket,
    nftMetaAccount,
    nftMetaData.mint,
    nftMetaData.tokenPool,
    nftTokenKeypair.publicKey.toBase58(),
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
