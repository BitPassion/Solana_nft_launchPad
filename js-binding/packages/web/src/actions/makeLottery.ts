import { Connection, Keypair, TransactionInstruction } from '@solana/web3.js';
import {
  actions,
  CreateLotteryArgs,
  StringPublicKey,
  WalletSigner,
  sendTransactionWithRetry,
  LOTTERY_PREFIX,
  toPublicKey,
  utils,
  findProgramAddress,
  createSPLTokenKeypair,
} from '@oyster/common';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

const { createLottery } = actions;

// This command makes an Lottery
export async function makeLottery(
  connection: Connection,
  wallet: WalletSigner,
  lotteryStore: StringPublicKey,
  tokenMint: StringPublicKey,
  LotterySettings: CreateLotteryArgs,
): Promise<{
  txid: string;
  slot: number;
  lottery: string;
}> {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  const PROGRAM_IDS = utils.programIds();
  const lotteryKey = (
    await findProgramAddress(
      [
        Buffer.from(LOTTERY_PREFIX),
        toPublicKey(PROGRAM_IDS.lottery).toBuffer(),
        toPublicKey(lotteryStore).toBuffer(),
      ],
      toPublicKey(PROGRAM_IDS.lottery),
    )
  )[0];
  const instructions: TransactionInstruction[] = [];

  const tokenPoolAccount = await createSPLTokenKeypair(
    instructions,
    connection,
    wallet.publicKey,
    toPublicKey(lotteryKey),
    toPublicKey(tokenMint),
  );
  const signers: Keypair[] = [];
  signers.push(tokenPoolAccount);

  const fullSettings = new CreateLotteryArgs({
    ...LotterySettings,
  });

  await createLottery(
    fullSettings,
    wallet.publicKey.toBase58(),
    lotteryStore,
    tokenMint,
    lotteryKey,
    tokenPoolAccount.publicKey.toBase58(),
    instructions,
  );
  const { txid, slot } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructions,
    signers,
    'single',
  );

  return { txid, slot, lottery: lotteryKey };
}
