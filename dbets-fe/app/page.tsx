'use client';
import React, { use } from 'react';
import { useEffect, useState, useRef } from 'react';
import { Contract, ethers } from 'ethers';
import { JsonRpcSigner } from '@ethersproject/providers';
import ConsumerContractABI from '../don-request/FunctionsConsumer.json';
import OracleABI from '../don-request/FunctionsOracle.json';
import SourceString from '../don-request/SourceString';
import ethcrypto from 'eth-crypto';

export default function Home() {
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);
  const [address, setAddress] = useState('Not Connected');
  const [store, setStore] = useState<any>({});
  const [eventRequestId, setEventRequestId] = useState<any>(null);
  const [requestPending, setRequestPending] = useState(false);

  const consumerAddress = '0x37ae5f238366b74ea6EC8936C5173D707840eDFA';
  const oracleAddress = '0xeA6721aC65BCeD841B8ec3fc5fEdeA6141a0aDE4';
  const oracleABI = OracleABI.abi;
  const DONPublicKey =
    '0xa30264e813edc9927f73e036b7885ee25445b836979cb00ef112bc644bd16de2db866fa74648438b34f52bb196ffa386992e94e0a3dc6913cee52e2e98f1619c';

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        'any'
      );

      // Set event listeners
      if (requestPending) {
        console.log('setting listeners');
        const oracleInstance = new ethers.Contract(
          oracleAddress,
          oracleABI,
          provider
        );

        oracleInstance.on('UserCallbackError', (eventRequestId, msg) => {
          // Handle 'UserCallbackError' event
          console.log('Oracle UserCallbackError', eventRequestId, msg);
          store[eventRequestId] = { userCallbackError: true, msg: msg };
        });

        oracleInstance.on('UserCallbackRawError', (eventRequestId, msg) => {
          // Handle 'UserCallbackRawError' event
          console.log('Oracle UserCallbackRawError', eventRequestId, msg);
          store[eventRequestId] = { userCallbackRawError: true, msg: msg };
        });
      }

      if (!signer) {
        const signer = provider.getSigner();
        signer
          .getAddress()
          .then(async (res) => {
            setAddress(res);
            console.log('signer', signer);
            const balance = await signer.getBalance();
            console.log('balance', balance);
            setSigner(signer);
          })
          .catch((err) => {
            console.log('oops' + err);
          });
      }
    }
  }, [requestPending]);

  async function requestTest() {
    if (signer && address !== 'Not Connected') {
      const consumerContract = new ethers.Contract(
        consumerAddress,
        ConsumerContractABI.abi,
        signer
      );

      consumerContract.on('OCRResponse', (eventRequestId, response, err) => {
        console.log('got response from event id', eventRequestId);
        if (response !== '0x') {
          console.log(
            `Response returned to client contract represented as a hex string: ${BigInt(
              response
            ).toString()}`
          );
        }
        if (err !== '0x') {
          console.error(
            `Error message returned to client contract: "${Buffer.from(
              err.slice(2),
              'hex'
            )}"\n`
          );
        }

        store[eventRequestId] = { response: response, err: err };
      });

      const secrets: string[] = [
        'https://chainlink-spring-2023-secrets.s3.eu-central-1.amazonaws.com/offchain-secrets.json'
      ];

      async function encrypt(readerPublicKey, message) {
        const encrypted = await ethcrypto.encryptWithPublicKey(
          readerPublicKey,
          message
        );
        return ethcrypto.cipher.stringify(encrypted);
      }

      const encryptedSecrets =
        '0x' + (await encrypt(DONPublicKey.slice(2), secrets[0]));

      console.log(JSON.stringify(encryptedSecrets));

      const transaction = await consumerContract.executeRequest(
        SourceString, // Source code needed to run
        encryptedSecrets, // Offchain secrets
        [], // Chainlink Functions request args
        921, // Subscription ID
        250000, // Gas limit for the transaction
        {
          gasLimit: 500000 // Gas limit for the Chainlink Functions request
        }
      );

      const requestTxReceipt = await transaction.wait(2);
      console.log('Transaction mined:', requestTxReceipt);

      const requestEvent = requestTxReceipt.events.filter(
        (event) => event.event === 'RequestSent'
      )[0];

      const requestId = requestEvent.args.id;
      console.log(`\nRequest ${requestId} initiated`);
      setRequestPending(true);

      console.log(`Waiting for fulfillment...\n`);
    } else {
      console.log('Signer not defined');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-20 ">
      <h1 className="text-8xl font-bold">Welcome to dBets!</h1>

      <div>
        <button
          className="p-4 bg-white text-neutral-950 rounded-full"
          onClick={requestTest}
        >
          Computation test
        </button>
      </div>

      <p> Address {address}</p>

      <p>10/10 Gud design -Kseniovska</p>
    </main>
  );
}
