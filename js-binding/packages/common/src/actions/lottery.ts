import {
  AccountInfo,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { programIds } from '../utils/programIds';
import { deserializeUnchecked, serialize } from 'borsh';
import BN from 'bn.js';
import { AccountParser } from '../contexts';
import moment from 'moment';
import { findProgramAddress, StringPublicKey, toPublicKey } from '../utils';

export const LOTTERY_PREFIX = 'lottery';

export enum LotteryState {
  Created = 0,
  Started,
  Ended,
}

export enum TicketState {
  Bought = 0,
  Winned,
  NotWinned,
  Claimed,
}

export class Ticket {
  owner: StringPublicKey;
  lotteryId: StringPublicKey;
  state: TicketState;
  winnedNFTNumber: BN;
  constructor(args: {
    owner: StringPublicKey;
    lotteryId: StringPublicKey;
    state: TicketState;
    winnedNFTNumber: BN;
  }) {
    this.owner = args.owner;
    this.lotteryId = args.lotteryId;
    this.state = args.state;
    this.winnedNFTNumber = args.winnedNFTNumber;
  }
}

export const LotteryParser: AccountParser = (
  pubkey: StringPublicKey,
  account: AccountInfo<Buffer>,
) => ({
  pubkey,
  account,
  info: decodeLottery(account.data),
});

export const decodeLottery = (buffer: Buffer) => {
  return deserializeUnchecked(
    LOTTERY_SCHEMA,
    LotteryData,
    buffer,
  ) as LotteryData;
};

export const decodeTicket = (buffer: Buffer) => {
  return deserializeUnchecked(LOTTERY_SCHEMA, Ticket, buffer) as Ticket;
};

export interface LotteryCountdownState {
  hours: number;
  minutes: number;
  seconds: number;
}

export class LotteryData {
  /// Pubkey of the authority with permission to modify this lottery.
  authority: StringPublicKey;
  /// Token mint for the SPL token being used to bid
  tokenMint: StringPublicKey;
  /// Token pool account to store deposited token amount
  tokenPool: StringPublicKey;
  /// Lottery store id
  lotteryStoreId: StringPublicKey;
  /// Slot time the lottery was officially ended by.
  endedAt: BN;
  /// End time is the cut-off point that the lottery is forced to end by.
  endLotteryAt: BN;
  /// The state the lottery is in, whether it has started or ended.
  state: LotteryState;
  /// Existing NFT amount
  nftAmount: BN;
  /// ticket price
  ticketPrice: BN;
  /// existing ticket amount
  ticketAmount: BN;
  /// existing ticket amount
  soldAmount: BN;

  constructor(args: {
    authority: StringPublicKey;
    tokenMint: StringPublicKey;
    tokenPool: StringPublicKey;
    lotteryStoreId: StringPublicKey;
    endedAt: BN;
    endLotteryAt: BN;
    state: LotteryState;
    nftAmount: BN;
    ticketPrice: BN;
    ticketAmount: BN;
    soldAmount: BN;
  }) {
    this.authority = args.authority;
    this.tokenMint = args.tokenMint;
    this.tokenPool = args.tokenPool;
    this.lotteryStoreId = args.lotteryStoreId;
    this.endedAt = args.endedAt;
    this.endLotteryAt = args.endLotteryAt;
    this.state = args.state;
    this.nftAmount = args.nftAmount;
    this.ticketPrice = args.ticketPrice;
    this.ticketAmount = args.ticketAmount;
    this.soldAmount = args.soldAmount;
  }
}
export const lotteryTimeToEnd = (endedAt: BN) => {
  const now = moment().unix();
  const ended = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const endAt = endedAt?.toNumber() || 0;

  let delta = endAt - now;

  if (!endAt || delta <= 0) return ended;

  const hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;

  const minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;

  const seconds = Math.floor(delta % 60);

  return { hours, minutes, seconds } as LotteryCountdownState;
};

export const lotteryEnded = (endedAt: BN) => {
  const now = moment().unix();
  if (!endedAt) return false;

  if (endedAt.toNumber() > now) return false;

  if (endedAt.toNumber() < now) {
    return true;
  }
};
export class CreateLotteryArgs {
  instruction: number = 0;
  /// End time is the cut-off point that the lottery is forced to end by. See LotteryData.
  endLotteryAt: BN;
  /// ticket price
  ticketPrice: BN;
  /// ticket amount for this lottery
  ticketAmount: number;
  /// ticket amount for this lottery
  nftAmount: number;

  constructor(args: {
    endLotteryAt: BN;
    ticketPrice: BN;
    ticketAmount: number;
    nftAmount: number;
  }) {
    this.endLotteryAt = args.endLotteryAt;
    this.ticketPrice = args.ticketPrice;
    this.ticketAmount = args.ticketAmount;
    this.nftAmount = args.nftAmount;
  }
}

export const LOTTERY_SCHEMA = new Map<any, any>([
  [
    CreateLotteryArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['endLotteryAt', 'u64'],
        ['ticketPrice', 'u64'],
        ['ticketAmount', 'u32'],
        ['nftAmount', 'u32'],
      ],
    },
  ],
  [
    LotteryData,
    {
      kind: 'struct',
      fields: [
        ['authority', 'pubkeyAsString'],
        ['tokenMint', 'pubkeyAsString'],
        ['tokenPool', 'pubkeyAsString'],
        ['lotteryStoreId', 'pubkeyAsString'],
        ['endedAt', 'u64'],
        ['endLotteryAt', 'u64'],
        ['state', 'u8'],
        ['nftAmount', 'u64'],
        ['ticketPrice', 'u64'],
        ['ticketAmount', 'u64'],
        ['soldAmount', 'u64'],
      ],
    },
  ],
  [
    Ticket,
    {
      kind: 'struct',
      fields: [
        ['owner', 'pubkeyAsString'],
        ['lotteryId', 'pubkeyAsString'],
        ['state', 'u8'],
        ['winnedNFTNumber', 'u64'],
      ],
    },
  ],
]);

export const decodeLotteryData = (buffer: Buffer) => {
  return deserializeUnchecked(
    LOTTERY_SCHEMA,
    LotteryData,
    buffer,
  ) as LotteryData;
};

export async function createLottery(
  settings: CreateLotteryArgs,
  creator: StringPublicKey,
  lotteryStoreId: StringPublicKey,
  tokenMint: StringPublicKey,
  authority: StringPublicKey,
  tokenPoolKey: StringPublicKey,
  instructions: TransactionInstruction[],
) {
  const lotteryProgramId = programIds().lottery;
  const tokenProgramId = programIds().token;

  const data = Buffer.from(serialize(LOTTERY_SCHEMA, settings));

  const lotteryKey: StringPublicKey = (
    await findProgramAddress(
      [
        Buffer.from(LOTTERY_PREFIX),
        toPublicKey(lotteryProgramId).toBuffer(),
        toPublicKey(lotteryStoreId).toBuffer(),
      ],
      toPublicKey(lotteryProgramId),
    )
  )[0];
  const keys = [
    {
      pubkey: toPublicKey(creator),
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(lotteryKey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(lotteryStoreId),
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
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(authority),
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
      programId: toPublicKey(lotteryProgramId),
      data: data,
    }),
  );
}

export async function startLottery(
  creator: StringPublicKey,
  lotteryStore: StringPublicKey,
  instructions: TransactionInstruction[],
) {
  const lotteryProgramId = programIds().lottery;

  const data = Buffer.from([2]);

  const lotteryKey: StringPublicKey = (
    await findProgramAddress(
      [
        Buffer.from(LOTTERY_PREFIX),
        toPublicKey(lotteryProgramId).toBuffer(),
        toPublicKey(lotteryStore).toBuffer(),
      ],
      toPublicKey(lotteryProgramId),
    )
  )[0];

  const keys = [
    {
      pubkey: toPublicKey(creator),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(lotteryKey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(lotteryProgramId),
      data: data,
    }),
  );
}

export async function endLottery(
  creator: StringPublicKey,
  lotteryStore: StringPublicKey,
  instructions: TransactionInstruction[],
) {
  const lotteryProgramId = programIds().lottery;

  const data = Buffer.from([4]);

  const lotteryKey: StringPublicKey = (
    await findProgramAddress(
      [
        Buffer.from(LOTTERY_PREFIX),
        toPublicKey(lotteryProgramId).toBuffer(),
        toPublicKey(lotteryStore).toBuffer(),
      ],
      toPublicKey(lotteryProgramId),
    )
  )[0];

  const keys = [
    {
      pubkey: toPublicKey(creator),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(lotteryKey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(lotteryProgramId),
      data: data,
    }),
  );
}

export async function setLotteryAuthority(
  lottery: StringPublicKey,
  currentAuthority: StringPublicKey,
  newAuthority: StringPublicKey,
  instructions: TransactionInstruction[],
) {
  const lotteryProgramId = programIds().lottery;

  const data = Buffer.from([1]);

  const keys = [
    {
      pubkey: toPublicKey(lottery),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(currentAuthority),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(newAuthority),
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(lotteryProgramId),
      data: data,
    }),
  );
}

export function getTicket(
  ticket: StringPublicKey,
  bidderPubkey: StringPublicKey,
  bidderTokenPubkey: StringPublicKey,
  poolTokenPubkey: StringPublicKey,
  tokenMintPubkey: StringPublicKey,
  transferAuthority: StringPublicKey,
  lottery: StringPublicKey,
  instructions: TransactionInstruction[],
) {
  const lotteryProgramId = programIds().lottery;

  const data = Buffer.from([3]);

  const keys = [
    {
      pubkey: toPublicKey(lottery),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(ticket),
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(bidderPubkey),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(bidderTokenPubkey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(poolTokenPubkey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(tokenMintPubkey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(transferAuthority),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: programIds().token,
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
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(lotteryProgramId),
      data: data,
    }),
  );
}

export function claimNFT(
  lottery: StringPublicKey,
  lotteryStore: StringPublicKey,
  claimer: StringPublicKey,
  ticket: StringPublicKey,
  nftMeta: StringPublicKey,
  nftMint: StringPublicKey,
  nftPool: StringPublicKey,
  userNft: StringPublicKey,
  instructions: TransactionInstruction[],
) {
  const lotteryProgramId = programIds().lottery;

  const data = Buffer.from([5]);

  const keys = [
    {
      pubkey: toPublicKey(lottery),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(lotteryStore),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(claimer),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(ticket),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(nftMeta),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(nftMint),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(nftPool),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(userNft),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: programIds().token,
      isSigner: false,
      isWritable: false,
    },
  ];
  console.log(keys);
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(lotteryProgramId),
      data: data,
    }),
  );
}

export function claimToken(
  lottery: StringPublicKey,
  claimer: StringPublicKey,
  ticket: StringPublicKey,
  poolToken: StringPublicKey,
  userToken: StringPublicKey,
  instructions: TransactionInstruction[],
) {
  const lotteryProgramId = programIds().lottery;

  const data = Buffer.from([6]);

  const keys = [
    {
      pubkey: toPublicKey(lottery),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(claimer),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(ticket),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(poolToken),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(userToken),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: programIds().token,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(lotteryProgramId),
      data: data,
    }),
  );
}
