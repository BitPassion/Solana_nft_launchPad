import React, { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Form,
} from 'antd';
import {
  useConnection,
  toPublicKey,
  programIds,
  decodeTicket,
  Ticket,
  TicketState,
  LotteryData,
  decodeLotteryData,
  decodeNFTMetaData,
  useUserAccounts,
} from '@oyster/common';
import { useWallet } from '@solana/wallet-adapter-react';
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import { getFilteredProgramAccounts } from '@solana/spl-name-service';
import { claimDepositedToken, claimGainedNft, claimWinnedNFT, getTicketFromLottery } from '../../actions';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import moment from 'moment';


export const ClaimView = () => {
  const { id } = useParams<{id:string}>();
  
  const connection = useConnection();
  const wallet = useWallet();
  const userTokenAccounts = useUserAccounts();
  const [lotteryID,] = useState(id);
  const [lotteryData, setLotteryData] = useState({} as any);
  const [tickets, setTickets] = useState([] as any[]);

  useEffect(() => {
    if(wallet.connected && lotteryID != ""){
      loadOfClaim();
    }

  }, [lotteryID, wallet.connected]);

  async function loadOfClaim() {
    loadLotteryDataOfClaim();
    loadTicketsOfClaim();
  }
  async function loadLotteryDataOfClaim(){
    let lotteryBuffer = await loadAccount(connection,toPublicKey(lotteryID),toPublicKey(programIds().lottery));
    let lotteryData = decodeLotteryData(lotteryBuffer);
    setLotteryData(lotteryData);
  }

  async function loadTicketsOfClaim() {
    console.log("loading tickets ...")
    const filters = [
      {
        dataSize: 80
      },
      {
        memcmp: {
          offset: 0,
          bytes: wallet.publicKey?.toBase58()
        }
      },
      {
        memcmp: {
          offset: 32,
          bytes: lotteryID
        }
      },
    ];
    getFilteredProgramAccounts(connection,toPublicKey(programIds().lottery),filters)
    .then((ticketAccounts:{ publicKey: PublicKey; accountInfo: AccountInfo<Buffer>; }[])=>{
      console.log("bought ticket amount",ticketAccounts.length)
      let _tickets:Ticket[] = [];
      ticketAccounts.forEach((ticket)=>{
        const ticketData:any = decodeTicket(ticket.accountInfo.data);
        ticketData.ticketId = ticket.publicKey.toBase58();

        _tickets.push(ticketData);
      })
      setTickets(_tickets);
    })
    .catch((error:any)=>{
      console.log(error);
    })
  }
  
  async function claimTokenOne(ticketId:string) {
    console.log("claimming ...")
    claimDepositedToken(
      connection,
      wallet,
      lotteryID,
      ticketId,
      lotteryData
    )
    .then(({txid,slot})=>{
      console.log("claim txid - ",txid);
      loadTicketsOfClaim();
    })
    .catch((error)=>{
      console.log(error);
      loadTicketsOfClaim();
    })
  }
  async function claimNFTOne(ticketId:string, ticketNumber:number) {
    console.log("claimming ...")
    const filters = [
      {
        dataSize: 392,
      },
      {
        memcmp: {
          offset: 0,
          bytes: lotteryData.lotteryStoreId
        }
      },
      
    ];
    const nftMetaAccounts = await getFilteredProgramAccounts(connection,toPublicKey(programIds().store),filters);
    let nftMetaId:any = "";
    let nftMetaData:any= null;

    nftMetaAccounts.forEach((nftMetaAccount)=>{
      const _nftMetaId = nftMetaAccount.publicKey.toBase58();
      const _nftMetaData:any = decodeNFTMetaData(nftMetaAccount.accountInfo.data);
      
      if(_nftMetaData.nftNumber.toNumber() === ticketNumber){
        nftMetaId = _nftMetaId;
        nftMetaData = _nftMetaData;
      }
    })
    let nftTokenAccount = userTokenAccounts.accountByMint.get(nftMetaData.mint)?.pubkey;
    if(nftMetaId === ""){
      console.log("not found nft meta");
      return;
    }
    
    claimGainedNft(
      connection,
      wallet,
      lotteryID,
      ticketId,
      nftTokenAccount,
      nftMetaId,
      nftMetaData,
      lotteryData
    )
    .then(({txid,slot})=>{
      console.log("claim txid - ",txid);
      loadTicketsOfClaim();
    })
    .catch((error)=>{
      console.log(error);
      loadTicketsOfClaim();
    })
  }
  async function loadAccount(
    connection: Connection,
    address: PublicKey,
    programId: PublicKey,
  ): Promise<Buffer> {
    const accountInfo = await connection.getAccountInfo(address);
    if (accountInfo === null) {
      throw new Error('Failed to find account');
    }
  
    if (!accountInfo.owner.equals(programId)) {
      throw new Error(`Invalid owner: ${JSON.stringify(accountInfo.owner)}`);
    }
  
    return Buffer.from(accountInfo.data);
  }
  async function getTicketOne() {
    getTicketFromLottery(connection, wallet, lotteryID, lotteryData)
      .then(({txid,slot})=>{
        console.log("txid - ",txid);
        loadOfClaim();
      })
      .catch((error)=>{
        console.log(error);
      })
  }
  function getLotteryStatus(lotteryData:any){
    const curTimestamp = moment().unix();
    if(lotteryData.endLotteryAt.toNumber() < curTimestamp){
      return "Ended";
    }
    return lotteryData.state === 0?"Created":lotteryData.state === 1?"Started":"Ended";
  }
  function getTicketStatus(state:string){
    return state === "0"?"Bought":state === "1"?"Winned":state === "2"?"NotWinned":"Claimed";
  }
  return (
    <>
      <div>
        <br />
        {
          !wallet.connected?"please connect your wallet":
          lotteryData.state === undefined?"can't load lottery data":
          getLotteryStatus(lotteryData) == "Started" ?
            <div>
              <Button htmlType="submit" onClick={e => getTicketOne()}>
                Get Ticket
              </Button>
              <br />
              <div>
                My Tickets : {tickets.length}
              </div>
              {
                tickets.map((ticket) => {
                  return (
                    <div >
                      <br />
                      ticket id - {ticket.ticketId}
                      <br />
                    </div>
                  )
                })
              }
            </div>

            : getLotteryStatus(lotteryData) == "Ended" ?
              <div>
                <br />
                {
                  tickets.map((ticket) => {
                    return (
                      <div >
                        <br />
                        ticket id - {ticket.ticketId}
                        <br />
                        ticket status - {getTicketStatus(ticket.state.toString())}
                        <br />
                        {
                          ticket.state === TicketState.Winned ?
                            <div>
                              <br />
                              winned nft number - {ticket.winnedNFTNumber.toNumber()}
                              <br />
                              <Button htmlType="submit" onClick={e => claimNFTOne(ticket.ticketId, ticket.winnedNFTNumber.toNumber())}>
                                Claim NFT
                              </Button>
                            </div>
                            : ticket.state === TicketState.NotWinned ?
                              <Button htmlType="submit" onClick={e => claimTokenOne(ticket.ticketId)}>
                                claim token
                              </Button>
                              : ticket.state === TicketState.Claimed ? "Claimed" : "Bought"
                        }
                        <br />
                        -----------------------------------------------------------
                        <br />
                      </div>
                    )
                  })
                }
                {
                  tickets.length == 0 && "No tickets"
                }
              </div>
              : "Not started yet"

              
        }
        <br />
        <Link to={`/lottery`}>Back</Link>
      </div>
    </>
  );
};

