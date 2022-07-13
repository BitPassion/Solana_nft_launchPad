import {
  Connection,
  Keypair,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { AccountLayout, MintLayout, Token } from '@solana/spl-token';

import {
  actions,
  StringPublicKey,
  WalletSigner,
  sendTransactionWithRetry,
  toPublicKey,
  MintNFTArgs,
  programIds,
  ENV,
} from '@oyster/common';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { AR_SOL_HOLDER_ID } from '../utils/ids';
import { getAssetCostToStore } from '../utils/assets';
import crypto from 'crypto';

const { mintNFT, updateMint } = actions;

interface IArweaveResult {
  error?: string;
  messages?: Array<{
    filename: string;
    status: 'success' | 'fail';
    transactionId?: string;
    error?: string;
  }>;
}
const RESERVED_TXN_MANIFEST = 'manifest.json';

// This command makes an Lottery
export async function mintNFTStore(
  connection: Connection,
  wallet: WalletSigner,
  storeid: StringPublicKey,
  lotteryId: StringPublicKey,
  mintNFTSetting: MintNFTArgs,
  files: File[],
  env: ENV,
): Promise<{
  txid: string;
  slot: number;
  mint: string;
}> {
  if (!wallet.publicKey) throw new WalletNotConnectedError();
  // const storeKey = (
  //   await findProgramAddress(
  //     [
  //       Buffer.from(STORE_PREFIX),
  //       toPublicKey(PROGRAM_IDS.store).toBuffer(),
  //       toPublicKey(storeid).toBuffer(),
  //     ],
  //     toPublicKey(PROGRAM_IDS.store),
  //   )
  // )[0];

  const metadataContent = {
    name: mintNFTSetting.name,
    symbol: mintNFTSetting.symbol,
    image: files[0].name,
  };

  const realFiles: File[] = [
    ...files,
    new File([JSON.stringify(metadataContent)], 'metadata.json'),
  ];

  const { instructions: pushInstructions, signers: pushSigners } =
    await prepPayForFileTxnMint(wallet, realFiles, metadataContent);

  const instructions: TransactionInstruction[] = [...pushInstructions];
  const signers: Keypair[] = [...pushSigners];

  // Allocate memory for the account
  const mintRent = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );
  const accountRent = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );
  const mintAccount = new Keypair();
  const tokenAccount = new Keypair();

  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintAccount.publicKey,
      lamports: mintRent,
      space: MintLayout.span,
      programId: programIds().token,
    }),
  );

  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: tokenAccount.publicKey,
      lamports: accountRent,
      space: AccountLayout.span,
      programId: programIds().token,
    }),
  );

  instructions.push(
    Token.createInitMintInstruction(
      programIds().token,
      mintAccount.publicKey,
      0,
      wallet.publicKey,
      wallet.publicKey,
    ),
  );
  instructions.push(
    Token.createInitAccountInstruction(
      programIds().token,
      mintAccount.publicKey,
      tokenAccount.publicKey,
      toPublicKey(lotteryId),
    ),
  );
  instructions.push(
    Token.createMintToInstruction(
      programIds().token,
      mintAccount.publicKey,
      tokenAccount.publicKey,
      wallet.publicKey,
      [],
      1,
    ),
  );
  instructions.push(
    Token.createSetAuthorityInstruction(
      programIds().token,
      mintAccount.publicKey,
      null,
      'MintTokens',
      wallet.publicKey,
      [],
    ),
  );

  const nftMetaKeypair = new Keypair();

  signers.push(mintAccount);
  signers.push(tokenAccount);
  signers.push(nftMetaKeypair);

  const fullSettings = new MintNFTArgs({
    ...mintNFTSetting,
  });

  await mintNFT(
    fullSettings,
    wallet.publicKey.toBase58(),
    nftMetaKeypair.publicKey.toBase58(),
    storeid,
    storeid,
    mintAccount.publicKey.toBase58(),
    tokenAccount.publicKey.toBase58(),
    instructions,
  );

  const { txid, slot } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructions,
    signers,
    'single',
  );

  const data = new FormData();

  const tags = realFiles.reduce(
    (acc: Record<string, Array<{ name: string; value: string }>>, f) => {
      acc[f.name] = [
        { name: 'mint', value: nftMetaKeypair.publicKey.toBase58() },
      ];
      return acc;
    },
    {},
  );
  data.append('tags', JSON.stringify(tags));
  data.append('transaction', txid);
  realFiles.map(f => data.append('file[]', f));

  // TODO: convert to absolute file name for image

  const result: IArweaveResult = await (
    await fetch(
      // TODO: add CNAME
      env.startsWith('mainnet-beta')
        ? 'https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFileProd2'
        : 'https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile2',
      {
        method: 'POST',
        body: data,
      },
    )
  ).json();

  const metadataFile = result.messages?.find(
    m => m.filename === RESERVED_TXN_MANIFEST,
  );
  if (metadataFile?.transactionId && wallet.publicKey) {
    const updateInstructions: TransactionInstruction[] = [];
    const updateSigners: Keypair[] = [];

    // TODO: connect to testnet arweave
    const arweaveLink = `https://arweave.net/${metadataFile.transactionId}`;

    await updateMint(
      new MintNFTArgs({
        instruction: 2,
        name: mintNFTSetting.name,
        symbol: mintNFTSetting.symbol,
        uri: arweaveLink,
        bump: mintNFTSetting.bump,
      }),
      wallet.publicKey.toBase58(),
      nftMetaKeypair.publicKey.toBase58(),
      updateInstructions,
    );

    // signers.push(nftMetaKeypair);

    await sendTransactionWithRetry(
      connection,
      wallet,
      updateInstructions,
      updateSigners,
    );
  }
  return { txid, slot, mint: nftMetaKeypair.publicKey.toBase58() };
}

export const prepPayForFileTxnMint = async (
  wallet: WalletSigner,
  files: File[],
  metadata: any,
): Promise<{
  instructions: TransactionInstruction[];
  signers: Keypair[];
}> => {
  console.log(metadata);
  const memo = programIds().memo;

  const instructions: TransactionInstruction[] = [];
  const signers: Keypair[] = [];

  if (wallet.publicKey)
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: AR_SOL_HOLDER_ID,
        lamports: await getAssetCostToStore(files),
      }),
    );

  for (let i = 0; i < files.length; i++) {
    const hashSum = crypto.createHash('sha256');
    hashSum.update(await files[i].text());
    const hex = hashSum.digest('hex');
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: memo,
        data: Buffer.from(hex),
      }),
    );
  }

  return {
    instructions,
    signers,
  };
};
