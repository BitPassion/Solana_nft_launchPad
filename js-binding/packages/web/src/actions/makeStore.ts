import { Connection, Keypair, TransactionInstruction } from '@solana/web3.js';
import {
  utils,
  actions,
  findProgramAddress,
  CreateStoreArgs,
  toPublicKey,
  WalletSigner,
  sendTransactionWithRetry,
} from '@oyster/common';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

const { createStore } = actions;

// This command makes an Lottery
export async function makeStore(
  connection: Connection,
  wallet: WalletSigner,
): Promise<{
  txid: string;
  slot: number;
  store: string;
}> {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  const PROGRAM_IDS = utils.programIds();

  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];
  const storeKey = new Keypair();

  const [authority, nonce] = await findProgramAddress(
    [storeKey.publicKey.toBuffer()],
    toPublicKey(PROGRAM_IDS.store),
  );

  const fullSettings = new CreateStoreArgs({
    bump: nonce,
  });

  await createStore(
    fullSettings,
    wallet.publicKey.toBase58(),
    storeKey.publicKey.toBase58(),
    authority,
    instructions,
  );

  signers.push(storeKey);

  const { txid, slot } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructions,
    signers,
  );

  return { txid, slot, store: storeKey.publicKey.toBase58() };
}
