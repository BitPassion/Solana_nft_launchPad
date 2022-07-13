import { Connection, Keypair, TransactionInstruction } from '@solana/web3.js';
import {
  StringPublicKey,
  WalletSigner,
  sendTransactionWithRetry,
  createTokenAccountIfNotExist,
  claimToken,
  LotteryData,
  WRAPPED_SOL_MINT,
  programIds,
} from '@oyster/common';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { AccountLayout, Token } from '@solana/spl-token';

// This command makes an Lottery
export async function claimDepositedToken(
  connection: Connection,
  wallet: WalletSigner,
  lottery: StringPublicKey,
  ticket: StringPublicKey,
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

  const userWsolAccount = await createTokenAccountIfNotExist(
    connection,
    null,
    wallet.publicKey,
    WRAPPED_SOL_MINT.toBase58(),
    lotteryData.ticketPrice.toNumber() + accountRentExempt,
    instructions,
    signers,
  );

  claimToken(
    lottery,
    wallet.publicKey.toBase58(),
    ticket,
    lotteryData.tokenPool,
    userWsolAccount.toBase58(),
    instructions,
  );
  instructions.push(
    Token.createCloseAccountInstruction(
      programIds().token,
      userWsolAccount,
      wallet.publicKey,
      wallet.publicKey,
      signers,
    ),
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
