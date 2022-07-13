import {
  AccountInfo,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { programIds } from '../utils/programIds';
import { deserializeUnchecked, serialize } from 'borsh';
import BN from 'bn.js';
import { AccountParser } from '../contexts';
import { StringPublicKey, toPublicKey } from '../utils';
// import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const STORE_PREFIX = 'store';

export class StoreData {
  owner: StringPublicKey;
  /// Pubkey of the authority with permission to modify this store.
  authority: StringPublicKey;
  /// Token mint for the SPL token being used to bid
  nftAmount: BN;
  /// Token pool account to store deposited token amount
  bump: number;

  constructor(args: {
    owner: StringPublicKey;
    authority: StringPublicKey;
    nftAmount: BN;
    bump: number;
  }) {
    this.owner = args.owner;
    this.authority = args.authority;
    this.nftAmount = args.nftAmount;
    this.bump = args.bump;
  }
}

export class NFTMeta {
  /// Pubkey of the authority with permission to modify this store.
  storeId: StringPublicKey;
  nftNumber: BN;
  /// The name of the asset
  name: string;
  /// The symbol for the asset
  symbol: string;
  /// URI pointing to JSON representing the asset
  uri: string;
  /// Pubkey for mint address
  mint: StringPublicKey;
  /// token pool to store current nft
  tokenPool: StringPublicKey;
  /// Pubkey of the authority with permission to modify this store.
  authority: StringPublicKey;
  /// flag of current nft is sold or not
  existNft: number;
  bump: number;

  constructor(args: {
    storeId: StringPublicKey;
    nftNumber: BN;
    name: string;
    symbol: string;
    uri: string;
    mint: StringPublicKey;
    tokenPool: StringPublicKey;
    authority: StringPublicKey;
    existNft: number;
    bump: number;
  }) {
    this.storeId = args.storeId;
    this.nftNumber = args.nftNumber;
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.mint = args.mint;
    this.tokenPool = args.tokenPool;
    this.authority = args.authority;
    this.existNft = args.existNft;
    this.bump = args.bump;
  }
}

export class CreateStoreArgs {
  instruction: number = 0;
  bump: number;
  /// End time is the cut-off point that the store is forced to end by. See StoreData.

  constructor(args: { bump: number }) {
    this.bump = args.bump;
  }
}

export class MintNFTArgs {
  instruction: number;
  name: string;
  symbol: string;
  uri: string;
  bump: number;
  /// End time is the cut-off point that the store is forced to end by. See StoreData.

  constructor(args: {
    instruction: number;
    name: string;
    symbol: string;
    uri: string;
    bump: number;
  }) {
    this.instruction = args.instruction;
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.bump = args.bump;
  }
}

export const STORE_SCHEMA = new Map<any, any>([
  [
    CreateStoreArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['bump', 'u8'],
      ],
    },
  ],
  [
    StoreData,
    {
      kind: 'struct',
      fields: [
        ['owner', 'pubkeyAsString'],
        ['authority', 'pubkeyAsString'],
        ['nftAmount', 'u64'],
        ['bump', 'u8'],
      ],
    },
  ],
]);

export const MINT_NFT_SCHEMA = new Map<any, any>([
  [
    MintNFTArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['name', 'string'],
        ['symbol', 'string'],
        ['uri', 'string'],
        ['bump', 'u8'],
      ],
    },
  ],
  [
    NFTMeta,
    {
      kind: 'struct',
      fields: [
        ['storeId', 'pubkeyAsString'],
        ['nftNumber', 'u64'],
        ['name', 'string'],
        ['symbol', 'string'],
        ['uri', 'string'],
        ['mint', 'pubkeyAsString'],
        ['tokenPool', 'pubkeyAsString'],
        ['authority', 'pubkeyAsString'],
        ['existNft', 'u8'],
        ['bump', 'u8'],
      ],
    },
  ],
]);

export const decodeStoreData = (buffer: Buffer) => {
  return deserializeUnchecked(STORE_SCHEMA, StoreData, buffer) as StoreData;
};
export const decodeNFTMetaData = (buffer: Buffer) => {
  return deserializeUnchecked(MINT_NFT_SCHEMA, NFTMeta, buffer) as NFTMeta;
};

export const StoreParser: AccountParser = (
  pubkey: StringPublicKey,
  account: AccountInfo<Buffer>,
) => ({
  pubkey,
  account,
  info: decodeStoreData(account.data),
});

export async function createStore(
  settings: CreateStoreArgs,
  creator: StringPublicKey,
  storeid: StringPublicKey,
  authority: StringPublicKey,
  instructions: TransactionInstruction[],
) {
  const storeProgramId = programIds().store;

  const data = Buffer.from(serialize(STORE_SCHEMA, settings));
  console.log(storeid);
  const keys = [
    {
      pubkey: toPublicKey(creator),
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(storeid),
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(authority),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(storeProgramId),
      data: data,
    }),
  );
}

export async function mintNFT(
  settings: MintNFTArgs,
  creator: StringPublicKey,
  nftmeta: StringPublicKey,
  authority: StringPublicKey,
  storeid: StringPublicKey,
  tokenMint: StringPublicKey,
  tokenPoolKey: StringPublicKey,
  instructions: TransactionInstruction[],
) {
  const storeProgramId = programIds().store;
  const tokenProgramId = programIds().token;

  const data = Buffer.from(serialize(MINT_NFT_SCHEMA, settings));

  const keys = [
    {
      pubkey: toPublicKey(creator),
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(nftmeta),
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(authority),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(storeid),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(tokenMint),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(tokenPoolKey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(tokenProgramId),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(storeProgramId),
      data: data,
    }),
  );
}

export async function updateMint(
  settings: MintNFTArgs,
  wallet: StringPublicKey,
  nftmeta: StringPublicKey,
  instructions: TransactionInstruction[],
) {
  const storeProgramId = programIds().store;

  const data = Buffer.from(serialize(MINT_NFT_SCHEMA, settings));

  const keys = [
    {
      pubkey: toPublicKey(wallet),
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(nftmeta),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(storeProgramId),
      data: data,
    }),
  );
}
