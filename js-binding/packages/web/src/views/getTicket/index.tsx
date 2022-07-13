import React, { useState } from 'react';
import {
  Button,
  Input,
  Form,
} from 'antd';
import {
  useConnection,
  toPublicKey,
  programIds,
  LotteryData,
  decodeLotteryData,
} from '@oyster/common';
import { useWallet } from '@solana/wallet-adapter-react';
import { getTicketFromLottery, startCreatedLottery } from '../../actions';
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import { getFilteredProgramAccounts } from '@solana/spl-name-service';


export const GetTicketView = () => {
  const [form] = Form.useForm();
  
  const connection = useConnection();
  const wallet = useWallet();
  const [lotteryID, setLotteryID] = useState('');
  const [lotteryStatus, setLotteryStatus] = useState('');
  const [lotteryStoreId, setLotteryStoreId] = useState('');
  const [nftAmount, setNFTAmount] = useState(0);
  const [ticketAmount, setTicketAmount] = useState(0);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [boughtTicketAmount, setBoughtTicketAmount] = useState(0);
  const [lotteryData, setLotteryData] = useState({} as LotteryData);

  React.useEffect(() => {
    let lotteryid = localStorage.getItem('lotteryid');
    setLotteryID(lotteryid ? lotteryid : '');
  });
  
  function getLotteryStatus(state:string){
    return state === "0"?"Created":state === "1"?"Started":"Ended";
  }
  async function loadLotteryData() {
    console.log("loading ...")
    let lotteryBuffer = await loadAccount(connection,toPublicKey(lotteryID),toPublicKey(programIds().lottery));
    let lotteryData = decodeLotteryData(lotteryBuffer);
    setLotteryData(lotteryData);
    setLotteryStatus(getLotteryStatus(lotteryData.state.toString()));
    setLotteryStoreId(lotteryData.lotteryStoreId);
    setNFTAmount(lotteryData.nftAmount.toNumber());
    setTicketAmount(lotteryData.ticketAmount.toNumber());
    setTicketPrice(lotteryData.ticketPrice.toNumber() / Math.pow(10,9));

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
      
      setBoughtTicketAmount(ticketAccounts.length);

    })
    .catch((error:any)=>{
      console.log(error);
    })
  }
  async function getTicketOne() {
    getTicketFromLottery(connection, wallet, lotteryID, lotteryData)
      .then(({txid,slot})=>{
        console.log("txid - ",txid);
        loadLotteryData();
      })
      .catch((error)=>{
        console.log(error);
        loadLotteryData();
      })
  }
  async function start() {
    startCreatedLottery(connection, wallet, lotteryStoreId)
    .then(({txid,slot})=>{
      console.log("txid - ",txid);
      loadLotteryData();
    })
    .catch((error)=>{
      console.log(error);
      loadLotteryData();
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

  return (
    <>
      <div>
        <div style={{marginBottom: 30 + 'px'}}>Lottery ID
          <Input value={lotteryID} defaultValue={lotteryID} onChange={e=> setLotteryID(e.target.value)} />
        </div>
        <Form
          className='get-ticket'
          form={form} 
          name="basic"
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
          initialValues={{
            remember: true,
          }}
          autoComplete="off">
          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <Button htmlType="submit" onClick={e => loadLotteryData()}>
              Load lottery
            </Button>
            { 
            <div >
                <br/>
                lottery status - {lotteryStatus}
                <br/>
                lottery store id - {lotteryStoreId}
                <br/>
                nft amount - {nftAmount}
                <br/>
                ticket amount - {ticketAmount}
                <br/>
                ticket price - {ticketPrice} SOL
            </div>
            }
          </Form.Item>
            {
              lotteryStatus == ""?"": lotteryStatus == "Created" ? 
              <Form.Item
                wrapperCol={{
                  offset: 8,
                  span: 16,
                }}
              >
                <Button htmlType="submit" onClick={e => start()}>
                  Start Lottery
                </Button>
              </Form.Item>
              :
              <Form.Item
                wrapperCol={{
                  offset: 8,
                  span: 16,
                }}
              >
                <Button htmlType="submit" onClick={e => getTicketOne()}>
                  Get Ticket
                </Button>
                { 
                <div >
                    <br/>
                    bought ticket amount - {boughtTicketAmount}
                    <br/>
                </div>
                }
              </Form.Item>
            }
        </Form>
        
      </div>
    </>
  );
};

