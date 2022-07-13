import React, { useState } from 'react';
import {
  Button,
  Form,
} from 'antd';
import {
  useConnection,
  toPublicKey,
  programIds,
  decodeStoreData,
  createStore,
} from '@oyster/common';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, AccountInfo, PublicKey } from '@solana/web3.js';
import { getFilteredProgramAccounts } from '@solana/spl-name-service';
import { makeStore } from '../../actions';

export const StoreListView = () => {

  const connection = useConnection();
  const wallet = useWallet();

  const [stores, setStores] = useState<{publicKey: PublicKey; accountInfo: AccountInfo<Buffer>;}[]>([]);

  React.useEffect(() => {
    

    if (stores.length == 0) {
      loadStores();
    }
  });

  function loadStores() {
    const filters = [
      {
        memcmp: {
          offset: 0,
          bytes: wallet.publicKey?.toBase58()
        }
      },
    ];

    getFilteredProgramAccounts(connection, toPublicKey(programIds().store), filters)
      .then((storeAccounts:{ publicKey: PublicKey; accountInfo: AccountInfo<Buffer>; }[])=>{
        setStores(storeAccounts);
      })
      .catch((error:any)=>{
        console.log(error);
      });
  }

  async function createStore() {
    let storeid = '';
    const storeProgramId = programIds().store;

    makeStore(connection, wallet).then(({ txid, slot, store }) => {
      storeid = store;
    }).catch((reason) => {
      console.log(reason)
    }).finally(async () => {
      if (storeid != "") {
        try {
          var account = await loadAccount(connection, toPublicKey(storeid), toPublicKey(storeProgramId));
          alert("successfully created store");
          loadStores();
        }
        catch (err: any) {
          console.log(err);
          alert("failed created store");
        }
      }
    });
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
    var decoded = decodeStoreData(Buffer.from(accountInfo.data));
    console.log(decoded);
    return Buffer.from(accountInfo.data);
  }

  return (
    <>
      <div>
        { stores.map(store => 
          <div className='store-item'>
            <span>Store {stores.indexOf(store) + 1}</span>
            <div>Total NFTs: {decodeStoreData(store.accountInfo.data).nftAmount.toNumber()} </div>
            <div>Store ID: {store.publicKey.toBase58()}</div>
            <Button className='btn-detail-store' href={'/#/store-detail/' + store.publicKey.toBase58()}>Detail</Button>
            </div>)}
        <Button className='btn-create-store' onClick={e => createStore()}>Create New Store</Button>
      </div>
    </>
  );
};

